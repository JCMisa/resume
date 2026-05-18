/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { resumes } from "@/config/schema";
import { and, eq } from "drizzle-orm";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeAndStoreResumeAction(
  rawText: string,
  fileName: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");

    const systemPrompt = `
      You are an elite corporate recruiter and professional resume parsing engine. 
      Analyze the raw text extracted from a user's resume PDF and convert it into structured content arrays alongside a critical, honest resume audit.

      Analyze layout alignment, career gaps, wording quality, and best industry practices. 
      You must respond ONLY with a clean JSON object adhering strictly to the following schema format:

      {
        "content": {
          "fullName": "string",
          "email": "string",
          "skills": ["string"],
          "experience": [{ "company": "string", "role": "string", "duration": "string", "bullets": ["string"] }],
          "education": [{ "institution": "string", "degree": "string", "year": "string" }]
        },
        "analysis": {
          "overallScore": number (1 to 100),
          "readability": "string (e.g., Excellent, Good, Needs Improvement)",
          "keyKeywords": ["string"],
          "summary": "string",
          "strengths": ["string"],
          "weaknesses": ["string"],
          "improvements": [{ "section": "string", "current": "string", "suggested": "string", "reason": "string" }],
          "gapsDetected": ["string"]
        }
      }

      RAW RESUME TEXT INPUT:
      ${rawText}
    `;

    // Calling Gemini 3 Flash requesting structured JSON output
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText)
      throw new Error("Empty data returned from Gemini framework.");

    const parsedData = JSON.parse(resultText);

    // Drizzle Standard Query Insertion Mapping
    const [insertedResume] = await db
      .insert(resumes)
      .values({
        userId: userId,
        title: fileName.replace(".pdf", "") + " (AI Analyzed)",
        category: "General",
        content: parsedData.content,
        analysis: parsedData.analysis,
      })
      .returning();

    return { success: true, data: insertedResume };
  } catch (error: any) {
    console.error("Gemini/Drizzle Pipeline Failure:", error);
    return {
      success: false,
      error: error.message || "Pipeline processing failure.",
    };
  }
}

export async function getResumeDetailsAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access.");

    // Standard Drizzle SQL-like querying style
    const [resumeData] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

    if (!resumeData) {
      return { success: false, error: "Resume not found or access denied." };
    }

    return { success: true, data: resumeData };
  } catch (error: any) {
    console.error("Fetch Resume Details Failure:", error);
    return {
      success: false,
      error: error.message || "Failed to load resume details.",
    };
  }
}

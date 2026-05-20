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
  fileUrl: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");

    // 🚀 ALIGNED PROMPT: Matches the exact object parameters expected by the Form view state layers
    const systemPrompt = `
      You are an elite corporate recruiter and professional resume parsing engine. 
      Analyze the raw text extracted from a user's resume PDF and convert it into structured content arrays alongside a critical, honest resume audit.

      Analyze layout alignment, career gaps, wording quality, and best industry practices. 
      You must respond ONLY with a clean JSON object adhering strictly to the following schema format:

      {
        "content": {
          "personalDetails": {
            "name": "string",
            "phone": "string",
            "email": "string",
            "address": "string",
            "links": [{ "label": "string", "url": "string" }]
          },
          "professionalSummary": "string",
          "skills": [{ "category": "string", "value": "string" }],
          "experiences": [{ "company": "string", "role": "string", "duration": "string", "bullets": ["string"] }],
          "projects": [{ "title": "string", "duration": "string", "description": ["string"] }],
          "educations": [{ "schoolName": "string", "course": "string", "major": "string", "duration": "string", "gwa": "string" }],
          "certificates": [{ "title": "string", "issuedDate": "string", "description": "string" }]
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

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText)
      throw new Error("Empty data returned from Gemini framework.");

    const parsedData = JSON.parse(resultText);

    // 🛠️ BACKFILL ATOMIC IDs & DEFAULT SORT ORDER FOR THE DND SYSTEM
    // Since Gemini creates raw objects, we map through arrays to append random crypto IDs
    // so the frontend Drag-and-Drop tracking indexes have structural reference tags right away.
    const content = parsedData.content;

    if (content.skills)
      content.skills = content.skills.map((s: any) => ({
        id: globalThis.crypto.randomUUID(),
        ...s,
      }));
    if (content.experiences)
      content.experiences = content.experiences.map((e: any) => ({
        id: globalThis.crypto.randomUUID(),
        ...e,
      }));
    if (content.projects)
      content.projects = content.projects.map((p: any) => ({
        id: globalThis.crypto.randomUUID(),
        ...p,
      }));
    if (content.educations)
      content.educations = content.educations.map((ed: any) => ({
        id: globalThis.crypto.randomUUID(),
        ...ed,
      }));
    if (content.certificates)
      content.certificates = content.certificates.map((c: any) => ({
        id: globalThis.crypto.randomUUID(),
        ...c,
      }));

    // Injecting the initial default render positions order sequence list index arrays
    content.sectionOrder = [
      "personal",
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certificates",
    ];

    // Drizzle Insertion
    const [insertedResume] = await db
      .insert(resumes)
      .values({
        userId: userId,
        title: fileName.replace(".pdf", "") + " (AI Analyzed)",
        category: "General",
        fileUrl: fileUrl,
        status: "parsed", // Explicitly tag this row as an AI incoming file upload asset
        content: content,
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

export async function createManualResumeAction(payload: {
  title: string;
  category: string;
  content: {
    personalDetails?: any;
    professionalSummary?: string;
    skills?: any[];
    experiences?: any[];
    projects?: any[];
    educations?: any[];
    certificates?: any[];
    sectionOrder: string[];
  };
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access profile configuration.");

    const [newRecord] = await db
      .insert(resumes)
      .values({
        userId: userId,
        title: payload.title || "Untitled Form Resume",
        category: payload.category || "General",
        // fileUrl block remains null initially since this is a manual form creation flow without file upload
        status: "created", // Tags this item explicitly as a custom built form
        content: payload.content, // Injects your nested structural forms state arrays
        // Analysis block remains undefined initially until they trigger an explicit AI review request
      })
      .returning();

    return { success: true, data: newRecord };
  } catch (error: any) {
    console.error("Studio Creation Pipeline failure:", error);
    return {
      success: false,
      error: error.message || "Failed to catalog manual resume data records.",
    };
  }
}

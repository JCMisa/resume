/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { interviews, interviewResults } from "@/config/schema";
import { GoogleGenAI } from "@google/genai";
import { eq, and } from "drizzle-orm";
import arcjet, { shield, tokenBucket, request, detectBot } from "@arcjet/next";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"], // Unique identifier rate-limiting fingerprint
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      // Restrict bots from hitting your private API evaluation routes
      deny: ["CATEGORY:AI", "CURL"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 1, // Refill 1 token
      interval: "1h", // Every hour
      capacity: 1, // Maximum burst size capacity is 1 request
    }),
  ],
});

// 1. Initial Launch Registration
export async function createInterviewSessionAction(payload: {
  jobRole: string;
  jobDescription: string;
  resumeText: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access.");

    const decision = await aj.protect(await request(), {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error(
          `Rate limit exceeded. You can have a new session again after an hour. Remaining tokens: 0`,
        );
      }
      throw new Error("Request rejected by security gate.");
    }

    const [newSession] = await db
      .insert(interviews)
      .values({
        userId,
        jobRole: payload.jobRole,
        jobDescription: payload.jobDescription,
        resumeText: payload.resumeText,
        status: "in-progress",
      })
      .returning();

    return { success: true, id: newSession.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Wrap Up Analysis Compiler
export async function compileInterviewEvaluationAction(
  sessionId: string,
  finalTranscript: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    // Retrieve initial tracking parameters
    const [session] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, sessionId), eq(interviews.userId, userId)));

    if (!session) throw new Error("Session logs missing.");

    const analyticsPrompt = `
      You are an expert technical recruiter. Analyze the following transcript from a live AI mock interview session.
      Evaluate the candidate's answers based on their target job role: "${session.jobRole}".

      LIVE INTERVIEW TRANSCRIPT LOGS:
      ${finalTranscript}

      You must provide a critical, constructive evaluation returned ONLY as a clean JSON object matching this schema format explicitly:
      {
        "overallScore": number (1 to 100),
        "feedback": "string summarizing verbal expression accuracy, technical depth, and room for improvement",
        "strengths": ["string", "string"],
        "weaknesses": ["string", "string"],
        "suggestions": [
          { "category": "Technical Depth", "score": 85, "tip": "string advice" },
          { "category": "Communication Flow", "score": 70, "tip": "string advice" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: analyticsPrompt,
      config: { responseMimeType: "application/json" },
    });

    const parsedResults = JSON.parse(response.text || "{}");

    // Step A: Update the target session's core metrics and flag it complete
    await db
      .update(interviews)
      .set({
        status: "completed",
        transcript: finalTranscript,
      })
      .where(eq(interviews.id, sessionId));

    // Step B: Formulate and log the compiled results row
    await db.insert(interviewResults).values({
      interviewId: sessionId,
      overallScore: parsedResults.overallScore,
      feedback: parsedResults.feedback,
      strengths: parsedResults.strengths,
      weaknesses: parsedResults.weaknesses,
      suggestions: parsedResults.suggestions,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Evaluation Compiler Failed:", error);
    return {
      success: false,
      error: error.message || "Failed to catalog evaluation records.",
    };
  }
}

export async function getInterviewResultDetailsAction(interviewId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access profile configuration.");

    // 1. Fetch the master session record to capture the job details metadata
    const [session] = await db
      .select()
      .from(interviews)
      .where(
        and(eq(interviews.id, interviewId), eq(interviews.userId, userId)),
      );

    if (!session) {
      return { success: false, error: "Interview archive session not found." };
    }

    // 2. Fetch the corresponding AI generation scores
    const [result] = await db
      .select()
      .from(interviewResults)
      .where(eq(interviewResults.interviewId, interviewId));

    return {
      success: true,
      data: {
        session,
        result: result || null, // Gracefully handle cases where AI metrics are still compiling
      },
    };
  } catch (error: any) {
    console.error("Fetch Interview Metrics Failure:", error);
    return {
      success: false,
      error: error.message || "Failed to load database session registries.",
    };
  }
}

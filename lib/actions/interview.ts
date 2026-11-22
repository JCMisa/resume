/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { interviews, interviewResults } from "@/config/schema";
import { GoogleGenAI } from "@google/genai";
import { eq, and, gte, desc, isNull, ne, or } from "drizzle-orm";
import { enforceRateLimit, RateLimitError } from "@/lib/arcjet";
import { AI_MODELS } from "@/lib/ai-models";
import { mintVapiWebToken } from "@/lib/vapi-token";
import { assertAllowed, toActionError } from "@/lib/billing-guard";
import { refundWindowStart } from "@/lib/plans";
import {
  GRADING_FAILED,
  hasCandidateAnswers,
  parseInterviewGrade,
} from "@/lib/interview";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Initial Launch Registration
export async function createInterviewSessionAction(payload: {
  jobRole: string;
  jobDescription: string;
  resumeText: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access.");

    // Plan limit first, so blocked requests don't consume rate-limit tokens
    const billing = await assertAllowed("interview");

    // Burst protection: plan-sized token bucket + shield + bot detection
    await enforceRateLimit("interview", userId, billing.isPro);

    // Short-lived Vapi credential, only issued to users who passed the checks
    // above. Minted before the insert so a misconfigured server can't create
    // (and count) sessions that can never connect.
    const vapiToken = mintVapiWebToken();

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

    return { success: true as const, id: newSession.id, vapiToken };
  } catch (error) {
    console.error("Interview Session Creation Failure:", error);
    return toActionError(error, "Failed to start the interview session.");
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
    // Only grade a live session once (prevents duplicate Gemini calls / result rows)
    if (session.status !== "in-progress") {
      throw new Error("This interview session has already been closed.");
    }
    // Don't spend a Gemini call grading silence
    if (!hasCandidateAnswers(finalTranscript)) {
      throw new Error("No answers were recorded in this session.");
    }

    // Save the transcript BEFORE grading, so a grading failure never loses the
    // interview: it can be re-graded later with retryInterviewGradingAction.
    await db
      .update(interviews)
      .set({ transcript: finalTranscript })
      .where(
        and(
          eq(interviews.id, sessionId),
          eq(interviews.userId, userId),
          eq(interviews.status, "in-progress"),
        ),
      );

    try {
      await gradeInterview(session, userId, finalTranscript);
    } catch (gradingError) {
      console.error("Interview Grading Failed (transcript saved):", gradingError);
      return {
        success: false as const,
        code: GRADING_FAILED,
        error:
          "We couldn't grade this interview right now. Your answers are saved, so you can retry grading.",
      };
    }

    return { success: true as const };
  } catch (error: any) {
    console.error("Evaluation Compiler Failed:", error);
    return {
      success: false as const,
      error: error.message || "Failed to catalog evaluation records.",
    };
  }
}

// 2b. Re-run grading for a session whose transcript was saved but grading failed.
export async function retryInterviewGradingAction(sessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const [session] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, sessionId), eq(interviews.userId, userId)));

    if (!session) throw new Error("Interview session not found.");
    if (session.status === "completed") return { success: true as const }; // already graded
    if (session.status !== "in-progress") {
      throw new Error("This interview session can't be graded.");
    }
    if (!hasCandidateAnswers(session.transcript)) {
      throw new Error("No saved answers were found for this session.");
    }

    // Cheap Gemini call, but still cap rapid retry spam
    await enforceRateLimit("grading", userId, true);

    await gradeInterview(session, userId, session.transcript!);
    return { success: true as const };
  } catch (error) {
    console.error("Interview Grading Retry Failed:", error);
    if (error instanceof RateLimitError) return toActionError(error, "");
    return {
      success: false as const,
      error:
        error instanceof Error && !/gemini|fetch|json|api/i.test(error.message)
          ? error.message
          : "Grading failed again. Please try again in a few minutes.",
    };
  }
}

// ── Grading internals (not exported, so not callable from the browser) ──────

/** Enforced JSON shape for the grade (Gemini structured output). */
const GRADING_SCHEMA = {
  type: "object",
  properties: {
    overallScore: { type: "integer", minimum: 1, maximum: 100 },
    feedback: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          tip: { type: "string" },
        },
        required: ["category", "score", "tip"],
      },
    },
  },
  required: ["overallScore", "feedback", "strengths", "weaknesses", "suggestions"],
};

/**
 * Grade a transcript with Gemini (2 attempts) and store the result, marking the
 * session completed. Throws if both attempts fail; the caller keeps the
 * transcript so grading can be retried.
 */
async function gradeInterview(
  session: { id: string; jobRole: string },
  userId: string,
  transcript: string,
) {
  const prompt = `
    You are an expert technical recruiter. Analyze the following transcript from a live AI mock interview session.
    Evaluate the candidate's answers based on their target job role: "${session.jobRole}".
    Lines marked [USER] are the candidate; lines marked [ASSISTANT] are the interviewer.

    LIVE INTERVIEW TRANSCRIPT LOGS:
    ${transcript}

    Provide a critical, constructive evaluation:
    - overallScore: 1 to 100
    - feedback: a summary of verbal expression, technical depth, and room for improvement
    - strengths / weaknesses: short, specific observations grounded in the transcript
    - suggestions: 2 to 5 categories (e.g. "Technical Depth", "Communication Flow"), each with a 0-100 score and one actionable tip
  `;

  // Attempt 1 uses the primary model; attempt 2 falls back to a different model
  // (covers 503 "high demand" on the primary as well as malformed output).
  const models = [AI_MODELS.interviewGrading, AI_MODELS.interviewGradingFallback];

  let grade: ReturnType<typeof parseInterviewGrade> | null = null;
  let lastError: unknown;
  for (const [attempt, model] of models.entries()) {
    if (grade) break;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: GRADING_SCHEMA,
        },
      });
      grade = parseInterviewGrade(response.text);
    } catch (error) {
      lastError = error;
      console.warn(`Interview grading attempt ${attempt + 1} (${model}) failed:`, error);
    }
  }
  if (!grade) throw lastError;

  // Flag the session complete and store its results atomically
  await db.batch([
    db
      .update(interviews)
      .set({ status: "completed", transcript })
      .where(and(eq(interviews.id, session.id), eq(interviews.userId, userId))),
    db.insert(interviewResults).values({ interviewId: session.id, ...grade }),
  ]);
}

// 3. Cancel a session that never really happened (connection failure, no answers,
// user left before starting). Within the refund window it's marked "failed" and
// stops counting toward plan limits; after that it stays counted.
export async function cancelInterviewSessionAction(sessionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const windowStart = refundWindowStart();

    const cancelled = await db
      .update(interviews)
      .set({ status: "failed" })
      .where(
        and(
          eq(interviews.id, sessionId),
          eq(interviews.userId, userId),
          eq(interviews.status, "in-progress"),
          gte(interviews.createdAt, windowStart),
        ),
      )
      .returning({ id: interviews.id });

    return { success: true as const, refunded: cancelled.length > 0 };
  } catch (error) {
    console.error("Interview Cancel Failure:", error);
    return toActionError(error, "Failed to cancel the interview session.");
  }
}

export type InterviewHistoryItem = {
  id: string;
  jobRole: string;
  createdAt: Date;
  overallScore: number | null;
  /** graded: has a report · needs_grading: answers saved, grading failed · incomplete: ended with no saved answers */
  state: "graded" | "needs_grading" | "incomplete";
};

// 4. The user's past interviews for the history list (newest first).
// Cancelled ("failed") sessions are hidden since they never really happened.
export async function listInterviewHistoryAction(limit = 20) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const rows = await db
      .select({
        id: interviews.id,
        jobRole: interviews.jobRole,
        status: interviews.status,
        transcript: interviews.transcript,
        createdAt: interviews.createdAt,
        overallScore: interviewResults.overallScore,
        resultId: interviewResults.id,
      })
      .from(interviews)
      .leftJoin(interviewResults, eq(interviewResults.interviewId, interviews.id))
      .where(
        and(
          eq(interviews.userId, userId),
          or(isNull(interviews.status), ne(interviews.status, "failed")),
        ),
      )
      .orderBy(desc(interviews.createdAt))
      .limit(Math.min(Math.max(limit, 1), 50));

    // Don't send transcripts to the list; just derive the state from them
    const data: InterviewHistoryItem[] = rows.map((r) => ({
      id: r.id,
      jobRole: r.jobRole,
      createdAt: r.createdAt,
      overallScore: r.overallScore,
      state: r.resultId
        ? "graded"
        : hasCandidateAnswers(r.transcript)
          ? "needs_grading"
          : "incomplete",
    }));

    return { success: true as const, data };
  } catch (error) {
    console.error("Interview History Failure:", error);
    return { success: false as const, error: "Failed to load past interviews." };
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
        result: result || null,
        // Transcript saved but grading failed: the results page offers a retry
        canRetryGrading:
          !result &&
          session.status === "in-progress" &&
          hasCandidateAnswers(session.transcript),
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

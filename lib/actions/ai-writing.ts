"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes, usageEvents } from "@/config/schema";
import { assertAllowed, toActionError } from "@/lib/billing-guard";
import { enforceRateLimit } from "@/lib/arcjet";
import { notifyUsageLater } from "@/lib/notify";
import { aiWriteBlocker, parseAiWriteTask } from "@/lib/ai-writing";
import { runAiWrite, runTailor } from "@/lib/ai-writing-ai";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { MAX_JOB_DESCRIPTION_CHARS, MIN_JOB_DESCRIPTION_CHARS } from "@/lib/job-match";
import { FREE_LIMITS } from "@/lib/plans";

// AI writing help in the editor. The client sends its current (possibly
// unsaved) content, so suggestions match what's on screen; it's sanitized
// and only used as prompt input. Nothing is saved here: the user picks
// suggestions and the editor's autosave stores them.

const AI_FAILED = "The AI couldn't write that right now. Please try again. This attempt didn't count.";

/** The signed-in user's editable (built) resume, or an error. */
async function ownEditableResume(userId: string, resumeId: unknown) {
  if (typeof resumeId !== "string" || !/^[0-9a-f-]{36}$/i.test(resumeId)) throw new Error("Resume not found.");
  const [row] = await db
    .select({ id: resumes.id })
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created")));
  if (!row) throw new Error("Resume not found.");
  return row.id;
}

/** Remaining AI writing actions this month (null = unlimited). */
function remaining(billing: { isPro: boolean; limits: { aiWrites: number } }, usedNow: number) {
  return billing.isPro ? null : Math.max(0, FREE_LIMITS.ai_write - (billing.limits.aiWrites + usedNow));
}

// 1. Write/improve the summary, rewrite an entry's bullets, or suggest skills
//    (metered: "ai_write", 10/month on Free).
export async function aiWriteAction(resumeId: string, rawTask: unknown, rawContent: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const task = parseAiWriteTask(rawTask);
    if (!task) throw new Error("Unknown AI writing request.");
    const id = await ownEditableResume(userId, resumeId);
    const content = sanitizeEditorContent(rawContent);
    // Checked before billing, so a request that can't work never costs anything
    const blocker = aiWriteBlocker(content, task);
    if (blocker) throw new Error(blocker);

    const billing = await assertAllowed("ai_write");
    await enforceRateLimit("ai_write", userId, billing.isPro);

    let result;
    try {
      result = await runAiWrite(content, task);
    } catch (aiError) {
      console.error("AI Write Failure:", aiError);
      throw new Error(AI_FAILED);
    }
    if (result.kind === "skills" && !result.skills.length) {
      // Nothing new to suggest: don't charge for an empty answer
      return { success: true as const, data: { result, remaining: remaining(billing, 0) } };
    }

    await db.insert(usageEvents).values({ userId, kind: "ai_write", resumeId: id });
    notifyUsageLater(userId, "ai_write", billing);

    return { success: true as const, data: { result, remaining: remaining(billing, 1) } };
  } catch (error) {
    console.error("AI Write Action Failure:", error);
    return toActionError(error, "AI writing failed.");
  }
}

// 2. Tailor to a job (Pro-only; unlimited, rate limited). Returns suggestions only.
export async function tailorResumeAction(resumeId: string, rawContent: unknown, rawJobDescription: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const jobDescription = typeof rawJobDescription === "string" ? rawJobDescription.trim() : "";
    if (jobDescription.length < MIN_JOB_DESCRIPTION_CHARS) {
      throw new Error("Paste the full job description (at least a few sentences).");
    }
    if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
      throw new Error(`That job description is too long. Keep it under ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`);
    }
    await ownEditableResume(userId, resumeId);
    const content = sanitizeEditorContent(rawContent);
    const hasBody = (content.experiences ?? []).length || (content.projects ?? []).length || content.professionalSummary?.trim();
    if (!hasBody) throw new Error("Add some experience, projects or a summary first, so there's something to tailor.");

    const billing = await assertAllowed("tailor");
    await enforceRateLimit("tailor", userId, billing.isPro);

    try {
      return { success: true as const, data: await runTailor(content, jobDescription) };
    } catch (aiError) {
      console.error("AI Tailor Failure:", aiError);
      throw new Error("We couldn't tailor your resume right now. Please try again in a moment.");
    }
  } catch (error) {
    console.error("Tailor Resume Failure:", error);
    return toActionError(error, "Tailoring failed.");
  }
}

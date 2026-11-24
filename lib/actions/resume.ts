/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { resumes, usageEvents } from "@/config/schema";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { enforceRateLimit } from "@/lib/arcjet";
import { assertAllowed, toActionError } from "@/lib/billing-guard";
import {
  ANALYSIS_FAILED_MESSAGE,
  analyzeResumeContent,
  parseAndAnalyzeResume,
  parseAndAnalyzeScannedResume,
} from "@/lib/resume-ai";
import { SCANNED_PDF_MAX_BYTES, isPdfBytes } from "@/lib/resume-text";
import { gateResume } from "@/lib/plan-gating";
import { currentUserIsPro } from "@/lib/plan-tier";
import { notifyLater, notifyUsageLater } from "@/lib/notify";
import { analysisReadyNotice } from "@/lib/notifications";

// The original PDF is uploaded by the client only AFTER this succeeds, then attached
// with updateResumeFileUrlAction, so rejected/failed analyses leave no orphaned files.
export async function analyzeAndStoreResumeAction(
  rawText: string,
  fileName: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");
    if (!rawText?.trim())
      throw new Error("No readable text was found in this resume.");

    // Plan limit first, so blocked requests don't consume rate-limit tokens
    const billing = await assertAllowed("analyze");

    // Burst protection: plan-sized token bucket + shield + bot detection
    await enforceRateLimit("analyze", userId, billing.isPro);

    // Schema-constrained Gemini call + sanitizing + one retry (lib/resume-ai.ts)
    let parsed: Awaited<ReturnType<typeof parseAndAnalyzeResume>>;
    try {
      parsed = await parseAndAnalyzeResume(rawText);
    } catch (aiError) {
      console.error("Resume Parse/Analysis Failure:", aiError);
      throw new Error(ANALYSIS_FAILED_MESSAGE);
    }

    const insertedResume = await storeParsedResume(userId, fileName, parsed);
    notifyLater(userId, analysisReadyNotice(insertedResume));
    notifyUsageLater(userId, "analyze", billing);

    // Free users get the Free view of the report (Pro parts stay server-side)
    return { success: true as const, data: gateResume(insertedResume, billing.isPro) };
  } catch (error) {
    console.error("Gemini/Drizzle Pipeline Failure:", error);
    return toActionError(error, "Pipeline processing failure.");
  }
}

// Insert a parsed upload and log the metered analysis atomically
// (usage is only logged on success, so failures don't use up the allowance)
async function storeParsedResume(
  userId: string,
  fileName: string,
  parsed: Awaited<ReturnType<typeof parseAndAnalyzeResume>>,
) {
  const resumeId = globalThis.crypto.randomUUID();
  const [[insertedResume]] = await db.batch([
    db
      .insert(resumes)
      .values({
        id: resumeId,
        userId,
        title: fileName.replace(/\.(pdf|docx)$/i, "").slice(0, 100) + " (AI Analyzed)",
        category: "General",
        status: "parsed", // AI-parsed upload (vs "created" in the builder)
        content: parsed.content,
        analysis: parsed.analysis,
      })
      .returning(),
    db.insert(usageEvents).values({ userId, kind: "resume_analysis", resumeId }),
  ]);
  return insertedResume;
}

// Scanned / image-only PDFs (no text layer): the PDF itself goes to Gemini.
// Same plan limit, rate limit and storage as a text upload. Sent as FormData
// (see serverActions.bodySizeLimit in next.config.ts).
export async function analyzeScannedResumeAction(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");

    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("No PDF was received.");
    if (file.size > SCANNED_PDF_MAX_BYTES) {
      throw new Error(
        `Scanned PDFs must be ${Math.round(SCANNED_PDF_MAX_BYTES / 1024 / 1024 * 10) / 10} MB or smaller. Try exporting it at a lower quality.`,
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isPdfBytes(bytes)) throw new Error("That file isn't a valid PDF.");

    const billing = await assertAllowed("analyze");
    await enforceRateLimit("analyze", userId, billing.isPro);

    let parsed: Awaited<ReturnType<typeof parseAndAnalyzeScannedResume>>;
    try {
      parsed = await parseAndAnalyzeScannedResume(Buffer.from(bytes).toString("base64"));
    } catch (aiError) {
      console.error("Scanned Resume Analysis Failure:", aiError);
      throw new Error(ANALYSIS_FAILED_MESSAGE);
    }
    // A blank or unreadable scan: don't save (and don't charge) an empty resume
    if (!parsed.content.personalDetails?.name && !parsed.content.experiences?.length) {
      throw new Error(
        "We couldn't read this scan. Try a clearer scan, or build your resume in the editor. This attempt didn't count toward your plan.",
      );
    }

    const insertedResume = await storeParsedResume(userId, file.name || "Scanned resume", parsed);
    notifyLater(userId, analysisReadyNotice(insertedResume));
    notifyUsageLater(userId, "analyze", billing);
    return { success: true as const, data: gateResume(insertedResume, billing.isPro) };
  } catch (error) {
    console.error("Scanned Resume Pipeline Failure:", error);
    return toActionError(error, "Failed to analyze this scanned resume.");
  }
}

export async function analyzeExistingResumeAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");

    // Load the resume first, so a bad id doesn't cost a rate-limit token
    const [existingResume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

    if (!existingResume) throw new Error("Resume record not found.");

    // Plan limit first, so blocked requests don't consume rate-limit tokens
    const billing = await assertAllowed("analyze");

    // Burst protection: plan-sized token bucket + shield + bot detection
    await enforceRateLimit("analyze", userId, billing.isPro);

    // Schema-constrained Gemini call + sanitizing + one retry (lib/resume-ai.ts)
    let analysis: Awaited<ReturnType<typeof analyzeResumeContent>>;
    try {
      analysis = await analyzeResumeContent(existingResume.content);
    } catch (aiError) {
      console.error("Resume Re-analysis Failure:", aiError);
      throw new Error(ANALYSIS_FAILED_MESSAGE);
    }

    // Update the row in place and log the metered re-analysis atomically
    const [[updatedResume]] = await db.batch([
      db
        .update(resumes)
        .set({ analysis, updatedAt: new Date() })
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
        .returning(),
      db
        .insert(usageEvents)
        .values({ userId, kind: "resume_analysis", resumeId }),
    ]);

    notifyLater(userId, analysisReadyNotice(updatedResume));
    notifyUsageLater(userId, "analyze", billing);

    return { success: true as const, data: gateResume(updatedResume, billing.isPro) };
  } catch (error) {
    console.error("Direct Optimization Pipeline Failure:", error);
    return toActionError(
      error,
      "Failed to complete internal audit calculations.",
    );
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

    return {
      success: true,
      data: gateResume(resumeData, await currentUserIsPro()),
    };
  } catch (error: any) {
    console.error("Fetch Resume Details Failure:", error);
    return {
      success: false,
      error: error.message || "Failed to load resume details.",
    };
  }
}

export async function updateResumeFileUrlAction(
  resumeId: string,
  fileUrl: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized access configuration.");

    // Perform an in-place update on the target resume's fileUrl property
    const [updatedRecord] = await db
      .update(resumes)
      .set({
        fileUrl: fileUrl,
        updatedAt: new Date(),
      })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      // Only what callers need (never the analysis, which is plan-gated)
      .returning({ id: resumes.id, fileUrl: resumes.fileUrl, updatedAt: resumes.updatedAt });

    if (!updatedRecord)
      throw new Error("Resume record not found or write permissions denied.");

    return { success: true as const, data: updatedRecord };
  } catch (error: any) {
    console.error("File URL Attachment Failure:", error);
    return {
      success: false,
      error:
        error.message ||
        "Failed to update file attachments inside the database.",
    };
  }
}

export type RecentAnalysisItem = {
  id: string;
  title: string;
  overallScore: number | null;
  updatedAt: Date;
};

// The user's most recently analyzed resumes (newest first) for the Analyze page.
// Only the score is pulled out of the analysis JSON, not the whole report.
export async function listRecentAnalysesAction(limit = 10) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const data: RecentAnalysisItem[] = await db
      .select({
        id: resumes.id,
        title: resumes.title,
        overallScore: sql<
          number | null
        >`round((${resumes.analysis}->>'overallScore')::numeric)::int`,
        updatedAt: resumes.updatedAt,
      })
      .from(resumes)
      .where(and(eq(resumes.userId, userId), isNotNull(resumes.analysis)))
      .orderBy(desc(resumes.updatedAt))
      .limit(Math.min(Math.max(limit, 1), 30));

    return { success: true as const, data };
  } catch (error) {
    console.error("Recent Analyses Failure:", error);
    return {
      success: false as const,
      error: "Failed to load recent analyses.",
    };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/config/db";
import { resumes, usageEvents } from "@/config/schema";
import {
  computeStats,
  monthlyActivity,
  nextBestAction,
  scoreDistribution,
  scoreTrend,
  toLibraryItem,
  topKeywords,
} from "@/lib/resume-stats";

const ACTIVITY_MONTHS = 6;

// Everything the Resumes dashboard needs, in one round trip.
export async function getResumeLibraryAction() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const now = new Date();
    const activitySince = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (ACTIVITY_MONTHS - 1), 1),
    );

    const [rows, events] = await Promise.all([
      db
        .select({
          id: resumes.id,
          title: resumes.title,
          category: resumes.category,
          status: resumes.status,
          fileUrl: resumes.fileUrl,
          content: resumes.content,
          analysis: resumes.analysis,
          tailoredFor: resumes.tailoredFor,
          createdAt: resumes.createdAt,
          updatedAt: resumes.updatedAt,
        })
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.updatedAt)),
      // Usage log (analyses + builds): dates each resume's latest analysis and
      // drives monthly activity, including resumes that were later deleted
      db
        .select({
          kind: usageEvents.kind,
          resumeId: usageEvents.resumeId,
          createdAt: usageEvents.createdAt,
        })
        .from(usageEvents)
        .where(eq(usageEvents.userId, userId)),
    ]);

    const analysisEvents = events.filter((e) => e.kind === "resume_analysis");
    const recent = (kind: (typeof events)[number]["kind"]) =>
      events
        .filter((e) => e.kind === kind && e.createdAt >= activitySince)
        .map((e) => e.createdAt);

    const lastAnalyzed = new Map<string, Date>();
    for (const e of analysisEvents) {
      if (!e.resumeId) continue;
      const prev = lastAnalyzed.get(e.resumeId);
      if (!prev || e.createdAt > prev) lastAnalyzed.set(e.resumeId, e.createdAt);
    }

    const items = rows.map((r) => toLibraryItem(r, lastAnalyzed.get(r.id)));
    const analysisById = new Map(rows.map((r) => [r.id, r.analysis]));

    return {
      success: true as const,
      data: {
        items,
        stats: computeStats(items),
        trend: scoreTrend(items),
        distribution: scoreDistribution(items),
        activity: monthlyActivity(
          recent("resume_analysis"),
          recent("resume_create"),
          ACTIVITY_MONTHS,
          now,
        ),
        keywords: topKeywords(rows),
        nextAction: nextBestAction(items, analysisById),
      },
    };
  } catch (error) {
    unstable_rethrow(error); // let Next handle dynamic-rendering/redirect signals
    console.error("Resume Library Failure:", error);
    return { success: false as const, error: "Failed to load your resumes." };
  }
}

export type ResumeLibraryData = Extract<
  Awaited<ReturnType<typeof getResumeLibraryAction>>,
  { success: true }
>["data"];

// Best-effort removal of the archived PDF from Cloudinary (raw upload).
async function destroyCloudinaryFile(fileUrl: string) {
  try {
    // .../raw/upload/v123/resumedocs/name.pdf -> "resumedocs/name.pdf" (raw ids keep the extension)
    const match = fileUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return;
    const publicId = decodeURIComponent(match[1]);
    const { cloudinary } = await import("@/lib/cloudinary-server");
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.warn("Cloudinary cleanup failed (non-fatal):", error);
  }
}

export async function deleteResumeAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const [deleted] = await db
      .delete(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      .returning({ id: resumes.id, fileUrl: resumes.fileUrl });

    if (!deleted) {
      return { success: false as const, error: "Resume not found." };
    }
    if (deleted.fileUrl) await destroyCloudinaryFile(deleted.fileUrl);

    return { success: true as const, data: { id: deleted.id } };
  } catch (error) {
    console.error("Delete Resume Failure:", error);
    return { success: false as const, error: "Failed to delete the resume." };
  }
}

export async function renameResumeAction(resumeId: string, title: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    const clean = title.trim().slice(0, 120);
    if (!clean) return { success: false as const, error: "Title can't be empty." };

    const [updated] = await db
      .update(resumes)
      .set({ title: clean, updatedAt: new Date() })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
      .returning({ id: resumes.id, title: resumes.title });

    if (!updated) return { success: false as const, error: "Resume not found." };
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Rename Resume Failure:", error);
    return { success: false as const, error: "Failed to rename the resume." };
  }
}

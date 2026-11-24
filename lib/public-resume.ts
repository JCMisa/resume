import "server-only";

import { cache } from "react";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes } from "@/config/schema";
import { isShareCode, publicContent } from "@/lib/resume-share";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { resolveTemplate } from "@/lib/resume-templates";

/**
 * A shared resume for the public page and its link-preview image, or null
 * when the code is unknown or sharing is off. Phone/address are removed here
 * (server-side) when the owner hides them, so they never reach the browser.
 * Never returns the analysis or other private fields; `ownerId` is for
 * server-side view counting only and must not be passed to client components.
 */
export const getPublicResume = cache(async (code: string) => {
  if (!isShareCode(code)) return null;
  const [row] = await db
    .select({
      id: resumes.id,
      userId: resumes.userId,
      title: resumes.title,
      templateId: resumes.templateId,
      content: resumes.content,
      hideContact: resumes.shareHideContact,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(and(eq(resumes.shareCode, code), eq(resumes.shareEnabled, true), eq(resumes.status, "created")));
  if (!row) return null;
  return {
    id: row.id,
    /** Server-only (view counting); never pass to client components */
    ownerId: row.userId,
    title: row.title,
    template: resolveTemplate(row.templateId),
    content: publicContent(sanitizeEditorContent(row.content), { hideContact: row.hideContact }),
    updatedAt: row.updatedAt,
  };
});

/** +1 view (called after the response; never blocks the page). */
export async function recordShareView(resumeId: string) {
  try {
    await db
      .update(resumes)
      .set({ shareViews: sql`${resumes.shareViews} + 1` })
      .where(eq(resumes.id, resumeId));
  } catch (error) {
    console.error("Record Share View Failure:", error);
  }
}

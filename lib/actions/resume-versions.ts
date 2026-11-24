"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes, resumeVersions } from "@/config/schema";
import { assertAllowed, toActionError } from "@/lib/billing-guard";
import { currentUserIsPro } from "@/lib/plan-tier";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { DEFAULT_TEMPLATE, isTemplateId } from "@/lib/resume-templates";
import { snapshotResume } from "@/lib/resume-versions-server";
import { isVersionKind, normalizeVersionLabel, type VersionListItem } from "@/lib/resume-versions";

// Version history (Pro). Snapshots are only ever made from what's saved in
// the database (never from client data), and every query is scoped to the owner.

const UUID = /^[0-9a-f-]{36}$/i;

/** Versions of one resume, newest first (no content). Free users get an empty, locked list. */
export async function listResumeVersionsAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) throw new Error("Resume not found.");
    if (!(await currentUserIsPro())) return { success: true as const, data: { locked: true, versions: [] as VersionListItem[] } };

    const rows = await db
      .select({
        id: resumeVersions.id,
        kind: resumeVersions.kind,
        label: resumeVersions.label,
        title: resumeVersions.title,
        createdAt: resumeVersions.createdAt,
      })
      .from(resumeVersions)
      .where(and(eq(resumeVersions.resumeId, resumeId), eq(resumeVersions.userId, userId)))
      .orderBy(desc(resumeVersions.createdAt))
      .limit(100);
    const versions: VersionListItem[] = rows.map((r) => ({ ...r, kind: isVersionKind(r.kind) ? r.kind : "auto" }));
    return { success: true as const, data: { locked: false, versions } };
  } catch (error) {
    console.error("List Resume Versions Failure:", error);
    return { success: false as const, error: "Couldn't load the version history." };
  }
}

/** One version's content, for the preview (Pro). */
export async function getResumeVersionAction(resumeId: string, versionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (![resumeId, versionId].every((v) => typeof v === "string" && UUID.test(v))) throw new Error("Version not found.");
    await assertAllowed("history");

    const [row] = await db
      .select({ title: resumeVersions.title, templateId: resumeVersions.templateId, content: resumeVersions.content })
      .from(resumeVersions)
      .where(and(eq(resumeVersions.id, versionId), eq(resumeVersions.resumeId, resumeId), eq(resumeVersions.userId, userId)));
    if (!row) throw new Error("Version not found.");
    return {
      success: true as const,
      data: {
        title: row.title,
        templateId: isTemplateId(row.templateId) ? row.templateId : DEFAULT_TEMPLATE,
        content: sanitizeEditorContent(row.content),
      },
    };
  } catch (error) {
    console.error("Get Resume Version Failure:", error);
    return toActionError(error, "Couldn't open that version.");
  }
}

/** "Save version" with an optional name (Pro). Saves what's in the database now. */
export async function saveResumeVersionAction(resumeId: string, rawLabel: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) throw new Error("Resume not found.");
    await assertAllowed("history");

    const id = await snapshotResume(userId, resumeId, "manual", normalizeVersionLabel(rawLabel));
    if (!id) throw new Error("This resume can't be versioned.");
    return { success: true as const, data: { id } };
  } catch (error) {
    console.error("Save Resume Version Failure:", error);
    return toActionError(error, "Couldn't save a version.");
  }
}

/**
 * Restore a version (Pro). The current state is saved first as "Before
 * restoring", so a restore can always be undone from the history.
 */
export async function restoreResumeVersionAction(resumeId: string, versionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (![resumeId, versionId].every((v) => typeof v === "string" && UUID.test(v))) throw new Error("Version not found.");
    await assertAllowed("history");

    const [version] = await db
      .select({ title: resumeVersions.title, templateId: resumeVersions.templateId, content: resumeVersions.content })
      .from(resumeVersions)
      .where(and(eq(resumeVersions.id, versionId), eq(resumeVersions.resumeId, resumeId), eq(resumeVersions.userId, userId)));
    if (!version) throw new Error("Version not found.");

    await snapshotResume(userId, resumeId, "restore");

    const content = sanitizeEditorContent(version.content);
    const templateId = isTemplateId(version.templateId) ? version.templateId : null;
    const [saved] = await db
      .update(resumes)
      .set({ title: version.title, templateId, content, updatedAt: new Date() })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created")))
      .returning({ id: resumes.id });
    if (!saved) throw new Error("This resume can't be edited.");

    return { success: true as const, data: { title: version.title, templateId: templateId ?? DEFAULT_TEMPLATE, content } };
  } catch (error) {
    console.error("Restore Resume Version Failure:", error);
    return toActionError(error, "Couldn't restore that version.");
  }
}

/** Delete one version (Pro). */
export async function deleteResumeVersionAction(resumeId: string, versionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (![resumeId, versionId].every((v) => typeof v === "string" && UUID.test(v))) throw new Error("Version not found.");
    await assertAllowed("history");

    const deleted = await db
      .delete(resumeVersions)
      .where(and(eq(resumeVersions.id, versionId), eq(resumeVersions.resumeId, resumeId), eq(resumeVersions.userId, userId)))
      .returning({ id: resumeVersions.id });
    if (!deleted.length) throw new Error("Version not found.");
    return { success: true as const, data: null };
  } catch (error) {
    console.error("Delete Resume Version Failure:", error);
    return toActionError(error, "Couldn't delete that version.");
  }
}

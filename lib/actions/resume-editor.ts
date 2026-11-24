"use server";

import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes, usageEvents, users } from "@/config/schema";
import { assertAllowed, PlanLimitError, toActionError } from "@/lib/billing-guard";
import { currentUserIsPro } from "@/lib/plan-tier";
import { limitReachedMessage } from "@/lib/plans";
import { snapshotResume } from "@/lib/resume-versions-server";
import { notifyUsageLater } from "@/lib/notify";
import {
  blankContent,
  cloneContent,
  copyTitle,
  normalizeResumeTitle,
  sanitizeEditorContent,
  DEFAULT_TITLE,
} from "@/lib/resume-editor";
import { DEFAULT_TEMPLATE, isProTemplate, isTemplateId, usesProDesign } from "@/lib/resume-templates";
import type { ResumeContent } from "@/lib/resume-sanitize";

/** Free users can't pick a Pro colour/font: drop them from new content. */
function withoutProDesign(content: ResumeContent): ResumeContent {
  if (!usesProDesign(content.design)) return content;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accent, font, ...design } = content.design ?? {};
  return { ...content, design };
}

// Resume editor (start screen + /resumes/[id]/edit). Built resumes are saved
// as the user types (autosave), so there's no "Finish" step anymore.

const UUID = /^[0-9a-f-]{36}$/i;

/** The user's resumes to start from (titles/scores only, no content). */
export async function listStarterResumesAction() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    const data = await db
      .select({
        id: resumes.id,
        title: resumes.title,
        status: resumes.status,
        updatedAt: resumes.updatedAt,
        score: sql<number | null>`round((${resumes.analysis}->>'overallScore')::numeric)::int`,
      })
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.updatedAt))
      .limit(50);
    return { success: true as const, data };
  } catch (error) {
    unstable_rethrow(error); // let Next handle its own render signals (e.g. dynamic usage)
    console.error("List Starter Resumes Failure:", error);
    return { success: false as const, error: "Couldn't load your resumes." };
  }
}

/**
 * Create a resume from a template, blank or copied from one of the user's
 * resumes, and return its id for the editor. Counts as a monthly build
 * (logged in usage_events, so deleting it doesn't give the build back).
 */
export async function createResumeDraftAction(input: { templateId?: unknown; fromResumeId?: unknown }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not signed in.");

    const templateId = isTemplateId(input?.templateId) ? input.templateId : DEFAULT_TEMPLATE;
    // Designer templates are Pro (checked before anything is created)
    let isPro: boolean | null = null;
    const pro = async () => (isPro ??= await currentUserIsPro());
    if (isProTemplate(templateId) && !(await pro())) throw new PlanLimitError(limitReachedMessage("design"));

    // Resolve the source first, so a bad id doesn't use up a build
    let title = DEFAULT_TITLE;
    let content;
    if (input?.fromResumeId != null) {
      if (typeof input.fromResumeId !== "string" || !UUID.test(input.fromResumeId)) {
        throw new Error("That resume wasn't found.");
      }
      const [source] = await db
        .select({ title: resumes.title, content: resumes.content })
        .from(resumes)
        .where(and(eq(resumes.id, input.fromResumeId), eq(resumes.userId, userId)));
      if (!source) throw new Error("That resume wasn't found.");
      title = copyTitle(source.title);
      content = cloneContent(source.content);
      if (usesProDesign(content.design) && !(await pro())) content = withoutProDesign(content);
    } else {
      const [me] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const name = me?.name && me.name !== "Anonymous User" ? me.name : "";
      const email = me?.email && !me.email.endsWith("@placeholder.com") ? me.email : "";
      content = blankContent({ name, email });
    }

    const billing = await assertAllowed("create_resume");

    const resumeId = globalThis.crypto.randomUUID();
    await db.batch([
      db.insert(resumes).values({
        id: resumeId,
        userId,
        title,
        category: "General",
        status: "created",
        templateId,
        content,
      }),
      db.insert(usageEvents).values({ userId, kind: "resume_create", resumeId }),
    ]);
    notifyUsageLater(userId, "create_resume", billing);

    return { success: true as const, data: { id: resumeId } };
  } catch (error) {
    console.error("Create Resume Draft Failure:", error);
    return toActionError(error, "Couldn't create your resume. Try again.");
  }
}

/** What the editor needs. Never the analysis (that's gated elsewhere). */
export async function getResumeForEditorAction(resumeId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "Not signed in." };
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) {
      return { success: false as const, error: "Resume not found." };
    }
    const [row] = await db
      .select({
        id: resumes.id,
        title: resumes.title,
        status: resumes.status,
        templateId: resumes.templateId,
        content: resumes.content,
        updatedAt: resumes.updatedAt,
      })
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
    if (!row) return { success: false as const, error: "Resume not found." };
    return {
      success: true as const,
      data: {
        ...row,
        templateId: isTemplateId(row.templateId) ? row.templateId : DEFAULT_TEMPLATE,
        // Old rows may predate fields the editor expects
        content: sanitizeEditorContent(row.content),
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Get Resume For Editor Failure:", error);
    return { success: false as const, error: "Couldn't load this resume." };
  }
}

/**
 * Autosave / Ctrl+S. Only resumes built in the editor can be edited (uploaded
 * ones keep their analyzed content; the user edits a copy instead).
 */
export async function saveResumeDraftAction(
  resumeId: string,
  changes: { title?: unknown; content?: unknown; templateId?: unknown },
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false as const, error: "You were signed out. Sign in again to save." };
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) {
      return { success: false as const, error: "Resume not found." };
    }

    const set: Partial<typeof resumes.$inferInsert> = { updatedAt: new Date() };
    if (changes?.title !== undefined) set.title = normalizeResumeTitle(changes.title);
    if (changes?.content !== undefined) set.content = sanitizeEditorContent(changes.content);
    if (changes?.templateId !== undefined) {
      if (!isTemplateId(changes.templateId)) return { success: false as const, error: "Unknown template." };
      set.templateId = changes.templateId;
    }

    // Pro looks (designer templates, custom colour/font). Checked only when
    // the save touches them, so ordinary autosaves stay one query.
    const touchesPro = (set.templateId && isProTemplate(set.templateId)) || (set.content && usesProDesign(set.content.design));
    if (touchesPro && !(await currentUserIsPro())) {
      const [stored] = await db
        .select({ templateId: resumes.templateId, design: sql<ResumeContent["design"]>`${resumes.content}->'design'` })
        .from(resumes)
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
      if (!stored) return { success: false as const, error: "Resume not found." };
      // A Free user can't switch to a designer template...
      if (set.templateId && isProTemplate(set.templateId) && set.templateId !== stored.templateId) {
        return { success: false as const, error: limitReachedMessage("design") };
      }
      // ...or change the colour/font. What they already have (e.g. from
      // before a downgrade) is kept as it is.
      if (set.content) {
        const { accent, font, ...rest } = set.content.design ?? {};
        void accent;
        void font;
        set.content = {
          ...set.content,
          design: { ...rest, ...(stored.design?.accent ? { accent: stored.design.accent } : {}), ...(stored.design?.font ? { font: stored.design.font } : {}) },
        };
      }
    }

    const [saved] = await db
      .update(resumes)
      .set(set)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created")))
      .returning({ updatedAt: resumes.updatedAt, title: resumes.title });
    if (!saved) return { success: false as const, error: "This resume can't be edited." };

    // Pro version history: an automatic snapshot at most every few minutes,
    // after the response (never slows saving down, never fails the save)
    after(async () => {
      try {
        if (await currentUserIsPro()) await snapshotResume(userId, resumeId, "auto");
      } catch (error) {
        console.error("Auto Version Failure:", error);
      }
    });

    return { success: true as const, data: saved };
  } catch (error) {
    console.error("Save Resume Draft Failure:", error);
    return { success: false as const, error: "Couldn't save. Check your connection; we'll keep trying." };
  }
}

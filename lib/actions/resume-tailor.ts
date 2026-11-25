"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes, usageEvents } from "@/config/schema";
import { enforceRateLimit } from "@/lib/arcjet";
import { assertAllowed, PlanLimitError, toActionError } from "@/lib/billing-guard";
import { notifyLater, notifyUsageLater } from "@/lib/notify";
import { tailorReadyNotice } from "@/lib/notifications";
import { currentUserIsPro } from "@/lib/plan-tier";
import { limitReachedMessage } from "@/lib/plans";
import { parseResumeText, parseScannedResumeText } from "@/lib/resume-ai";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { runResumeTailor } from "@/lib/resume-tailor-ai";
import {
  addedSkillsChange,
  buildTailorChanges,
  compareScores,
  finalizeTailoredContent,
  keywordScore,
  pickOfferedSkills,
  sanitizeTailoredFor,
  tailoredTitle,
  type TailoredFor,
} from "@/lib/resume-tailor";
import { DEFAULT_TEMPLATE, isProTemplate, isTemplateId, type TemplateId } from "@/lib/resume-templates";
import { MAX_JOB_DESCRIPTION_CHARS, MIN_JOB_DESCRIPTION_CHARS } from "@/lib/job-match";
import { SCANNED_PDF_MAX_BYTES, isPdfBytes } from "@/lib/resume-text";
import type { ResumeContent } from "@/lib/resume-sanitize";

// "Tailor to a job" from the Create screen. Two steps:
//   1. startResumeTailorAction: read the resume (upload or saved), tailor it
//      with AI, save it right away as a new resume in "review" stage. This is
//      the step that costs money, so it is metered (resume_tailor).
//   2. finishResumeTailorAction: add the missing skills the user confirmed
//      and the chosen template. No AI, free.

const UUID = /^[0-9a-f-]{36}$/i;
const MIN_TEXT_CHARS = 150;
const TAILOR_FAILED =
  "We couldn't tailor your resume right now. Please try again in a moment. This attempt didn't count toward your plan.";
const UNREADABLE =
  "We couldn't read enough of this resume to tailor it. Try a different file, or build it in the editor. This attempt didn't count toward your plan.";

const field = (fd: FormData, name: string, max: number) => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

/** Enough real content to tailor (a blank or unreadable file isn't). */
const hasBody = (c: ResumeContent) =>
  (c.experiences ?? []).some((e) => e.role?.trim() || e.company?.trim()) ||
  (c.projects ?? []).some((p) => p.title?.trim()) ||
  Boolean(c.professionalSummary?.trim());

/**
 * FormData fields:
 *   source: "text" (text from a PDF/Word file read in the browser) | "scanned" (the PDF itself) | "resume" (a saved resume)
 *   text + fileName | file | resumeId
 *   jobDescription, jobTitle?, company?
 */
export async function startResumeTailorAction(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");

    // 1. Validate everything that's free to check, before any limit is touched
    const jobDescription = field(formData, "jobDescription", MAX_JOB_DESCRIPTION_CHARS + 1);
    if (jobDescription.length < MIN_JOB_DESCRIPTION_CHARS) throw new Error("Paste the full job description (at least a few sentences).");
    if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
      throw new Error(`That job description is too long. Keep it under ${MAX_JOB_DESCRIPTION_CHARS.toLocaleString()} characters.`);
    }
    const jobTitleHint = field(formData, "jobTitle", 120);
    const companyHint = field(formData, "company", 120);

    const source = formData.get("source");
    let original: ResumeContent | null = null;
    let text = "";
    let scanned: string | null = null;
    let templateId: TemplateId = DEFAULT_TEMPLATE;
    let sourceName: string | null = null;
    let sourceResumeId: string | null = null;

    if (source === "resume") {
      const id = field(formData, "resumeId", 40);
      if (!UUID.test(id)) throw new Error("That resume wasn't found.");
      const [row] = await db
        .select({ title: resumes.title, content: resumes.content, templateId: resumes.templateId })
        .from(resumes)
        .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
      if (!row) throw new Error("That resume wasn't found.");
      original = sanitizeEditorContent(row.content);
      if (!hasBody(original)) throw new Error("That resume is empty. Add your experience first, or upload a file.");
      if (isTemplateId(row.templateId)) templateId = row.templateId;
      sourceName = row.title;
      sourceResumeId = id;
    } else if (source === "text") {
      text = field(formData, "text", 60_000);
      if (text.length < MIN_TEXT_CHARS) throw new Error(UNREADABLE);
      sourceName = field(formData, "fileName", 200) || "Uploaded resume";
    } else if (source === "scanned") {
      const file = formData.get("file");
      if (!(file instanceof File)) throw new Error("No PDF was received.");
      if (file.size > SCANNED_PDF_MAX_BYTES) {
        throw new Error(`Scanned PDFs must be ${Math.round((SCANNED_PDF_MAX_BYTES / 1024 / 1024) * 10) / 10} MB or smaller.`);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!isPdfBytes(bytes)) throw new Error("That file isn't a valid PDF.");
      scanned = Buffer.from(bytes).toString("base64");
      sourceName = file.name || "Scanned resume";
    } else {
      throw new Error("Choose a resume to tailor.");
    }

    // 2. Plan limit, then the burst limit
    const billing = await assertAllowed("resume_tailor");
    await enforceRateLimit("resume_tailor", userId, billing.isPro);

    // 3. AI: read (uploads only), then tailor. A failure here costs nothing.
    let draft;
    try {
      if (!original) {
        original = sanitizeEditorContent(scanned ? await parseScannedResumeText(scanned) : await parseResumeText(text));
      }
    } catch (aiError) {
      console.error("Tailor Parse Failure:", aiError);
      throw new Error(TAILOR_FAILED);
    }
    if (!hasBody(original)) throw new Error(UNREADABLE);
    try {
      draft = await runResumeTailor(original, jobDescription, { jobTitle: jobTitleHint, company: companyHint });
    } catch (aiError) {
      console.error("Tailor AI Failure:", aiError);
      throw new Error(TAILOR_FAILED);
    }

    // 4. Score, describe, save (the new resume + its usage record together)
    const jobTitle = jobTitleHint || draft.jobTitle;
    const company = companyHint || draft.company;
    const scores = compareScores(original, draft.content, draft.keywords);
    // A Free user's copy of a Pro-styled resume gets the default template
    if (isProTemplate(templateId) && !billing.isPro) templateId = DEFAULT_TEMPLATE;

    const tailoredFor: TailoredFor = {
      version: 1,
      stage: "review",
      suggestedSkills: draft.suggestedSkills,
      jobTitle,
      company,
      jobDescription,
      source: source === "resume" ? "resume" : "upload",
      sourceResumeId,
      sourceName,
      createdAt: new Date().toISOString(),
      score: scores.score,
      keywords: scores.keywords,
      changes: buildTailorChanges(original, draft.content, draft.reasons),
    };

    const id = globalThis.crypto.randomUUID();
    const title = tailoredTitle(jobTitle, company);
    // Custom colour/font are Pro: drop them from a Free user's copy
    const content =
      billing.isPro || !(draft.content.design?.accent || draft.content.design?.font)
        ? draft.content
        : { ...draft.content, design: { ...draft.content.design, accent: undefined, font: undefined } };
    await db.batch([
      db.insert(resumes).values({
        id,
        userId,
        title,
        category: "Tailored",
        status: "created",
        templateId,
        content: sanitizeEditorContent(content),
        tailoredFor,
      }),
      db.insert(usageEvents).values({ userId, kind: "resume_tailor", resumeId: id }),
    ]);

    notifyLater(userId, tailorReadyNotice({ id, title }, scores.score));
    notifyUsageLater(userId, "resume_tailor", billing);

    return {
      success: true as const,
      data: {
        id,
        title,
        jobTitle,
        company,
        score: scores.score,
        suggestedSkills: draft.suggestedSkills,
        changes: tailoredFor.changes.length,
      },
    };
  } catch (error) {
    console.error("Start Resume Tailor Failure:", error);
    return toActionError(error, "Couldn't tailor your resume. Try again.");
  }
}

/** Review step: add the confirmed skills and the chosen template. Free (no AI). */
export async function finishResumeTailorAction(resumeId: string, input: { skills?: unknown; templateId?: unknown }) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized.");
    if (typeof resumeId !== "string" || !UUID.test(resumeId)) throw new Error("Resume not found.");

    const [row] = await db
      .select({ content: resumes.content, templateId: resumes.templateId, tailoredFor: resumes.tailoredFor })
      .from(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId), eq(resumes.status, "created")));
    if (!row) throw new Error("Resume not found.");
    const tf = sanitizeTailoredFor(row.tailoredFor);
    if (!tf) throw new Error("This resume wasn't made by Tailor to a job.");
    if (tf.stage === "done") return { success: true as const, data: { id: resumeId } }; // already finished (e.g. double click)

    let templateId = isTemplateId(row.templateId) ? row.templateId : DEFAULT_TEMPLATE;
    if (input?.templateId !== undefined) {
      if (!isTemplateId(input.templateId)) throw new Error("Unknown template.");
      if (isProTemplate(input.templateId) && !(await currentUserIsPro())) throw new PlanLimitError(limitReachedMessage("design"));
      templateId = input.templateId;
    }

    // Only skills that were offered in the review step can be added
    const confirmed = pickOfferedSkills(input?.skills, tf.suggestedSkills);
    const content = finalizeTailoredContent(sanitizeEditorContent(row.content), confirmed);
    const after = keywordScore(content, tf.keywords);
    const added = addedSkillsChange(confirmed.map((s) => s.skill));

    const done: TailoredFor = {
      ...tf,
      stage: "done",
      suggestedSkills: [],
      score: { before: tf.score.before, after: after.score },
      keywords: tf.keywords.map((k, i) => ({ ...k, after: after.items[i].found })),
      changes: added ? [...tf.changes, added] : tf.changes,
    };

    await db
      .update(resumes)
      .set({ content, templateId, tailoredFor: done, updatedAt: new Date() })
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));

    return { success: true as const, data: { id: resumeId } };
  } catch (error) {
    console.error("Finish Resume Tailor Failure:", error);
    return toActionError(error, "Couldn't finish your tailored resume.");
  }
}

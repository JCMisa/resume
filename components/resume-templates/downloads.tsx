"use client";

import type { ResumeContent } from "@/lib/resume-sanitize";
import type { TemplateDef } from "@/lib/resume-templates";
import { fileSlug, resumeToPlainText } from "@/lib/resume-share";

// Client-side downloads shared by the editor, the share screen and the public
// page. PDF and text are made in the browser; Word comes from the server
// (Pro check in app/api/resumes/[id]/docx/route.ts).

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadResumePdf(content: ResumeContent, template: TemplateDef, title: string) {
  // Loaded on demand: the PDF engine is large
  const [{ pdf }, { default: ResumePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumePdfDocument"),
  ]);
  const blob = await pdf(<ResumePdfDocument content={content} template={template} title={title} />).toBlob();
  saveBlob(blob, `${fileSlug(title)}.pdf`);
}

export function downloadResumeText(content: ResumeContent, title: string) {
  saveBlob(new Blob([resumeToPlainText(content)], { type: "text/plain;charset=utf-8" }), `${fileSlug(title)}.txt`);
}

/** Resolves to an error message, or null on success. */
export async function downloadResumeDocx(resumeId: string, title: string): Promise<string | null> {
  const res = await fetch(`/api/resumes/${resumeId}/docx`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return body?.message ?? "Couldn't create the Word file.";
  }
  saveBlob(await res.blob(), `${fileSlug(title)}.docx`);
  return null;
}

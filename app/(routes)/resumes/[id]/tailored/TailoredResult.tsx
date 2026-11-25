"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Crown,
  Download,
  FileEdit,
  FileType2,
  Loader2,
  Share2,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import UpgradeModal from "@/components/custom/UpgradeModal";
import ResumeDocument from "@/components/resume-templates/ResumeDocument";
import ScaledPage from "@/components/resume-templates/ScaledPage";
import { buildResumePdfBlob, downloadResumeDocx, savePdfBlob } from "@/components/resume-templates/downloads";
import { resolveTemplate, type TemplateId } from "@/lib/resume-templates";
import type { TailorChange, TailoredFor } from "@/lib/resume-tailor";
import type { ResumeContent } from "@/lib/resume-sanitize";
import ResumeFileViewer from "../../_components/ResumeFileViewer";

const SECTION_ORDER: TailorChange["section"][] = ["summary", "experience", "projects", "skills", "order"];
const SECTION_LABEL: Record<TailorChange["section"], string> = {
  summary: "Summary",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  order: "Layout",
};

function ChangeCard({ change }: { change: TailorChange }) {
  const list = change.section === "skills" || change.section === "order";
  return (
    <li className="rounded-2xl border p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold">{change.label}</p>
      </div>
      <p className="text-[11px] text-primary">{change.reason}</p>
      {list ? (
        <div className="space-y-1 text-xs">
          {change.before.length > 0 && <p className="text-muted-foreground line-through decoration-muted-foreground/50">{change.before.join(" · ")}</p>}
          <p>{change.after.join(" · ")}</p>
        </div>
      ) : (
        <div className="grid gap-2 text-xs">
          {change.before.length > 0 && (
            <ul className="space-y-1 text-muted-foreground">
              {change.before.map((b, i) => (
                <li key={i} className="line-through decoration-muted-foreground/50">
                  {b}
                </li>
              ))}
            </ul>
          )}
          <ul className="space-y-1">
            {change.after.map((b, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-primary" aria-hidden>
                  •
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function TailoredResult({
  resume,
  tailoredFor,
  sourceTitle,
  isPro,
}: {
  resume: { id: string; title: string; templateId: TemplateId; content: ResumeContent };
  tailoredFor: TailoredFor;
  /** Title of the saved resume it was made from (if it still exists) */
  sourceTitle: string | null;
  isPro: boolean;
}) {
  const template = resolveTemplate(resume.templateId);
  const [pdf, setPdf] = useState<{ blob: Blob; url: string } | null>(null);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Make the PDF in the browser once: the viewer shows the exact file you download
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    buildResumePdfBlob(resume.content, template, resume.title)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPdf({ blob, url });
      })
      .catch((error) => {
        console.error("Tailored PDF failed:", error);
        if (!cancelled) setPdfFailed(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [resume.content, resume.title, template]);

  const { score, keywords, changes } = tailoredFor;
  const gained = score.after - score.before;
  const grouped = SECTION_ORDER.map((s) => ({ section: s, items: changes.filter((c) => c.section === s) })).filter((g) => g.items.length);
  const missing = keywords.filter((k) => !k.after);

  async function downloadPdf() {
    setBusy("pdf");
    try {
      savePdfBlob(pdf?.blob ?? (await buildResumePdfBlob(resume.content, template, resume.title)), resume.title);
    } catch {
      toast.error("Couldn't create the PDF. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadWord() {
    if (!isPro) return setUpgradeOpen(true);
    setBusy("docx");
    try {
      const error = await downloadResumeDocx(resume.id, resume.title);
      if (error) toast.error(error);
    } finally {
      setBusy(null);
    }
  }

  const actionLink = cn(buttonVariants({ variant: "outline" }), "rounded-xl gap-1.5 justify-start");

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-3 border-b pb-5">
        <Link
          href="/resumes"
          aria-label="Back to resumes"
          className="size-9 shrink-0 rounded-xl border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-strong dark:text-brand flex items-center gap-1.5">
            <WandSparkles className="size-3.5" /> Tailored resume
          </p>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">{resume.title}</h1>
          <p className="text-xs text-muted-foreground truncate">
            For {tailoredFor.jobTitle || "this job"}
            {tailoredFor.company && ` at ${tailoredFor.company}`}
            {tailoredFor.source === "resume" && sourceTitle ? (
              <>
                {" · from "}
                <Link href={`/resumes/${tailoredFor.sourceResumeId}`} className="underline underline-offset-2 hover:text-foreground">
                  {sourceTitle}
                </Link>
              </>
            ) : tailoredFor.sourceName ? (
              ` · from ${tailoredFor.sourceName}`
            ) : null}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] items-start">
        {/* Left: score, actions, changes */}
        <div className="space-y-6 min-w-0">
          <section className="rounded-3xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Before</p>
                <p className="text-3xl font-black tabular-nums text-muted-foreground">{score.before}%</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tailored</p>
                <p className="text-3xl font-black tabular-nums">{score.after}%</p>
              </div>
              {gained > 0 && (
                <span className="ml-auto rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-black tabular-nums">+{gained}</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Keyword match: how many of the job&apos;s key terms your resume contains, the way an ATS checks.</p>
            {keywords.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Job keywords">
                {keywords.map((k) => (
                  <li
                    key={k.term}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      k.after ? "border-primary/40 bg-primary/10" : "text-muted-foreground",
                    )}
                  >
                    {k.after ? <CheckCircle2 className="size-3 text-primary" /> : <Circle className="size-3" />}
                    {k.term}
                    {!k.before && k.after && <span className="text-primary text-[9px] font-black uppercase">new</span>}
                  </li>
                ))}
              </ul>
            )}
            {missing.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Still missing: {missing.map((k) => k.term).join(", ")}. Add them in the editor only if you have them.
              </p>
            )}
          </section>

          {/* Actions */}
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Button onClick={() => void downloadPdf()} disabled={busy !== null} className="rounded-xl gap-1.5 font-bold justify-start">
              {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
            </Button>
            <Button variant="outline" onClick={() => void downloadWord()} disabled={busy !== null} className="rounded-xl gap-1.5 justify-start">
              {busy === "docx" ? <Loader2 className="size-4 animate-spin" /> : <FileType2 className="size-4" />} Download Word
              {!isPro && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Crown className="size-3" /> Pro
                </span>
              )}
            </Button>
            <Link href={`/resumes/${resume.id}/edit`} className={actionLink}>
              <FileEdit className="size-4" /> Edit in the editor
            </Link>
            <Link href={`/resumes/${resume.id}/share`} className={actionLink}>
              <Share2 className="size-4" /> Share a link
            </Link>
            <Link
              href={`/resumes/create?mode=tailor&from=${tailoredFor.sourceResumeId && sourceTitle ? tailoredFor.sourceResumeId : resume.id}`}
              className={cn(actionLink, "sm:col-span-2 lg:col-span-1")}
            >
              <WandSparkles className="size-4" /> Tailor for another job
            </Link>
          </section>

          {/* What changed */}
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-black tracking-tight">What changed</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 shrink-0" /> Employers, titles, dates and numbers are kept exactly as in your resume.
              </p>
            </div>
            {grouped.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your resume already fit this job; nothing needed changing.</p>
            ) : (
              grouped.map((g) => (
                <div key={g.section} className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{SECTION_LABEL[g.section]}</h3>
                  <ul className="space-y-2">
                    {g.items.map((c, i) => (
                      <ChangeCard key={`${c.label}-${i}`} change={c} />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          {tailoredFor.jobDescription && (
            <details className="rounded-2xl border p-4 group">
              <summary className="text-sm font-bold cursor-pointer">The job description</summary>
              <p className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-80 overflow-y-auto custom-scrollbar">
                {tailoredFor.jobDescription}
              </p>
            </details>
          )}
        </div>

        {/* Right: the real PDF (falls back to the on-screen preview) */}
        <div className="min-w-0 lg:sticky lg:top-4">
          {pdf ? (
            <ResumeFileViewer key={pdf.url} url={pdf.url} />
          ) : pdfFailed ? (
            <div className="rounded-3xl border bg-stone-100 dark:bg-stone-900/60 p-3 sm:p-6">
              <ScaledPage pageBreaks>
                <ResumeDocument content={resume.content} template={template} />
              </ScaledPage>
            </div>
          ) : (
            <div className="h-[600px] rounded-3xl border bg-muted/20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Making your PDF…</p>
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Word export is a Pro feature"
        description="Upgrade to Pro to download an editable Word file of any resume. PDF stays free."
      />
    </div>
  );
}

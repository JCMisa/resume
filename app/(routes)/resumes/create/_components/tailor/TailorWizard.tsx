"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  ScanLine,
  Sparkles,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import UpgradeModal from "@/components/custom/UpgradeModal";
import { startResumeTailorAction } from "@/lib/actions/resume-tailor";
import { MAX_JOB_DESCRIPTION_CHARS, MIN_JOB_DESCRIPTION_CHARS } from "@/lib/job-match";
import { FREE_LIMITS, PRO_LIMITS, isLimitReached } from "@/lib/plans";
import { RESUME_FILE_ACCEPT, readResumeFile, type ResumeFileRead } from "@/lib/resume-file-read";
import TailorReview, { type TailorReviewData } from "./TailorReview";

export type Starter = { id: string; title: string; status: "parsed" | "created"; updatedAt: Date; score: number | null };

/** Allowance shown under the button. limit null = unlimited (admin). */
export type TailorUsage = { allowed: boolean; used: number; limit: number | null; period: "lifetime" | "monthly"; isPro: boolean };

const WORK_STEPS = ["Reading your resume", "Finding what the job asks for", "Rewriting for the job", "Checking every fact"];

type Upload = { file: File; reading: boolean; message: string; result: ResumeFileRead | null };

function usageLine(u: TailorUsage) {
  if (u.limit === null) return "Unlimited tailored resumes on your plan.";
  const left = Math.max(0, u.limit - u.used);
  if (u.period === "lifetime") {
    return left > 0
      ? `Uses 1 of your ${left} free tailored resume${left === 1 ? "" : "s"} left (${u.limit} in total on Free).`
      : `You've used all ${u.limit} free tailored resumes.`;
  }
  return left > 0 ? `Uses 1 of your ${left} tailored resumes left this month.` : "You've used all your tailored resumes this month.";
}

export default function TailorWizard({
  resumes,
  usage,
  initialFrom,
}: {
  resumes: Starter[];
  usage: TailorUsage;
  initialFrom: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "working" | "review">("input");
  const [source, setSource] = useState<"upload" | "saved">(initialFrom ? "saved" : "upload");
  const [upload, setUpload] = useState<Upload | null>(null);
  const [savedId, setSavedId] = useState<string | null>(initialFrom ?? resumes[0]?.id ?? null);
  const [dragging, setDragging] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [workIndex, setWorkIndex] = useState(0);
  const [review, setReview] = useState<TailorReviewData | null>(null);
  const [upgrade, setUpgrade] = useState<"tailor" | "design" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Progress steps while the AI works (one request, so the steps are paced by time)
  useEffect(() => {
    if (step !== "working") return;
    const t = setInterval(() => setWorkIndex((i) => Math.min(i + 1, WORK_STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [step]);

  async function pickFile(file: File | undefined) {
    if (!file) return;
    setUpload({ file, reading: true, message: "Opening your file…", result: null });
    const result = await readResumeFile(file, (message) => setUpload((u) => (u && u.file === file ? { ...u, message } : u)));
    setUpload((u) => (u && u.file === file ? { ...u, reading: false, result } : u));
    if (!result.ok) toast.error(result.error);
  }

  const resumeReady =
    source === "saved" ? Boolean(savedId) : Boolean(upload && !upload.reading && upload.result?.ok);
  const jdLength = jd.trim().length;
  const jdReady = jdLength >= MIN_JOB_DESCRIPTION_CHARS;
  const canStart = resumeReady && jdReady;

  async function start() {
    if (!usage.allowed) return setUpgrade("tailor");
    if (!canStart) return;

    const fd = new FormData();
    fd.append("jobDescription", jd.trim());
    fd.append("jobTitle", jobTitle.trim());
    fd.append("company", company.trim());
    if (source === "saved") {
      fd.append("source", "resume");
      fd.append("resumeId", savedId!);
    } else if (upload?.result?.ok && upload.result.kind === "text") {
      fd.append("source", "text");
      fd.append("text", upload.result.text);
      fd.append("fileName", upload.file.name);
    } else if (upload?.result?.ok) {
      fd.append("source", "scanned");
      fd.append("file", upload.file);
    }

    setWorkIndex(0);
    setStep("working");
    try {
      const res = await startResumeTailorAction(fd);
      if (!res.success) {
        setStep("input");
        if (isLimitReached(res) && !usage.isPro) setUpgrade("tailor");
        else toast.error(res.error);
        return;
      }
      setReview({
        id: res.data.id,
        jobTitle: res.data.jobTitle,
        company: res.data.company,
        templateId: res.data.templateId,
        score: res.data.score,
        keywords: res.data.keywords,
        suggestedSkills: res.data.suggestedSkills,
      });
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStep("input");
      toast.error("Couldn't reach the server. Check your connection and try again.");
    }
  }

  const upgradeText =
    upgrade === "design"
      ? {
          title: "Designer templates are a Pro feature",
          description: "Upgrade to Pro for designer templates plus your own colours and fonts. Classic, Modern and Compact stay free.",
        }
      : {
          title: `You've used your ${FREE_LIMITS.resume_tailor} free tailored resumes`,
          description: `Upgrade to Pro to tailor up to ${PRO_LIMITS.resume_tailor} resumes a month, plus designer templates, unlimited AI writing and mock interviews.`,
        };

  if (step === "review" && review) {
    return (
      <>
        <TailorReview
          data={review}
          isPro={usage.isPro}
          onLocked={() => setUpgrade("design")}
          onDone={(id) => router.push(`/resumes/${id}/tailored`)}
        />
        <UpgradeModal isOpen={upgrade !== null} onClose={() => setUpgrade(null)} {...upgradeText} />
      </>
    );
  }

  if (step === "working") {
    return (
      <div className="rounded-3xl border bg-card p-5 sm:p-12 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300" aria-live="polite">
        <div className="mx-auto size-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <WandSparkles className="size-7 text-brand-strong dark:text-brand animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black">Tailoring your resume…</h2>
          <p className="text-sm text-muted-foreground">This usually takes 5 to 15 seconds. Please keep this page open.</p>
        </div>
        <ol className="text-left space-y-2.5 max-w-xs mx-auto">
          {WORK_STEPS.map((s, i) => (
            <li key={s} className={cn("flex items-center gap-2.5 text-sm", i > workIndex && "text-muted-foreground")}>
              {i < workIndex ? (
                <Check className="size-4 text-brand-strong dark:text-brand" />
              ) : i === workIndex ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <span className="size-4 rounded-full border" />
              )}
              {s}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Resume */}
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">1. Your resume</h2>
        <div role="tablist" aria-label="Resume source" className="flex rounded-xl border p-1 bg-muted/30 w-fit">
          {(
            [
              { id: "upload", label: "Upload a file" },
              { id: "saved", label: "Use a saved resume" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={source === t.id}
              disabled={t.id === "saved" && !resumes.length}
              onClick={() => setSource(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50",
                source === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {source === "upload" ? (
          upload ? (
            <div
              className={cn(
                "rounded-2xl border p-4 flex items-center gap-3",
                upload.result && !upload.result.ok && "border-destructive/50 bg-destructive/5",
              )}
            >
              <div className="size-10 shrink-0 rounded-xl border bg-muted/40 flex items-center justify-center">
                {upload.reading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : upload.result?.ok ? (
                  upload.result.kind === "scanned" ? <ScanLine className="size-4" /> : <FileText className="size-4" />
                ) : (
                  <AlertCircle className="size-4 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{upload.file.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {upload.reading
                    ? upload.message
                    : !upload.result?.ok
                      ? upload.result?.error
                      : upload.result.kind === "scanned"
                        ? "Scanned PDF: the AI will read the page images."
                        : `Ready · about ${upload.result.words.toLocaleString()} words`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" aria-label="Remove file" onClick={() => setUpload(null)}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void pickFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "w-full rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted/30",
              )}
            >
              <UploadCloud className="size-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-bold">Drop your resume here, or click to choose</p>
              <p className="text-xs text-muted-foreground">PDF or Word (.docx), up to 10 MB. It&apos;s read here and not stored.</p>
            </button>
          )
        ) : (
          <ul role="radiogroup" aria-label="Resume to tailor" className="rounded-2xl border divide-y max-h-72 overflow-y-auto custom-scrollbar bg-card">
            {resumes.map((r) => {
              const selected = savedId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSavedId(r.id)}
                    className={cn("w-full flex items-center gap-3 p-3 text-left transition-colors", selected ? "bg-primary/10" : "hover:bg-muted/40")}
                  >
                    {r.status === "parsed" ? (
                      <UploadCloud className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.status === "parsed" ? "Uploaded" : "Built"} · {format(new Date(r.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span className={cn("size-4 shrink-0 rounded-full border-2", selected ? "border-primary bg-primary" : "border-muted-foreground/40")} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={RESUME_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            void pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </section>

      {/* 2. Job */}
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">2. The job you&apos;re applying for</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={120} placeholder="Job title (optional)" aria-label="Job title" className="rounded-xl" />
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} placeholder="Company (optional)" aria-label="Company" className="rounded-xl" />
        </div>
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value.slice(0, MAX_JOB_DESCRIPTION_CHARS))}
          placeholder="Paste the full job description: responsibilities, requirements, nice-to-haves…"
          aria-label="Job description"
          className="min-h-56 rounded-xl text-sm"
        />
        <p className={cn("text-[11px] tabular-nums", jdLength > 0 && !jdReady ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
          {jdLength > 0 && !jdReady ? "Paste a bit more of the job description. " : ""}
          {jd.length.toLocaleString()} / {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()}
        </p>
      </section>

      {/* Start bar (sticky on phones) */}
      <div className="sticky sm:static bottom-0 z-20 -mx-4 sm:mx-0 border-t sm:border-0 bg-background/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none px-4 py-3 sm:p-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground text-center sm:text-left">{usageLine(usage)}</p>
        <Button onClick={() => void start()} disabled={usage.allowed && !canStart} className="rounded-lg font-bold gap-1.5 w-full sm:w-auto">
          <Sparkles className="size-4" /> Tailor my resume
        </Button>
      </div>

      <UpgradeModal isOpen={upgrade !== null} onClose={() => setUpgrade(null)} {...upgradeText} />
    </div>
  );
}

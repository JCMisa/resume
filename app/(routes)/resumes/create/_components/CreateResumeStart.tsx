"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Copy, FilePlus2, FileText, Loader2, PenLine, Sparkles, UploadCloud, WandSparkles } from "lucide-react";
import TailorWizard, { type TailorUsage } from "./tailor/TailorWizard";
import { toast } from "sonner";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TemplateGallery from "@/components/resume-templates/TemplateGallery";
import UpgradeModal from "@/components/custom/UpgradeModal";
import { createResumeDraftAction } from "@/lib/actions/resume-editor";
import { DEFAULT_TEMPLATE, type TemplateId } from "@/lib/resume-templates";
import { describeFreeLimit, isLimitReached, limitReachedMessage } from "@/lib/plans";

type Starter = { id: string; title: string; status: "parsed" | "created"; updatedAt: Date; score: number | null };

const STEPS = ["Choose a template", "Write your resume", "Download & share"];
const TAILOR_STEPS = ["Your resume + the job", "Review the changes", "Download"];

export type CreateMode = "build" | "tailor";

export default function CreateResumeStart({
  resumes,
  initialFrom,
  buildsLeft,
  allowed,
  initialMode,
  tailorUsage,
}: {
  resumes: Starter[];
  initialFrom: string | null;
  /** null = unlimited (Pro/admin) */
  buildsLeft: number | null;
  allowed: boolean;
  initialMode: CreateMode;
  tailorUsage: TailorUsage;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const steps = mode === "tailor" ? TAILOR_STEPS : STEPS;
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [source, setSource] = useState<"blank" | "existing">(initialFrom ? "existing" : "blank");
  const [fromId, setFromId] = useState<string | null>(initialFrom ?? resumes[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [upgrade, setUpgrade] = useState<"builds" | "design" | null>(null);
  const setUpgradeOpen = (open: boolean) => setUpgrade(open ? "builds" : null);
  const isPro = buildsLeft === null;

  async function create() {
    if (!allowed) return setUpgradeOpen(true);
    if (source === "existing" && !fromId) return toast.error("Pick a resume to start from.");
    setCreating(true);
    const res = await createResumeDraftAction({
      templateId,
      fromResumeId: source === "existing" ? fromId : undefined,
    });
    if (res.success) {
      router.push(`/resumes/${res.data.id}/edit`);
      return; // keep the spinner while the editor loads
    }
    setCreating(false);
    if (isLimitReached(res)) setUpgrade(res.error === limitReachedMessage("design") ? "design" : "builds");
    else toast.error(res.error);
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-24 sm:pb-8">
      {/* Header + steps */}
      <header className="space-y-5 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
            <FilePlus2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Create a resume</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {mode === "tailor"
                ? "Upload or pick a resume, paste a job, and get a version tailored to it. Nothing is invented."
                : "Pick a look, then fill it in. You can switch templates any time without losing anything."}
            </p>
          </div>
        </div>

        {/* Build from scratch / a copy, or tailor an existing resume to a job */}
        <div role="tablist" aria-label="How to create" className="grid grid-cols-2 gap-2 max-w-xl">
          {(
            [
              { id: "build", icon: PenLine, title: "Build a resume", text: "Blank or from a copy" },
              { id: "tailor", icon: WandSparkles, title: "Tailor to a job", text: "Upload + job description" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
                mode === m.id ? "border-primary bg-primary/5" : "border-transparent ring-1 ring-border hover:ring-primary/40",
              )}
            >
              <m.icon className="size-5 shrink-0 text-brand-strong dark:text-brand" />
              <span className="min-w-0">
                <span className="block text-sm font-black">{m.title}</span>
                <span className="block text-[11px] text-muted-foreground truncate">{m.text}</span>
              </span>
            </button>
          ))}
        </div>

        <ol className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5",
                  i === 0 ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[11px]",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {i + 1}
                </span>
                {step}
              </span>
              {i < steps.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground hidden sm:block" />}
            </li>
          ))}
        </ol>
      </header>

      {mode === "tailor" ? (
        <TailorWizard resumes={resumes} usage={tailorUsage} initialFrom={initialFrom} />
      ) : (
      <>
      {/* Templates */}
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">1. Choose a template</h2>
        <TemplateGallery value={templateId} onChange={setTemplateId} isPro={isPro} onLocked={() => setUpgrade("design")} />
      </section>

      {/* Starting point */}
      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">2. How do you want to start?</h2>
        <div role="radiogroup" aria-label="Starting point" className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { id: "blank", icon: PenLine, title: "Start from scratch", text: "A blank resume. We'll fill in your name and email." },
              {
                id: "existing",
                icon: Copy,
                title: "Start from one of my resumes",
                text: resumes.length
                  ? "Copy an uploaded or built resume, then edit the copy."
                  : "You don't have any resumes yet.",
              },
            ] as const
          ).map((o) => {
            const disabled = o.id === "existing" && !resumes.length;
            const selected = source === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => setSource(o.id)}
                className={cn(
                  "text-left rounded-2xl border-2 bg-card p-4 flex items-start gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  selected ? "border-primary" : "border-transparent ring-1 ring-border hover:ring-primary/40",
                )}
              >
                <div className="size-10 shrink-0 rounded-xl border bg-muted/40 flex items-center justify-center">
                  <o.icon className="size-4.5 text-brand-strong dark:text-brand" />
                </div>
                <div>
                  <p className="font-bold">{o.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{o.text}</p>
                </div>
              </button>
            );
          })}
        </div>

        {source === "existing" && resumes.length > 0 && (
          <ul role="radiogroup" aria-label="Resume to copy" className="rounded-2xl border divide-y max-h-80 overflow-y-auto custom-scrollbar bg-card">
            {resumes.map((r) => {
              const selected = fromId === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFromId(r.id)}
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
                    {r.score != null && (
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black tabular-nums text-muted-foreground">
                        ATS {r.score}
                      </span>
                    )}
                    <span
                      className={cn("size-4 shrink-0 rounded-full border-2", selected ? "border-primary bg-primary" : "border-muted-foreground/40")}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          Have a resume file instead?{" "}
          <Link href="/resumes/analyze" className="font-bold underline underline-offset-2 hover:text-foreground">
            Upload it for an ATS check
          </Link>
          , then start from it here.
        </p>
      </section>

      {/* Create bar (sticky on phones) */}
      <div className="fixed sm:static bottom-0 inset-x-0 z-20 border-t sm:border-0 bg-background/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none p-3 sm:p-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          {buildsLeft === null
            ? "Unlimited resume builds on your plan."
            : allowed
              ? `This uses 1 of your ${buildsLeft} remaining resume builds this month.`
              : "You've used all your resume builds this month."}
        </p>
        <div className="flex gap-2 justify-end">
          <Link href="/resumes" className={cn(buttonVariants({ variant: "ghost" }), "rounded-lg hidden sm:inline-flex")}>
            Cancel
          </Link>
          <Button onClick={() => void create()} disabled={creating} className="rounded-lg font-bold gap-1.5 w-full sm:w-auto">
            {creating ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {creating ? "Creating…" : "Create & open editor"}
          </Button>
        </div>
      </div>
      </>
      )}

      <UpgradeModal
        isOpen={upgrade !== null}
        onClose={() => setUpgrade(null)}
        title={upgrade === "design" ? "Designer templates are a Pro feature" : "Resume build limit reached"}
        description={
          upgrade === "design"
            ? "Upgrade to Pro for designer templates plus your own colours and fonts. The Classic, Modern and Compact templates stay free."
            : `Free plans include ${describeFreeLimit("create_resume")}. Upgrade to Pro for unlimited resumes.`
        }
      />
    </div>
  );
}

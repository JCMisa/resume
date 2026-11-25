"use client";

import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TemplateGallery from "@/components/resume-templates/TemplateGallery";
import { finishResumeTailorAction } from "@/lib/actions/resume-tailor";
import { isLimitReached } from "@/lib/plans";
import { containsTerm } from "@/lib/job-match";
import { previewScore, type TailoredFor } from "@/lib/resume-tailor";
import type { SkillSuggestion } from "@/lib/ai-writing";
import type { TemplateId } from "@/lib/resume-templates";

export type TailorReviewData = {
  id: string;
  jobTitle: string;
  company: string;
  templateId: TemplateId;
  score: TailoredFor["score"];
  keywords: TailoredFor["keywords"];
  suggestedSkills: SkillSuggestion[];
};

/** Score with a coloured bar (0-100). */
function ScoreBar({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("text-2xl font-black tabular-nums", muted ? "text-muted-foreground" : "text-foreground")}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-[width] duration-500", muted ? "bg-muted-foreground/40" : "bg-primary")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/**
 * Last step: tick the missing skills you really have, pick a template, finish.
 * Used right after tailoring and on the result page for unfinished ones.
 */
export default function TailorReview({
  data,
  isPro,
  onLocked,
  onDone,
}: {
  data: TailorReviewData;
  isPro: boolean;
  /** A Free user picked a designer template */
  onLocked: () => void;
  onDone: (id: string) => void;
}) {
  const [picked, setPicked] = useState<SkillSuggestion[]>([]);
  const [templateId, setTemplateId] = useState<TemplateId>(data.templateId);
  const [saving, setSaving] = useState(false);

  const after = previewScore(data.keywords, picked);
  const pickedNames = picked.map((p) => p.skill).join(", ");
  const toggle = (s: SkillSuggestion) =>
    setPicked((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  async function finish() {
    setSaving(true);
    try {
      const res = await finishResumeTailorAction(data.id, { skills: picked, templateId });
      if (!res.success) {
        if (isLimitReached(res)) onLocked();
        else toast.error(res.error);
        setSaving(false);
        return;
      }
      onDone(res.data.id);
    } catch {
      toast.error("Couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Score */}
      <section className="rounded-3xl border bg-card p-5 sm:p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-strong dark:text-brand">Tailored</p>
          <h2 className="text-xl font-black tracking-tight">
            {data.jobTitle || "This job"}
            {data.company && <span className="text-muted-foreground font-bold"> at {data.company}</span>}
          </h2>
          <p className="text-xs text-muted-foreground">
            Keyword match: how many of the job&apos;s key terms your resume contains, the way an ATS checks.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <ScoreBar label="Your original" value={data.score.before} muted />
          <ArrowRight className="size-5 text-muted-foreground hidden sm:block" />
          <ScoreBar label="Tailored" value={after} />
        </div>
        {data.keywords.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Job keywords">
            {data.keywords.map((k) => {
              const found = k.after || (pickedNames !== "" && containsTerm(pickedNames, k.term));
              return (
                <li
                  key={k.term}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    found ? "border-primary/40 bg-primary/10" : "text-muted-foreground",
                  )}
                >
                  {found ? <CheckCircle2 className="size-3 text-brand-strong dark:text-brand" /> : <Circle className="size-3" />}
                  {k.term}
                  {k.importance === "required" && <span className="sr-only">(required)</span>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Missing skills */}
      {data.suggestedSkills.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-black tracking-tight">Do you have any of these?</h3>
            <p className="text-sm text-muted-foreground">
              The job asks for them and your resume doesn&apos;t list them. Tick only the ones you really have; they&apos;ll be added to
              your Skills.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.suggestedSkills.map((s) => {
              const on = picked.includes(s);
              return (
                <button
                  key={`${s.category}:${s.skill}`}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(s)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors",
                    on ? "border-primary bg-primary/10" : "border-transparent ring-1 ring-border hover:ring-primary/40",
                  )}
                >
                  <span className={cn("size-4 rounded border flex items-center justify-center", on && "bg-primary border-primary")}>
                    {on && <Check className="size-3 text-primary-foreground" />}
                  </span>
                  {s.skill}
                  <span className="text-[11px] font-normal text-muted-foreground">{s.category}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Template */}
      <section className="space-y-3">
        <h3 className="text-lg font-black tracking-tight">Pick a look</h3>
        <TemplateGallery value={templateId} onChange={setTemplateId} isPro={isPro} onLocked={onLocked} />
      </section>

      <div className="sticky sm:static bottom-0 z-20 -mx-4 sm:mx-0 border-t sm:border-0 bg-background/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none px-4 py-3 sm:p-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start">
          <ShieldCheck className="size-3.5 shrink-0" />
          Employers, titles, dates and numbers are kept exactly as in your resume.
        </p>
        <Button onClick={() => void finish()} disabled={saving} className="rounded-lg font-bold gap-1.5 w-full sm:w-auto">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {saving ? "Saving…" : "Finish & preview"}
        </Button>
      </div>
    </div>
  );
}

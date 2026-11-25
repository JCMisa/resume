"use client";

import { useState } from "react";
import { Check, Crown, Loader2, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { tailorResumeAction } from "@/lib/actions/ai-writing";
import { applyTailor, type SkillSuggestion, type TailorResult } from "@/lib/ai-writing";
import { MAX_JOB_DESCRIPTION_CHARS, MIN_JOB_DESCRIPTION_CHARS } from "@/lib/job-match";
import { isLimitReached } from "@/lib/plans";
import type { ResumeContent } from "@/lib/resume-sanitize";
import { useAiWriting } from "./AiWritingProvider";

// Tailor to a job (Pro): paste a job description, get a tailored summary,
// rewritten bullets and missing keywords, tick what to keep, apply.

function Pick({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors",
        checked ? "border-primary/60 bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" />
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </label>
  );
}

export default function TailorPanel({
  content,
  onApply,
}: {
  content: ResumeContent;
  onApply: (next: ResumeContent, applied: number, skipped: number) => void;
}) {
  const ai = useAiWriting();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [summary, setSummary] = useState(true);
  const [bulletIds, setBulletIds] = useState<Set<string>>(new Set());
  const [keywords, setKeywords] = useState<SkillSuggestion[]>([]);

  if (!ai.isPro) {
    return (
      <div className="rounded-2xl border border-dashed p-5 text-center space-y-3">
        <div className="mx-auto size-10 rounded-xl bg-brand/10 flex items-center justify-center">
          <Target className="size-5 text-brand-strong dark:text-brand" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black flex items-center justify-center gap-1.5">
            Tailor to a job <Crown className="size-3.5 text-amber-500" />
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Paste a job description and get a summary, bullet rewrites and keywords aimed at that exact job. Review
            each change and apply the ones you want.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-lg font-bold"
          onClick={() =>
            ai.openUpgrade(
              "Tailor to a job is a Pro feature",
              "Upgrade to Pro to rewrite your resume for a specific job description, plus unlimited AI writing.",
            )
          }
        >
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  const tooShort = jd.trim().length < MIN_JOB_DESCRIPTION_CHARS;

  async function tailor() {
    setLoading(true);
    try {
      const res = await tailorResumeAction(ai.resumeId, ai.content(), jd);
      if (!res.success) {
        if (isLimitReached(res)) ai.openUpgrade("Tailor to a job is a Pro feature", res.error);
        else toast.error(res.error);
        return;
      }
      setResult(res.data);
      setSummary(!!res.data.summary);
      setBulletIds(new Set(res.data.bullets.map((b) => b.id)));
      setKeywords([]); // keywords are opt-in: only skills the user really has
    } catch {
      toast.error("Couldn't reach the AI. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!result) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Paste the job description. You&apos;ll get a tailored summary, rewritten bullets and missing keywords to review;
          nothing changes until you apply it.
        </p>
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value.slice(0, MAX_JOB_DESCRIPTION_CHARS))}
          placeholder="Paste the full job description here…"
          className="min-h-56 text-xs rounded-xl"
          aria-label="Job description"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {jd.length.toLocaleString()} / {MAX_JOB_DESCRIPTION_CHARS.toLocaleString()}
          </span>
          <Button size="sm" className="rounded-lg font-bold gap-1.5" disabled={tooShort || loading} onClick={() => void tailor()}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Tailoring…" : "Tailor my resume"}
          </Button>
        </div>
      </div>
    );
  }

  const count = (summary && result.summary ? 1 : 0) + bulletIds.size + keywords.length;
  const nothing = !result.summary && !result.bullets.length && !result.keywords.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black truncate">{result.jobTitle ? `For: ${result.jobTitle}` : "Suggestions"}</p>
        <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
          Change job
        </Button>
      </div>

      {nothing && <p className="text-xs text-muted-foreground">Your resume already fits this job well; nothing to change.</p>}

      {result.summary && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Summary</h3>
          <Pick checked={summary} onChange={setSummary}>
            <p className="text-xs leading-relaxed">{result.summary}</p>
          </Pick>
        </section>
      )}

      {result.bullets.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Bullets ({bulletIds.size} of {result.bullets.length} selected)
          </h3>
          {result.bullets.map((b) => (
            <Pick
              key={b.id}
              checked={bulletIds.has(b.id)}
              onChange={(v) =>
                setBulletIds((s) => {
                  const n = new Set(s);
                  if (v) n.add(b.id);
                  else n.delete(b.id);
                  return n;
                })
              }
            >
              <p className="text-[11px] text-muted-foreground line-through decoration-muted-foreground/50">{b.original}</p>
              <p className="text-xs leading-relaxed">{b.rewrite}</p>
              {b.reason && <p className="text-[11px] text-brand-strong dark:text-brand">{b.reason}</p>}
            </Pick>
          ))}
        </section>
      )}

      {result.keywords.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Missing keywords</h3>
          <p className="text-[11px] text-muted-foreground">The job asks for these. Tick only the ones you really have; they&apos;re added to Skills.</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((k) => {
              const on = keywords.includes(k);
              return (
                <button
                  key={`${k.category}:${k.skill}`}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKeywords((list) => (on ? list.filter((x) => x !== k) : [...list, k]))}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    on ? "border-primary bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  {on && <Check className="size-3" />} {k.skill}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!nothing && (
        <div className="sticky bottom-0 bg-popover pt-2 pb-1 space-y-1.5">
          <Button
            className="w-full rounded-lg font-bold gap-1.5"
            disabled={count === 0}
            onClick={() => {
              const out = applyTailor(content, result, { summary, bulletIds: [...bulletIds], keywords });
              onApply(out.content, out.applied, out.skipped);
              setResult(null);
            }}
          >
            <Check className="size-4" /> Apply {count} change{count === 1 ? "" : "s"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Check every fact and fill in any [placeholders].</p>
        </div>
      )}
    </div>
  );
}

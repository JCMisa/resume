"use client";

import { useState } from "react";
import { Check, Loader2, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BulletSection, SkillSuggestion } from "@/lib/ai-writing";
import { taskKey, useAiWriting } from "./AiWritingProvider";

// Inline AI writing helpers for the Assist-mode forms. Each one asks for
// suggestions, shows them, and only changes the resume when the user picks one.

/** "7 of 10 AI writes left this month" for Free; nothing for Pro. */
function Allowance() {
  const { remaining, limit } = useAiWriting();
  if (remaining === null) return null;
  return (
    <span className="text-[10px] text-muted-foreground">
      {remaining} of {limit} AI writes left this month
    </span>
  );
}

function AiButton({
  label,
  busy,
  onClick,
  className,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
  className?: string;
}) {
  const { busy: anyBusy } = useAiWriting();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={!!anyBusy}
      className={cn("rounded-lg text-[11px] font-bold h-7 gap-1 border-brand/40 hover:bg-brand/10", className)}
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-brand-strong dark:text-brand" />}
      {busy ? "Writing…" : label}
    </Button>
  );
}

function SuggestionBox({
  title,
  onClose,
  onRetry,
  retrying,
  children,
}: {
  title: string;
  onClose: () => void;
  onRetry: () => void;
  retrying: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/5 p-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="size-3.5 text-brand-strong dark:text-brand" /> {title}
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-1" onClick={onRetry} disabled={retrying}>
            {retrying ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />} Try again
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Dismiss suggestions">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
      {children}
      <p className="text-[10px] text-muted-foreground">
        AI suggestions can be wrong. Check every fact and fill in any [placeholders] before you send this resume.
      </p>
    </div>
  );
}

// ── Summary ────────────────────────────────────────────────────────────────

export function AiSummaryAssist({ hasSummary, onUse }: { hasSummary: boolean; onUse: (text: string) => void }) {
  const ai = useAiWriting();
  const [options, setOptions] = useState<string[] | null>(null);
  const busy = ai.busy === "summary";

  async function generate() {
    const res = await ai.run({ kind: "summary" });
    if (res) setOptions(res.options);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <AiButton label={hasSummary ? "Improve with AI" : "Write with AI"} busy={busy && !options} onClick={() => void generate()} />
        <Allowance />
      </div>
      {options && (
        <SuggestionBox title="Pick a summary" onClose={() => setOptions(null)} onRetry={() => void generate()} retrying={busy}>
          <ul className="space-y-2">
            {options.map((o, i) => (
              <li key={i} className="rounded-xl border bg-background p-3 space-y-2">
                <p className="text-xs leading-relaxed">{o}</p>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 rounded-lg text-[11px] font-bold gap-1"
                  onClick={() => {
                    onUse(o);
                    setOptions(null);
                  }}
                >
                  <Check className="size-3" /> Use this
                </Button>
              </li>
            ))}
          </ul>
        </SuggestionBox>
      )}
    </div>
  );
}

// ── Bullets (one experience or project entry) ──────────────────────────────

export function AiBulletsAssist({
  section,
  index,
  hasBullets,
  onUse,
}: {
  section: BulletSection;
  index: number;
  hasBullets: boolean;
  onUse: (bullets: string[], mode: "replace" | "add") => void;
}) {
  const ai = useAiWriting();
  const [bullets, setBullets] = useState<string[] | null>(null);
  const busy = ai.busy === taskKey({ kind: "bullets", section, index });

  async function generate() {
    const res = await ai.run({ kind: "bullets", section, index });
    if (res) setBullets(res.bullets);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <AiButton label={hasBullets ? "Improve bullets with AI" : "Write bullets with AI"} busy={busy && !bullets} onClick={() => void generate()} />
        <Allowance />
      </div>
      {bullets && (
        <SuggestionBox title={hasBullets ? "Stronger bullets" : "Suggested bullets"} onClose={() => setBullets(null)} onRetry={() => void generate()} retrying={busy}>
          <ul className="rounded-xl border bg-background p-3 space-y-1.5 list-disc pl-7">
            {bullets.map((b, i) => (
              <li key={i} className="text-xs leading-relaxed">
                {b}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-lg text-[11px] font-bold gap-1"
              onClick={() => {
                onUse(bullets, "replace");
                setBullets(null);
              }}
            >
              <Check className="size-3" /> {hasBullets ? "Replace my bullets" : "Use these"}
            </Button>
            {hasBullets && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-lg text-[11px] font-bold gap-1"
                onClick={() => {
                  onUse(bullets, "add");
                  setBullets(null);
                }}
              >
                <Plus className="size-3" /> Add below mine
              </Button>
            )}
          </div>
        </SuggestionBox>
      )}
    </div>
  );
}

// ── Skills ─────────────────────────────────────────────────────────────────

export function AiSkillsAssist({ onAdd }: { onAdd: (picks: SkillSuggestion[]) => void }) {
  const ai = useAiWriting();
  const [skills, setSkills] = useState<SkillSuggestion[] | null>(null);
  const busy = ai.busy === "skills";

  async function generate() {
    const res = await ai.run({ kind: "skills" });
    if (!res) return;
    setSkills(res.skills);
  }

  const add = (picks: SkillSuggestion[]) => {
    onAdd(picks);
    setSkills((s) => {
      const left = (s ?? []).filter((x) => !picks.includes(x));
      return left.length ? left : null;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <AiButton label="Suggest skills with AI" busy={busy && !skills} onClick={() => void generate()} />
        <Allowance />
      </div>
      {skills && (
        <SuggestionBox title="Skills you may have missed" onClose={() => setSkills(null)} onRetry={() => void generate()} retrying={busy}>
          {skills.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nothing new to suggest: your skills already cover what your experience shows. (This didn&apos;t count.)
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">Only add skills you really have. Click one to add it.</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <button
                    key={`${s.category}:${s.skill}`}
                    type="button"
                    onClick={() => add([s])}
                    className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] font-semibold hover:border-brand hover:bg-brand/10"
                    title={`Add to ${s.category}`}
                  >
                    <Plus className="size-3" /> {s.skill}
                    <span className="text-muted-foreground font-normal">· {s.category}</span>
                  </button>
                ))}
              </div>
              <Button type="button" size="sm" className="h-7 rounded-lg text-[11px] font-bold gap-1" onClick={() => add(skills)}>
                <Check className="size-3" /> Add all
              </Button>
            </>
          )}
        </SuggestionBox>
      )}
    </div>
  );
}

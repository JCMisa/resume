"use client";

import { Check, Crown, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_CONTENT, TEMPLATE_IDS, TEMPLATES, type TemplateId } from "@/lib/resume-templates";
import type { ResumeContent } from "@/lib/resume-sanitize";
import ResumeDocument from "./ResumeDocument";
import ScaledPage from "./ScaledPage";

/**
 * Template cards with live mini previews (sample content, or the user's own).
 * Designer templates show a Pro badge; for Free users clicking one calls
 * `onLocked` instead of selecting it (the server enforces this too).
 */
export default function TemplateGallery({
  value,
  onChange,
  content = SAMPLE_CONTENT,
  isPro = false,
  onLocked,
  className,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  content?: ResumeContent;
  isPro?: boolean;
  onLocked?: (id: TemplateId) => void;
  className?: string;
}) {
  // Free templates first, then the designer ones
  const ids = [...TEMPLATE_IDS].sort((a, b) => Number(TEMPLATES[a].tier === "pro") - Number(TEMPLATES[b].tier === "pro"));
  return (
    <div role="radiogroup" aria-label="Resume templates" className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {ids.map((id) => {
        const t = TEMPLATES[id];
        const selected = value === id;
        const locked = t.tier === "pro" && !isPro;
        // Previews show the template's own look, not the resume's custom colour
        const preview = content.design?.accent || content.design?.font
          ? { ...content, design: { ...content.design, accent: undefined, font: undefined } }
          : content;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={locked ? `${t.name} (Pro)` : t.name}
            onClick={() => (locked ? onLocked?.(id) : onChange(id))}
            className={cn(
              "group text-left rounded-2xl border-2 bg-card p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary shadow-lg shadow-primary/10" : "border-transparent ring-1 ring-border hover:ring-primary/40",
            )}
          >
            <div className="relative rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 p-2">
              <div className="pointer-events-none select-none" aria-hidden>
                <ScaledPage clip>
                  <ResumeDocument content={preview} template={t} />
                </ScaledPage>
              </div>
              {selected && (
                <span className="absolute top-2 right-2 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                  <Check className="size-4" />
                </span>
              )}
              {locked && (
                <span className="absolute top-2 right-2 size-7 rounded-full bg-background/90 text-foreground flex items-center justify-center shadow">
                  <Lock className="size-3.5" />
                </span>
              )}
            </div>
            <div className="mt-3 px-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-black">{t.name}</p>
                {t.tier === "pro" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <Crown className="size-3" /> Pro
                  </span>
                )}
                {t.atsSafe && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-strong dark:text-brand">
                    <ShieldCheck className="size-3" /> ATS-safe
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.tagline}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

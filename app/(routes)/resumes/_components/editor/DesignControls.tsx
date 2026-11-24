"use client";

import { Check, Crown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_PRESETS, HEX_COLOR, readableAccent } from "@/lib/resume-templates";
import type { ResumeContent } from "@/lib/resume-sanitize";

type Design = NonNullable<ResumeContent["design"]>;

/**
 * Pro look settings: accent colour and font. Free users see them with a Pro
 * badge; any click opens the upgrade dialog (`onLocked`). The save action
 * enforces the same rule on the server.
 */
export default function DesignControls({
  design,
  templateAccent,
  isPro,
  onChange,
  onLocked,
}: {
  design: Design | undefined;
  /** The template's own accent, shown as the "Template" swatch */
  templateAccent: string;
  isPro: boolean;
  onChange: (patch: Partial<Design>) => void;
  onLocked: () => void;
}) {
  const accent = design?.accent;
  const guard = (fn: () => void) => () => (isPro ? fn() : onLocked());
  const adjusted = accent && HEX_COLOR.test(accent) && readableAccent(accent) !== accent;

  const swatch = (hex: string | undefined, label: string, color: string) => {
    const active = (accent ?? undefined) === hex;
    return (
      <button
        key={label}
        type="button"
        title={label}
        aria-label={`${label} colour`}
        aria-pressed={active}
        onClick={guard(() => onChange({ accent: hex }))}
        className={cn(
          "size-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110",
          active ? "border-foreground" : "border-transparent ring-1 ring-border",
        )}
        style={{ background: color }}
      >
        {active && <Check className="size-3.5 text-white drop-shadow" />}
      </button>
    );
  };

  return (
    <div className="rounded-2xl border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-black">Colour &amp; font</p>
        {!isPro && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Crown className="size-3" /> Pro
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Accent colour</p>
        <div className="flex flex-wrap items-center gap-2">
          {swatch(undefined, "Template", templateAccent)}
          {ACCENT_PRESETS.map((p) => swatch(p.hex, p.name, p.hex))}
          <label
            className={cn(
              "relative size-8 rounded-full ring-1 ring-border overflow-hidden cursor-pointer",
              accent && !ACCENT_PRESETS.some((p) => p.hex === accent) && "ring-2 ring-foreground",
            )}
            title="Any colour"
            style={{ background: "conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)" }}
            onClick={(e) => {
              if (!isPro) {
                e.preventDefault();
                onLocked();
              }
            }}
          >
            <input
              type="color"
              aria-label="Pick any colour"
              value={accent && HEX_COLOR.test(accent) ? accent : templateAccent}
              onChange={(e) => onChange({ accent: e.target.value.toLowerCase() })}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={!isPro}
            />
          </label>
        </div>
        {adjusted && (
          <p className="text-[11px] text-muted-foreground">
            That colour is too light to read on white, so it&apos;s printed a little darker.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Font</p>
        <div role="radiogroup" aria-label="Font" className="flex rounded-xl border p-1 bg-muted/30 w-fit">
          {(
            [
              { id: undefined, label: "Template" },
              { id: "sans", label: "Sans serif" },
              { id: "serif", label: "Serif" },
            ] as const
          ).map((f) => (
            <button
              key={f.label}
              type="button"
              role="radio"
              aria-checked={design?.font === f.id}
              onClick={guard(() => onChange({ font: f.id }))}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                design?.font === f.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                f.id === "serif" && "font-serif",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Standard fonts every ATS and printer reads.</p>
      </div>

      {(accent || design?.font) && isPro && (
        <button
          type="button"
          onClick={() => onChange({ accent: undefined, font: undefined })}
          className="text-[11px] font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <RotateCcw className="size-3" /> Use the template&apos;s look
        </button>
      )}
    </div>
  );
}

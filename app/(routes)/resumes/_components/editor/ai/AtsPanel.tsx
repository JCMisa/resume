"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHECK_STEP, liveAtsReport, scoreBand, type LiveAtsReport } from "@/lib/live-ats";
import type { ResumeContent } from "@/lib/resume-sanitize";

// Live ATS check: recomputed in the browser as the user types (no AI, free
// for everyone). Same deterministic checks as the full AI report.

export function useLiveAts(content: ResumeContent): LiveAtsReport {
  return useMemo(() => liveAtsReport(content), [content]);
}

const TONE = {
  good: "text-emerald-600 dark:text-emerald-400",
  ok: "text-amber-600 dark:text-amber-400",
  low: "text-red-600 dark:text-red-400",
} as const;

const STATUS = {
  pass: { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400", label: "Passed" },
  warn: { icon: AlertTriangle, cls: "text-amber-600 dark:text-amber-400", label: "Could be better" },
  fail: { icon: XCircle, cls: "text-red-600 dark:text-red-400", label: "Fix this" },
} as const;

/** Small score chip for the editor's top bar. */
export function AtsScoreBadge({ report }: { report: LiveAtsReport }) {
  const band = scoreBand(report.score);
  return (
    <span className={cn("tabular-nums font-black", TONE[band.tone])} aria-label={`ATS readiness ${report.score} out of 100`}>
      {report.score}
    </span>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function AtsPanel({
  report,
  onFix,
}: {
  report: LiveAtsReport;
  /** Jump to the Assist-mode step where a check is fixed */
  onFix: (step: string) => void;
}) {
  const band = scoreBand(report.score);
  const problems = report.checks.filter((c) => c.status !== "pass");
  const passed = report.checks.filter((c) => c.status === "pass");

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-4 flex items-center gap-4">
        <div className="text-center shrink-0">
          <p className={cn("text-4xl font-black tabular-nums leading-none", TONE[band.tone])}>{report.score}</p>
          <p className="text-[10px] text-muted-foreground mt-1">/ 100</p>
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className={cn("text-sm font-black", TONE[band.tone])}>{band.label}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            ATS readiness, updated as you type. {report.counts.fail + report.counts.warn === 0
              ? "Every check passes."
              : `${report.counts.fail + report.counts.warn} thing${report.counts.fail + report.counts.warn === 1 ? "" : "s"} to improve.`}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <Bar label="Machine-readable (contact, sections, dates, length)" value={report.parts.parseability} />
        <Bar label="Content quality (numbers, verbs, bullet length)" value={report.parts.content} />
        <Bar label="Sections filled in" value={report.parts.completeness} />
      </div>

      {problems.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">To improve</h3>
          <ul className="space-y-2">
            {problems.map((c) => {
              const s = STATUS[c.status];
              const step = CHECK_STEP[c.id];
              return (
                <li key={c.id} className="rounded-xl border p-3 flex gap-2.5">
                  <s.icon className={cn("size-4 shrink-0 mt-0.5", s.cls)} aria-label={s.label} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold">{c.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{c.detail}</p>
                    {step && (
                      <button
                        type="button"
                        onClick={() => onFix(step)}
                        className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Fix it <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {passed.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Passed</h3>
          <ul className="space-y-1">
            {passed.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Passed" />
                {c.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        This is a quick check without AI. The full AI analysis also judges impact, keywords and clarity, so its score can differ.
      </p>
    </div>
  );
}

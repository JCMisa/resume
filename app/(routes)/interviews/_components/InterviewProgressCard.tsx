"use client";

import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewHistoryItem } from "@/lib/actions/interview";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-black tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

// Score summary + recent-score bars, computed from the history list data.
export default function InterviewProgressCard({
  items,
}: {
  items: InterviewHistoryItem[] | null;
}) {
  // Graded sessions, oldest -> newest
  const graded = (items ?? [])
    .filter((i) => i.state === "graded" && i.overallScore != null)
    .map((i) => ({ id: i.id, role: i.jobRole, score: i.overallScore as number }))
    .reverse();

  const scores = graded.map((g) => g.score);
  const average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const best = scores.length ? Math.max(...scores) : null;
  const latest = scores.at(-1) ?? null;
  const previous = scores.length > 1 ? scores[scores.length - 2] : null;
  const delta = latest != null && previous != null ? latest - previous : null;
  const recent = graded.slice(-10);

  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 space-y-4 h-full">
      <header className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight">Your progress</h2>
          <p className="text-[11px] text-muted-foreground">
            Based on your graded interviews
          </p>
        </div>
      </header>

      {items === null ? (
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      ) : graded.length === 0 ? (
        <div className="h-40 rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-4">
          <p className="text-sm font-bold">No scores yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-60">
            Finish your first interview to start tracking your progress here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Sessions" value={graded.length} />
            <Stat label="Average" value={average} />
            <Stat label="Best" value={best} />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Latest score{" "}
              <span className="font-black text-foreground tabular-nums">
                {latest}
              </span>
            </span>
            {delta != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-bold tabular-nums",
                  delta > 0
                    ? "text-brand-strong dark:text-brand"
                    : delta < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground",
                )}
              >
                {delta > 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : delta < 0 ? (
                  <TrendingDown className="size-3.5" />
                ) : (
                  <Minus className="size-3.5" />
                )}
                {delta > 0 ? `+${delta}` : delta} vs previous
              </span>
            )}
          </div>

          {/* Recent scores, oldest -> newest */}
          <div
            className="flex items-end gap-1.5 h-20"
            aria-label="Recent interview scores"
          >
            {recent.map((g) => (
              <div
                key={g.id}
                title={`${g.role}: ${g.score}`}
                className="flex-1 rounded-t-md bg-brand/70 hover:bg-brand transition-colors min-h-1"
                style={{ height: `${Math.max(g.score, 4)}%` }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

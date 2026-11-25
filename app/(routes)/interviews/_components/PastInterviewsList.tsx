"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, History, Mic, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listInterviewHistoryAction,
  type InterviewHistoryItem,
} from "@/lib/actions/interview";

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-lg px-2 py-1 text-xs font-black tabular-nums",
        score >= 80
          ? "bg-brand/15 text-brand-strong dark:text-brand"
          : score >= 60
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      )}
    >
      {score}
    </span>
  );
}

function StatusBadge({ item }: { item: InterviewHistoryItem }) {
  if (item.state === "graded" && item.overallScore != null) {
    return <ScoreBadge score={item.overallScore} />;
  }
  if (item.state === "needs_grading") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
        <RotateCcw className="size-3" /> Needs grading
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">
      Incomplete
    </span>
  );
}

/** Loads the user's interview history once; shared by the list and progress card. */
export function useInterviewHistory() {
  const [items, setItems] = useState<InterviewHistoryItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listInterviewHistoryAction().then((res) => {
      if (cancelled) return;
      if (res.success) setItems(res.data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, failed };
}

// Recent interviews with their score; each opens its results page (where
// "Needs grading" sessions can be re-graded).
export default function PastInterviewsList({
  items,
  failed,
}: {
  items: InterviewHistoryItem[] | null;
  failed: boolean;
}) {
  return (
    <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
      <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
            <History className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight">
              Past interviews
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Your sessions and scores
            </p>
          </div>
        </div>
        {items && items.length > 0 && (
          <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
            {items.length}
          </span>
        )}
      </header>

      {failed ? (
        <p className="p-6 text-xs text-muted-foreground text-center">
          Couldn&apos;t load your past interviews. Refresh to try again.
        </p>
      ) : items === null ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-5 sm:p-8 text-center space-y-2">
          <Mic className="size-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-bold">No interviews yet</p>
          <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
            Your completed sessions and their scores will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-y-auto custom-scrollbar max-h-[26rem]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/interviews/results/${item.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {item.jobRole}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                <StatusBadge item={item} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

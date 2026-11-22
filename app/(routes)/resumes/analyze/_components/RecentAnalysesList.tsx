"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, FileSearch, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listRecentAnalysesAction,
  type RecentAnalysisItem,
} from "@/lib/actions/resume";

/** Loads the user's recently analyzed resumes; `reload` after a new analysis. */
export function useRecentAnalyses() {
  const [items, setItems] = useState<RecentAnalysisItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchList = useCallback(() => listRecentAnalysesAction(), []);

  useEffect(() => {
    let cancelled = false;
    fetchList().then((res) => {
      if (cancelled) return;
      if (res.success) setItems(res.data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  const reload = useCallback(() => {
    fetchList().then((res) => {
      if (res.success) {
        setItems(res.data);
        setFailed(false);
      }
    });
  }, [fetchList]);

  return { items, failed, reload };
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
        —
      </span>
    );
  }
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

// Recently analyzed resumes with their ATS score; each opens the resume page.
export default function RecentAnalysesList({
  items,
  failed,
}: {
  items: RecentAnalysisItem[] | null;
  failed: boolean;
}) {
  return (
    <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
            <History className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight">
              Recent analyses
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Your audited resumes and scores
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
          Couldn&apos;t load your analyses. Refresh to try again.
        </p>
      ) : items === null ? (
        <div className="p-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <FileSearch className="size-6 text-muted-foreground/50 mx-auto" />
          <p className="text-sm font-bold">No analyses yet</p>
          <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
            Upload a resume and its ATS score will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-y-auto custom-scrollbar max-h-[26rem]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/resumes/${item.id}`}
                className="group flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.updatedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <ScoreBadge score={item.overallScore} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

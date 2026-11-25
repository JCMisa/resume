/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RecentAssetsList({ items }: { items: any[] }) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[360px]">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[11px] font-bold font-mono text-muted-foreground uppercase tracking-widest">
            Document Registry
          </span>
          <h3 className="text-lg font-black tracking-tight mt-0.5">
            Recent Workspaces
          </h3>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-start divide-y divide-stone-50 dark:divide-stone-800/60 overflow-y-auto no-scrollbar pt-1">
        {items.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
            <p className="text-xs text-muted-foreground font-medium">
              No document entities compiled yet.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                    item.status === "parsed"
                      ? "bg-purple-500/5 dark:bg-purple-400/5 text-purple-500 border-purple-500/10"
                      : "bg-blue-500/5 dark:bg-blue-400/5 text-blue-500 border-blue-500/10"
                  }`}
                >
                  {item.status === "parsed" ? (
                    <Sparkles className="size-4" />
                  ) : (
                    <PlusCircle className="size-4" />
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-black text-foreground truncate max-w-[200px] sm:max-w-[260px]">
                    {item.title}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase mt-0.5 block tracking-wider">
                    Source:{" "}
                    {item.status === "parsed"
                      ? "AI Parse Flow"
                      : "Manual Workspace"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.score !== null && (
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-xs font-black font-mono bg-stone-50 dark:bg-stone-800 px-2 py-1 rounded-md border text-foreground shadow-sm",
                      )}
                    >
                      {item.score}
                    </span>
                  </div>
                )}
                <Link
                  href={`/resumes/${item.id}`}
                  className="p-1.5 rounded-lg border bg-stone-50 dark:bg-stone-800 opacity-60 group-hover:opacity-100 hover:text-primary transition-all shadow-sm"
                >
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

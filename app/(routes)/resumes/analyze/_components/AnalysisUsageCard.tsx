"use client";

import { Gauge, Infinity as InfinityIcon, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ProCheckoutButton from "@/components/custom/ProCheckoutButton";
import { FREE_LIMITS, formatResetDate } from "@/lib/plans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AnalyzeUsage = {
  isPro: boolean;
  used: number;
};

// This month's analysis allowance (Free) or "unlimited" (Pro / admin).
export default function AnalysisUsageCard({
  usage,
}: {
  usage: AnalyzeUsage | null;
}) {
  if (!usage) {
    return <div className="h-36 rounded-3xl bg-muted animate-pulse" />;
  }

  const limit = FREE_LIMITS.analyze;
  const used = Math.min(usage.used, limit);
  const left = Math.max(limit - usage.used, 0);

  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
          <Gauge className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight">AI analyses</h2>
          <p className="text-[11px] text-muted-foreground">
            {usage.isPro ? "Pro plan" : `Free plan · resets ${formatResetDate()}`}
          </p>
        </div>
      </div>

      {usage.isPro ? (
        <p className="flex items-center gap-2 text-sm font-semibold">
          <InfinityIcon className="size-4 text-brand-strong dark:text-brand" />
          Unlimited analyses
          <span className="text-xs font-normal text-muted-foreground">
            ({usage.used} this month)
          </span>
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black tabular-nums">
                {left}
                <span className="text-sm font-bold text-muted-foreground">
                  {" "}
                  left
                </span>
              </span>
              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                {used} / {limit} used
              </span>
            </div>
            <Progress value={(used / limit) * 100} className="h-2" />
          </div>
          <ProCheckoutButton
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full rounded-xl font-bold gap-1.5",
            )}
          >
            <Zap className="size-3.5 fill-current" /> Go unlimited with Pro
          </ProCheckoutButton>
        </>
      )}
    </section>
  );
}

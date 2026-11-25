import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRO_LIMITS, formatResetDate } from "@/lib/plans";

// Shown to Pro users who used their monthly interview allowance.
export default function InterviewCapReached() {
  return (
    <div className="flex flex-col items-center justify-center p-8 border rounded-3xl bg-muted/10 space-y-4 w-full text-center border-dashed animate-in fade-in zoom-in-95">
      <div className="p-4 bg-primary/10 text-primary rounded-full border border-primary/20">
        <CalendarClock className="h-6 w-6" />
      </div>
      <h3 className="text-base font-black tracking-tight">
        Monthly interview allowance used
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
        You&apos;ve completed all {PRO_LIMITS.interview} AI mock interviews
        included this month. Your allowance resets on{" "}
        <span className="font-bold text-foreground">{formatResetDate()}</span>.
        In the meantime, your past reports are on the dashboard.
      </p>
      <Button asChild variant="outline" className="rounded-lg font-bold px-6">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}

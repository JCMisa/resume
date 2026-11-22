import Link from "next/link";
import { FilePlus2, FileStack, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResumeLibraryAction } from "@/lib/actions/resume-library";
import { getUserBillingStatus } from "@/lib/actions/billing";
import ResumeLibrary, { LibraryEmptyActions } from "../_components/ResumeLibrary";
import { KpiRow, NextActionCard, TopKeywordsCard } from "../_components/ResumeInsights";
import {
  ActivityChart,
  ScoreDistributionChart,
  ScoreTrendChart,
} from "../_components/ResumeCharts";

export default async function ResumesPage() {
  const [library, billing] = await Promise.all([
    getResumeLibraryAction(),
    getUserBillingStatus(),
  ]);

  const header = (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
          <FileStack className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Resumes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track ATS scores, spot what to fix next, and manage every resume in one place.
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/resumes/create"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl font-bold gap-1.5")}
        >
          <FilePlus2 className="size-4" /> Build
        </Link>
        <Link href="/resumes/analyze" className={cn(buttonVariants(), "rounded-xl font-bold gap-1.5")}>
          <Sparkles className="size-4" /> Analyze
        </Link>
      </div>
    </header>
  );

  if (!library.success) {
    return (
      <div className="w-full space-y-6">
        {header}
        <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {library.error} Refresh the page to try again.
        </div>
      </div>
    );
  }

  const { items, stats, trend, distribution, activity, keywords, nextAction } = library.data;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {header}

      {items.length === 0 ? (
        <section className="rounded-3xl border border-dashed bg-card p-10 sm:p-16 text-center space-y-4">
          <div className="mx-auto size-14 rounded-2xl bg-brand/10 flex items-center justify-center">
            <FileStack className="size-7 text-brand-strong dark:text-brand" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black">No resumes yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Upload your current resume for an instant ATS score and rewrite suggestions, or build
              a new one in the editor. Your scores and progress will show up here.
            </p>
          </div>
          <LibraryEmptyActions />
        </section>
      ) : (
        <>
          <KpiRow
            stats={stats}
            usage={{ isPro: billing.isPro, used: billing.limits.analyses }}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <ScoreTrendChart data={trend} className="lg:col-span-2" />
            <NextActionCard action={nextAction} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <ActivityChart data={activity} />
            <ScoreDistributionChart data={distribution} />
            <TopKeywordsCard
              keywords={keywords}
              analyzed={stats.analyzed}
              className="md:col-span-2 xl:col-span-1"
            />
          </div>

          <ResumeLibrary items={items} />
        </>
      )}
    </div>
  );
}

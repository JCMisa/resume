import Link from "next/link";
import {
  ArrowRight,
  Award,
  FileStack,
  Gauge,
  Lightbulb,
  ListChecks,
  Sparkles,
  Tags,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FREE_LIMITS } from "@/lib/plans";
import type { ResumeLibraryData } from "@/lib/actions/resume-library";
import AnalyzeResumeButton from "./AnalyzeResumeButton";
import { LibraryEmptyActions } from "./ResumeLibrary";

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-3xl border bg-card shadow-sm p-4 flex items-start gap-3 min-w-0">
      <div className="size-10 shrink-0 rounded-2xl border bg-muted/40 flex items-center justify-center text-muted-foreground">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-xl font-black tracking-tight tabular-nums leading-tight mt-0.5",
            tone === "up" && "text-brand-strong dark:text-brand",
            tone === "down" && "text-rose-600 dark:text-rose-400",
          )}
        >
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
      </div>
    </div>
  );
}

export function KpiRow({
  stats,
  usage,
}: {
  stats: ResumeLibraryData["stats"];
  usage: { isPro: boolean; used: number };
}) {
  const delta = stats.scoreDelta;
  const left = Math.max(FREE_LIMITS.analyze - usage.used, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <Kpi
        icon={FileStack}
        label="Resumes"
        value={stats.total}
        hint={`${stats.uploaded} uploaded · ${stats.built} built`}
      />
      <Kpi
        icon={Gauge}
        label="Avg ATS score"
        value={stats.avgScore ?? "—"}
        hint={`${stats.analyzed} analyzed`}
      />
      <Kpi
        icon={Award}
        label="Best score"
        value={stats.bestScore ?? "—"}
        hint="Highest single resume"
      />
      <Kpi
        icon={delta != null && delta < 0 ? TrendingDown : TrendingUp}
        label="Score change"
        value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
        hint={delta == null ? "Needs 2+ analyses" : "First → latest analysis"}
        tone={delta == null || delta === 0 ? undefined : delta > 0 ? "up" : "down"}
      />
      <Kpi
        icon={ListChecks}
        label="Completeness"
        value={`${stats.avgCompleteness}%`}
        hint={stats.notAnalyzed ? `${stats.notAnalyzed} not analyzed yet` : "Avg sections filled"}
      />
      <Kpi
        icon={Sparkles}
        label="Analyses left"
        value={usage.isPro ? "∞" : left}
        hint={usage.isPro ? "Pro: unlimited" : `of ${FREE_LIMITS.analyze} this month`}
      />
    </div>
  );
}

export function NextActionCard({
  action,
  className,
}: {
  action: ResumeLibraryData["nextAction"];
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border bg-card shadow-sm p-5 flex flex-col gap-3 min-w-0", className)}>
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
          <Lightbulb className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight">Next best step</h2>
          <p className="text-[11px] text-muted-foreground">The highest-impact fix right now</p>
        </div>
      </div>

      {!action ? (
        <p className="text-sm text-muted-foreground flex-1">
          Everything looks great: all resumes are analyzed, complete and scoring 80+. Try a mock
          interview next.
        </p>
      ) : action.kind === "start" ? (
        <div className="flex-1 space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload an existing resume for an instant ATS audit, or build one in the editor.
          </p>
          <LibraryEmptyActions />
        </div>
      ) : action.kind === "improve" ? (
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{action.title}</span> scores{" "}
            <span className="font-bold text-foreground tabular-nums">{action.score}</span>. Start
            with this {action.section ? <span className="font-semibold">{action.section}</span> : null}{" "}
            rewrite:
          </p>
          <blockquote className="rounded-xl border-l-4 border-brand bg-muted/40 px-3 py-2 text-xs leading-relaxed line-clamp-4">
            {action.suggested}
          </blockquote>
          {action.reason && (
            <p className="text-[11px] text-muted-foreground line-clamp-2">Why: {action.reason}</p>
          )}
          <Link
            href={`/resumes/${action.id}`}
            className={cn(buttonVariants({ size: "sm" }), "mt-auto self-start rounded-lg font-bold gap-1.5")}
          >
            See all suggestions <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : action.kind === "analyze" ? (
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{action.title}</span> hasn&apos;t been
            analyzed yet. Get its ATS score and rewrite tips.
          </p>
          <div className="mt-auto">
            <AnalyzeResumeButton resumeId={action.id} compact />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{action.title}</span> is missing:{" "}
            {action.missing.join(", ")}. Complete resumes score higher with ATS systems.
          </p>
          <Link
            href={`/resumes/${action.id}`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-auto self-start rounded-lg font-bold gap-1.5")}
          >
            Open resume <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}

// Keyword frequency as simple inline bars (a ranked list reads better than a chart here)
export function TopKeywordsCard({
  keywords,
  analyzed,
  className,
}: {
  keywords: ResumeLibraryData["keywords"];
  analyzed: number;
  className?: string;
}) {
  const max = Math.max(1, ...keywords.map((k) => k.count));
  return (
    <section className={cn("rounded-3xl border bg-card shadow-sm p-5 flex flex-col gap-3 min-w-0", className)}>
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15">
          <Tags className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight">Top keywords</h2>
          <p className="text-[11px] text-muted-foreground">What ATS systems will match you on</p>
        </div>
      </div>
      {keywords.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-xs text-muted-foreground min-h-[160px]">
          Keywords from your analyzed resumes will show up here.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {keywords.map((k) => (
            <li key={k.keyword} className="space-y-1">
              <div className="flex justify-between gap-2 text-xs">
                <span className="font-semibold truncate">{k.keyword}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {k.count}/{analyzed}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(k.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

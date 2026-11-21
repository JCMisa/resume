import React from "react";
import ReadinessMatrix from "./_components/ReadinessMatrix";
import ScoreTimeline from "./_components/ScoreTimeline";
import InterviewRadar from "./_components/InterviewRadar";
import RecentAssetsList from "./_components/RecentAssetsList";
import { FileText, Mic, Sparkles, Award } from "lucide-react";
import Link from "next/link";
import { getDashboardTelemetryAction } from "@/lib/actions/dashboard";

function SummaryStatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 p-5 rounded-3xl shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
      <div className="size-11 rounded-2xl bg-stone-50 dark:bg-stone-800 border flex items-center justify-center text-muted-foreground group-hover:bg-brand/8 group-hover:text-primary transition-colors shrink-0">
        <Icon className="size-5 stroke-[2]" />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-black uppercase tracking-wider text-stone-400 leading-none mb-1.5">
          {title}
        </p>
        <h4 className="text-xl font-black tracking-tight text-foreground leading-none tabular-nums mb-1">
          {value}
        </h4>
        <p className="text-[10px] text-muted-foreground truncate">
          {description}
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const response = await getDashboardTelemetryAction();

  if (!response.success || !response.data) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Failed to initialize dashboard analytics hub layout.
      </div>
    );
  }

  const { metrics, scoreTimeline, radarSkills, recentDocuments } =
    response.data;

  return (
    <div className="min-h-screen bg-transparent w-full p-4 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto no-scrollbar max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* ── Welcome Heading Header Block ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">
            ResuMe Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Monitor your real-time optimization parameters, ATS scores, and
            spoken metrics.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href="/resumes/create"
            className="px-4 py-2 text-xs font-black border bg-white dark:bg-stone-900 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-1.5"
          >
            Create Resume
          </Link>
          <Link
            href="/resumes/analyze"
            className="px-4 py-2 text-xs font-black bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5 fill-current" />
            AI Optimization
          </Link>
        </div>
      </div>

      {/* ── Top Metric Summary Cards Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <SummaryStatCard
          icon={FileText}
          title="Resumes Compiled"
          value={metrics.resumesCount}
          description="Active portfolio items"
        />
        <SummaryStatCard
          icon={Award}
          title="Peak ATS Score"
          value={metrics.topAts ? `${metrics.topAts}` : "0"}
          description="Highest vector match audit"
        />
        <SummaryStatCard
          icon={Mic}
          title="Voice Interviews"
          value={metrics.interviewsCount}
          description="Audio runs completed"
        />
        <SummaryStatCard
          icon={Sparkles}
          title="Avg Interview Score"
          value={metrics.avgInterview ? `${metrics.avgInterview}%` : "0%"}
          description="Spoken technical score"
        />
      </div>

      {/* ── Main Data Visualization Dashboard Grid Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <div className="col-span-1">
          <ReadinessMatrix score={metrics.readinessIndex} />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <ScoreTimeline data={scoreTimeline} />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <RecentAssetsList items={recentDocuments} />
        </div>
        <div className="col-span-1">
          <InterviewRadar data={radarSkills} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { BarChart3, LineChart as LineIcon, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeLibraryData } from "@/lib/actions/resume-library";

// Shared chart chrome: recessive grid/axes, text in ink tokens (never the
// series color), brand for the data. "Built" uses a neutral stone so it reads
// against every accent theme (validated for all six).
const AXIS = {
  tick: { fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" },
  axisLine: false,
  tickLine: false,
} as const;
const BUILT_COLOR = "#78716c"; // stone-500

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  table,
  className,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
  /** Accessible table view of the same data */
  table: React.ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section
      className={cn(
        "rounded-3xl border bg-card shadow-sm p-5 flex flex-col min-w-0",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15 shrink-0">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black tracking-tight truncate">{title}</h2>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Table2 className="size-3" /> {showTable ? "Chart" : "Table"}
        </button>
      </header>
      <div className="flex-1 min-h-[200px]">
        {showTable ? (
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">{table}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-full min-h-[200px] flex items-center justify-center text-center text-xs text-muted-foreground px-6">
      {text}
    </div>
  );
}

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-popover text-popover-foreground px-3 py-2 shadow-xl text-left max-w-[220px]">
      {children}
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-muted-foreground">
          {head.map((h) => (
            <th key={h} className="font-bold py-1.5 pr-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={cn("py-1.5 pr-3", j > 0 && "tabular-nums")}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 1. ATS score trend ──────────────────────────────────────────────────────
export function ScoreTrendChart({
  data,
  className,
}: {
  data: ResumeLibraryData["trend"];
  className?: string;
}) {
  const points = data.map((d) => ({ ...d, label: format(new Date(d.date), "MMM d") }));
  return (
    <ChartCard
      title="ATS score trend"
      subtitle="Each analyzed resume, by analysis date"
      icon={LineIcon}
      className={className}
      table={
        <SimpleTable
          head={["Resume", "Analyzed", "Score"]}
          rows={points.map((p) => [p.title, p.label, p.score])}
        />
      }
    >
      {points.length === 0 ? (
        <Empty text="Analyze a resume to start tracking your ATS score." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...AXIS} minTickGap={16} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} {...AXIS} />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                const p = active && payload?.[0]?.payload;
                if (!p) return null;
                return (
                  <TooltipBox>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {p.label}
                    </p>
                    <p className="text-xs font-bold truncate">{p.title}</p>
                    <p className="text-lg font-black tabular-nums">
                      {p.score}
                      <span className="text-xs font-normal text-muted-foreground">/100</span>
                    </p>
                  </TooltipBox>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--brand)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--brand)", stroke: "var(--card)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--brand)", stroke: "var(--card)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 2. Score distribution ───────────────────────────────────────────────────
export function ScoreDistributionChart({
  data,
  className,
}: {
  data: ResumeLibraryData["distribution"];
  className?: string;
}) {
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <ChartCard
      title="Score distribution"
      subtitle="How your analyzed resumes score"
      icon={BarChart3}
      className={className}
      table={
        <SimpleTable head={["Score range", "Resumes"]} rows={data.map((d) => [d.bucket, d.count])} />
      }
    >
      {total === 0 ? (
        <Empty text="No analyzed resumes yet." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="bucket" {...AXIS} />
            <YAxis allowDecimals={false} {...AXIS} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                const p = active && payload?.[0]?.payload;
                if (!p) return null;
                return (
                  <TooltipBox>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Score {p.bucket}
                    </p>
                    <p className="text-sm font-black tabular-nums">
                      {p.count} resume{p.count === 1 ? "" : "s"}
                    </p>
                  </TooltipBox>
                );
              }}
            />
            <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

// ── 3. Monthly activity (stacked) ───────────────────────────────────────────
export function ActivityChart({
  data,
  className,
}: {
  data: ResumeLibraryData["activity"];
  className?: string;
}) {
  const total = data.reduce((a, b) => a + b.analyses + b.built, 0);
  return (
    <ChartCard
      title="Monthly activity"
      subtitle="AI analyses and resumes built, last 6 months"
      icon={BarChart3}
      className={className}
      table={
        <SimpleTable
          head={["Month", "AI analyses", "Built"]}
          rows={data.map((d) => [d.month, d.analyses, d.built])}
        />
      }
    >
      {total === 0 ? (
        <Empty text="Your monthly activity will show up here." />
      ) : (
        <div className="flex flex-col h-full">
          {/* Legend (2 series): identity is never color-alone */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground mb-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand" /> AI analyses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: BUILT_COLOR }} /> Built
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 6, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload;
                  if (!p) return null;
                  return (
                    <TooltipBox>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {p.month}
                      </p>
                      <p className="text-xs tabular-nums">
                        <span className="font-black">{p.analyses}</span> AI analyses
                      </p>
                      <p className="text-xs tabular-nums">
                        <span className="font-black">{p.built}</span> built
                      </p>
                    </TooltipBox>
                  );
                }}
              />
              {/* 2px surface stroke = gap between stacked segments */}
              <Bar dataKey="analyses" stackId="a" fill="var(--brand)" stroke="var(--card)" strokeWidth={2} maxBarSize={36} />
              <Bar dataKey="built" stackId="a" fill={BUILT_COLOR} stroke="var(--card)" strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

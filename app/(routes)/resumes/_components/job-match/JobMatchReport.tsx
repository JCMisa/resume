"use client";

import {
  CheckCircle2,
  CircleDashed,
  KeyRound,
  ListOrdered,
  Scale,
  Sparkles,
  Target,
  Wand2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MATCH_WEIGHTS,
  type JobMatchData,
  type JobRequirement,
  type RequirementStatus,
} from "@/lib/job-match";
import { Card, CopyButton, ProTeaser, ScoreRing, scoreTone } from "../report/ReportParts";

const STATUS: Record<
  RequirementStatus,
  { label: string; hint: string; Icon: React.ElementType; cls: string }
> = {
  missing: {
    label: "Missing",
    hint: "Not shown on your resume",
    Icon: XCircle,
    cls: "text-rose-600 dark:text-rose-400",
  },
  implied: {
    label: "Implied, add the exact term",
    hint: "You show it in other words; ATS systems often match the exact keyword",
    Icon: CircleDashed,
    cls: "text-amber-600 dark:text-amber-400",
  },
  found: {
    label: "Found",
    hint: "The exact term is on your resume",
    Icon: CheckCircle2,
    cls: "text-brand-strong dark:text-brand",
  },
};

const BREAKDOWN: { key: keyof JobMatchData["breakdown"]; label: string; hint: string }[] = [
  { key: "requirements", label: "Requirements covered", hint: "Required count double; implied counts half" },
  { key: "experience", label: "Experience", hint: "Your years vs. the posting's minimum" },
  { key: "titleFit", label: "Title & level fit", hint: "How closely your recent roles fit this one" },
];

function RequirementGroup({ status, items }: { status: RequirementStatus; items: JobRequirement[] }) {
  if (!items.length) return null;
  const { label, hint, Icon, cls } = STATUS[status];
  // Required before preferred
  const sorted = [...items].sort((a, b) =>
    a.importance === b.importance ? 0 : a.importance === "required" ? -1 : 1,
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", cls)} />
        <p className="text-sm font-bold">
          {label} <span className="text-muted-foreground font-semibold tabular-nums">({items.length})</span>
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">{hint}</p>
      <ul className="divide-y rounded-2xl border">
        {sorted.map((r) => (
          <li key={r.term} className="px-3 py-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{r.term}</p>
              {r.evidence && status !== "missing" && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{r.evidence}</p>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                r.importance === "required" ? "bg-foreground/10" : "border text-muted-foreground",
              )}
            >
              {r.importance}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function JobMatchReport({ data }: { data: JobMatchData }) {
  const by = (s: RequirementStatus) => data.requirements.filter((r) => r.status === s);
  const found = by("found").length;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <section className="rounded-3xl border bg-card shadow-sm p-5 flex flex-col @lg:flex-row gap-5 @lg:items-center">
        <ScoreRing score={data.matchScore} />
        <div className="min-w-0 space-y-2 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Job match{data.seniority ? ` · ${data.seniority} role` : ""}
          </p>
          <p className="text-lg font-black leading-tight">
            {data.jobTitle || "This role"}
            {data.company && <span className="text-muted-foreground font-bold"> at {data.company}</span>}
          </p>
          {data.verdict && <p className="text-sm text-muted-foreground leading-relaxed">{data.verdict}</p>}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
              {found} of {data.requirements.length} requirements found
            </span>
            {data.requiredYears != null && (
              <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {data.candidateYears ?? "?"} of {data.requiredYears}+ years
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 @3xl:grid-cols-2 items-start">
        <Card title="Score breakdown" icon={Scale}>
          <ul className="space-y-3.5">
            {BREAKDOWN.map(({ key, label, hint }) => {
              const v = data.breakdown[key];
              const tone = scoreTone(v);
              return (
                <li key={key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-bold">
                      {label}{" "}
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        · {Math.round(MATCH_WEIGHTS[key] * 100)}% of score
                      </span>
                    </p>
                    <span className="text-sm font-black tabular-nums">{v}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden" role="meter" aria-label={label} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={cn(
                        "h-full rounded-full",
                        tone === "good" ? "bg-brand" : tone === "fair" ? "bg-amber-500" : "bg-rose-500",
                      )}
                      style={{ width: `${v}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{hint}</p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card
          title="Keywords to add"
          subtitle="Only add what you genuinely have"
          icon={KeyRound}
          action={data.missingKeywords.length > 0 ? <CopyButton text={data.missingKeywords.join(", ")} label="Copy all" /> : undefined}
        >
          {data.missingKeywords.length ? (
            <div className="flex flex-wrap gap-1.5">
              {data.missingKeywords.map((k) => (
                <span key={k} className="rounded-md border border-dashed border-brand/50 px-2 py-0.5 text-[11px] font-semibold text-brand-strong dark:text-brand">
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-brand-strong dark:text-brand" /> Every skill and tool
              keyword in the posting is on your resume.
            </p>
          )}
        </Card>
      </div>

      <Card title="Requirements" subtitle="From the job description, checked against your resume" icon={Target}>
        <div className="grid gap-5 @3xl:grid-cols-2">
          <div className="space-y-5">
            <RequirementGroup status="missing" items={by("missing")} />
            <RequirementGroup status="implied" items={by("implied")} />
          </div>
          <RequirementGroup status="found" items={by("found")} />
        </div>
      </Card>

      {data.topActions.length > 0 && (
        <Card title="What to do next" icon={ListOrdered}>
          <ol className="space-y-2">
            {data.topActions.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="size-6 shrink-0 rounded-full bg-brand/15 text-brand-strong dark:text-brand flex items-center justify-center text-xs font-black">
                  {i + 1}
                </span>
                <span className="pt-0.5">{a}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {data.locked?.tailoredSummary && (
        <Card title="Tailored summary" subtitle="A professional summary aimed at this job" icon={Sparkles}>
          <ProTeaser
            title="Your tailored summary is ready"
            detail="Pro writes a summary for this exact job using the posting's key terms."
          />
        </Card>
      )}

      {data.tailoredSummary && (
        <Card
          title="Tailored summary"
          subtitle="A professional summary aimed at this job"
          icon={Sparkles}
          action={<CopyButton text={data.tailoredSummary} />}
        >
          <p className="text-sm leading-relaxed">{data.tailoredSummary}</p>
        </Card>
      )}

      {(data.tailoredBullets.length > 0 || (data.locked?.tailoredBullets ?? 0) > 0) && (
        <Card title="Tailored bullets" subtitle="Your bullets, aimed at this job" icon={Wand2}>
          {(data.locked?.tailoredBullets ?? 0) > 0 && (
            <ProTeaser
              compact
              title={`${data.locked!.tailoredBullets} more tailored bullet${data.locked!.tailoredBullets === 1 ? "" : "s"} with Pro`}
            />
          )}
          <ul className="space-y-3">
            {data.tailoredBullets.map((b, i) => (
              <li key={i} className="rounded-2xl border p-4 space-y-2">
                {b.original && <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">{b.original}</p>}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{b.rewrite}</p>
                  <CopyButton text={b.rewrite} />
                </div>
                {b.reason && <p className="text-[11px] text-muted-foreground">Targets: {b.reason}</p>}
              </li>
            ))}
          </ul>
          {data.tailoredBullets.some((b) => /\[[^\]]+\]/.test(b.rewrite)) && (
            <p className="text-[11px] text-muted-foreground">
              Replace placeholders like <span className="font-mono">[X%]</span> with your real numbers.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

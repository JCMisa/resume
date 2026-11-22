"use client";

import {
  Briefcase,
  CalendarClock,
  Eye,
  Gauge,
  ListChecks,
  MessageSquareWarning,
  Sparkles,
  Tags,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  SUBSCORE_WEIGHTS,
  type ResumeAnalysisData,
} from "@/lib/analysis-types";
import AnalyzeResumeButton from "../AnalyzeResumeButton";
import {
  BulletAudit,
  Card,
  CheckCounts,
  CheckList,
  Chips,
  RedFlags,
  ScoreRing,
  SubScoreBars,
} from "./ReportParts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
/** "2020-02" -> "Feb 2020", "present" -> "Present", "" -> "?" */
function formatYm(ym: string) {
  if (ym === "present") return "Present";
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "?";
}
const SENIORITY_LABEL: Record<string, string> = {
  entry: "Entry level",
  junior: "Junior",
  mid: "Mid level",
  senior: "Senior",
  lead: "Lead",
  executive: "Executive",
};

function List({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  if (!items.length)
    return <p className="text-xs text-muted-foreground">None noted.</p>;
  return (
    <ul className="space-y-2">
      {items.map((s, i) => (
        <li
          key={i}
          className={cn(
            "text-sm pl-3 border-l-2",
            tone === "good" ? "border-brand/60" : "border-rose-500/50",
          )}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

function Rewrites({ items }: { items: ResumeAnalysisData["improvements"] }) {
  if (!items.length)
    return (
      <p className="text-xs text-muted-foreground">No rewrites suggested.</p>
    );
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="rounded-2xl border p-4 space-y-2">
          {it.section && (
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-strong dark:text-brand">
              {it.section}
            </span>
          )}
          {it.current && (
            <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">
              {it.current}
            </p>
          )}
          <p className="text-sm font-medium">{it.suggested}</p>
          {it.reason && (
            <p className="text-[11px] text-muted-foreground">
              Why: {it.reason}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Score hero: ring + first impression + profile chips. */
function Hero({ a }: { a: ResumeAnalysisData }) {
  const profile = a.careerProfile;
  return (
    <section className="rounded-3xl border bg-card shadow-sm p-5 @lg:p-6 flex flex-col @lg:flex-row gap-5 @lg:items-center">
      <div className="flex items-center gap-4">
        <ScoreRing score={a.overallScore} />
        <div className="@lg:hidden">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            ATS score
          </p>
          <p className="text-sm font-bold">{a.readability} readability</p>
        </div>
      </div>
      <div className="min-w-0 space-y-3 flex-1">
        <div className="hidden @lg:block">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            ATS score · {a.readability} readability
          </p>
        </div>
        {a.firstImpression ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <Eye className="size-3.5" /> Recruiter&apos;s 6-second take
            </p>
            <p className="text-base font-semibold leading-snug">
              &ldquo;{a.firstImpression}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {a.summary}
          </p>
        )}
        {profile && (
          <div className="flex flex-wrap gap-1.5">
            {profile.targetRole && (
              <span className="rounded-full bg-brand/10 border border-brand/20 px-2.5 py-0.5 text-[11px] font-bold text-brand-strong dark:text-brand">
                {profile.targetRole}
              </span>
            )}
            <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
              {SENIORITY_LABEL[profile.seniority] ?? profile.seniority}
            </span>
            {profile.yearsExperience != null && (
              <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {profile.yearsExperience} yrs experience
              </span>
            )}
            {a.metrics && (
              <span className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {a.metrics.quantifiedRate}% bullets quantified
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCards({ a }: { a: ResumeAnalysisData }) {
  return (
    <>
      {a.firstImpression && a.summary && (
        <Card title="Summary" icon={Sparkles}>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {a.summary}
          </p>
        </Card>
      )}
      <div className="grid gap-4 @2xl:grid-cols-2">
        <Card title="Strengths" icon={ThumbsUp}>
          <List items={a.strengths} tone="good" />
        </Card>
        <Card title="Weaknesses" icon={ThumbsDown}>
          <List items={a.weaknesses} tone="bad" />
        </Card>
      </div>
    </>
  );
}

/** Older analyses (before v2): what they have, plus a prompt to re-analyze. */
function LegacyReport({
  a,
  resumeId,
}: {
  a: ResumeAnalysisData;
  resumeId?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 flex flex-col @lg:flex-row @lg:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            A more detailed report is available
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Re-analyze to get sub-scores, an ATS checklist, a bullet-by-bullet
            audit, red flags and your career timeline.
          </p>
        </div>
        {resumeId && (
          <div className="shrink-0">
            <AnalyzeResumeButton resumeId={resumeId} compact />
          </div>
        )}
      </div>
      <Hero a={a} />
      <SummaryCards a={a} />
      <Card title="Suggested rewrites" icon={Wand2}>
        <Rewrites items={a.improvements} />
      </Card>
      <div className="grid gap-4 @2xl:grid-cols-2">
        <Card title="Keywords found" icon={Tags}>
          <Chips items={a.keyKeywords} />
        </Card>
        {a.gapsDetected.length > 0 && (
          <Card title="Gaps" icon={MessageSquareWarning}>
            <List items={a.gapsDetected} tone="bad" />
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AnalysisReport({
  analysis: a,
  resumeId,
}: {
  analysis: ResumeAnalysisData;
  /** Enables the re-analyze prompt on older reports */
  resumeId?: string;
}) {
  const isV2 = Boolean(
    a.analysisVersion && a.analysisVersion >= 2 && a.subScores,
  );

  return (
    <div className="@container w-full">
      {!isV2 ? <LegacyReport a={a} resumeId={resumeId} /> : <ReportV2 a={a} />}
    </div>
  );
}

function ReportV2({ a }: { a: ResumeAnalysisData }) {
  const checks = a.checks ?? [];
  const problems = checks.filter((c) => c.status !== "pass").length;
  const weakBullets = (a.bulletAudit ?? []).filter(
    (b) => b.rating !== "strong",
  ).length;
  const profile = a.careerProfile;
  const skills = a.skills;

  return (
    <Tabs defaultValue="overview" className="w-full space-y-4">
      {/* 2x2 grid in narrow containers, one row when there is room: never cut off */}
      <TabsList className="!grid grid-cols-2 @xl:grid-cols-4 !w-full !h-auto !p-1 gap-1 !rounded-2xl bg-muted">
        <TabsTrigger
          value="overview"
          className="!h-9 !rounded-xl !font-bold !text-xs !gap-1.5 !px-3 min-w-0"
        >
          <Gauge className="size-3.5" /> Overview
        </TabsTrigger>
        <TabsTrigger
          value="checks"
          className="!h-9 !rounded-xl !font-bold !text-xs !gap-1.5 !px-3 min-w-0"
        >
          <ListChecks className="size-3.5" /> ATS checks
          {problems > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] tabular-nums text-amber-700 dark:text-amber-300">
              {problems}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="bullets"
          className="!h-9 !rounded-xl !font-bold !text-xs !gap-1.5 !px-3 min-w-0"
        >
          <Wand2 className="size-3.5" /> Bullet audit
          {weakBullets > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 text-[10px] tabular-nums text-amber-700 dark:text-amber-300">
              {weakBullets}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="career"
          className="!h-9 !rounded-xl !font-bold !text-xs !gap-1.5 !px-3 min-w-0"
        >
          <Briefcase className="size-3.5" /> Career &amp; skills
        </TabsTrigger>
      </TabsList>

      {/* ── Overview ── */}
      <TabsContent
        value="overview"
        className="space-y-4 focus-visible:outline-none"
      >
        <Hero a={a} />
        <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card
            title="Score breakdown"
            subtitle="How the overall score is built"
            icon={Gauge}
          >
            <SubScoreBars scores={a.subScores!} weights={SUBSCORE_WEIGHTS} />
          </Card>
          <Card
            title="Top rewrites"
            subtitle="Highest-value changes first"
            icon={Wand2}
          >
            <Rewrites items={a.improvements.slice(0, 4)} />
          </Card>
        </div>
        <SummaryCards a={a} />
      </TabsContent>

      {/* ── ATS checks ── */}
      <TabsContent
        value="checks"
        className="space-y-4 focus-visible:outline-none"
      >
        <div className="grid gap-4 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <Card
            title="ATS & content checklist"
            subtitle="Checked automatically, the same way every time"
            icon={ListChecks}
          >
            <CheckCounts checks={checks} />
            <CheckList checks={checks} />
          </Card>
          <div className="space-y-4">
            {a.metrics && (
              <Card title="By the numbers" icon={Gauge}>
                <dl className="grid grid-cols-2 gap-2">
                  {[
                    ["Words", a.metrics.wordCount],
                    ["Bullets", a.metrics.bulletCount],
                    ["Quantified", `${a.metrics.quantifiedRate}%`],
                    ["Avg bullet", `${a.metrics.avgBulletWords} words`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border bg-muted/20 px-3 py-2"
                    >
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="text-lg font-black tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
            <Card
              title="Red flags"
              subtitle="Spelling, grammar and tone"
              icon={MessageSquareWarning}
            >
              <RedFlags flags={a.redFlags ?? []} />
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* ── Bullet audit ── */}
      <TabsContent
        value="bullets"
        className="space-y-4 focus-visible:outline-none"
      >
        <Card
          title="Bullet-by-bullet audit"
          subtitle="Weakest first, with ready-to-paste rewrites"
          icon={Wand2}
        >
          <BulletAudit items={a.bulletAudit ?? []} />
        </Card>
        {a.improvements.length > 4 && (
          <Card title="More rewrites" icon={Sparkles}>
            <Rewrites items={a.improvements.slice(4)} />
          </Card>
        )}
      </TabsContent>

      {/* ── Career & skills ── */}
      <TabsContent
        value="career"
        className="space-y-4 focus-visible:outline-none"
      >
        <div className="grid gap-4 @3xl:grid-cols-2 items-start">
          {profile && (
            <Card
              title="Career timeline"
              subtitle={
                profile.yearsExperience != null
                  ? `${profile.yearsExperience} years of experience (overlaps counted once)`
                  : "Dates couldn't be read for every role"
              }
              icon={CalendarClock}
            >
              {profile.employmentGaps.length > 0 && (
                <ul className="space-y-2">
                  {profile.employmentGaps.map((g, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs"
                    >
                      <span className="font-bold">
                        {g.months}-month{" "}
                        {g.to === "present" ? "current gap" : "gap"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        · {formatYm(g.from)} – {formatYm(g.to)}. Be ready to
                        explain it, or add freelance, study or volunteer work
                        from that time.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {profile.positions.length ? (
                <ol className="relative border-l pl-4 space-y-3 ml-1">
                  {profile.positions.map((p, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brand ring-4 ring-card" />
                      <p className="text-sm font-bold leading-tight">
                        {p.title || "Role"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.company} · {formatYm(p.start)} – {formatYm(p.end)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted-foreground">No roles found.</p>
              )}
            </Card>
          )}

          {skills && (
            <Card
              title="Skills"
              subtitle="What the resume shows, and what's missing"
              icon={Tags}
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Hard skills
                  </p>
                  <Chips items={skills.hard} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Tools &amp; technologies
                  </p>
                  <Chips items={skills.tools} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Soft skills
                  </p>
                  <Chips
                    items={skills.soft}
                    empty="None shown. Weave teamwork or leadership into your bullets."
                  />
                </div>
                {skills.suggested.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t">
                    <p className="text-[11px] font-bold text-muted-foreground">
                      In demand for {profile?.targetRole || "your target role"},
                      not on your resume
                    </p>
                    <Chips items={skills.suggested} dashed />
                    <p className="text-[10px] text-muted-foreground">
                      Only add skills you actually have.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="grid gap-4 @2xl:grid-cols-2">
          <Card title="Keywords found" icon={Tags}>
            <Chips items={a.keyKeywords} />
          </Card>
          {a.gapsDetected.length > 0 && (
            <Card title="Content gaps" icon={MessageSquareWarning}>
              <List items={a.gapsDetected} tone="bad" />
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

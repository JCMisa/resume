// Live ATS check for the editor (pure, unit-tested, runs in the browser on
// every change). Reuses the same deterministic checks as the full AI report
// (lib/resume-checks.ts); only the AI judgments (impact, keywords, clarity)
// are missing, so this is a "readiness" score, not the report's score.
import type { AtsCheck, Position } from "@/lib/analysis-types";
import { computeChecks, computeMetrics, parseabilityScore } from "@/lib/resume-checks";
import { sectionCompleteness } from "@/lib/resume-stats";
import { toPlainContent } from "@/lib/rich-text";
import type { ResumeContent } from "@/lib/resume-sanitize";

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const ym = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

/**
 * One side of a date range -> "YYYY-MM", "present", or "" (unknown).
 * A bare year is read as January for a start and December for an end.
 */
export function parseMonth(text: string, side: "start" | "end" = "start"): string {
  const s = text.trim().toLowerCase();
  if (!s) return "";
  if (/\b(present|current|now|today|ongoing)\b/.test(s)) return "present";
  let m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?,?\s+(\d{4})\b/.exec(s);
  if (m) return ym(Number(m[2]), MONTHS[m[1]]);
  m = /\b(\d{4})\s*[-/.]\s*(\d{1,2})\b/.exec(s); // 2022-03
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return ym(Number(m[1]), Number(m[2]));
  m = /\b(\d{1,2})\s*[-/.]\s*(\d{4})\b/.exec(s); // 03/2022
  if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12) return ym(Number(m[2]), Number(m[1]));
  m = /\b(19\d{2}|20\d{2})\b/.exec(s);
  if (m) return ym(Number(m[1]), side === "start" ? 1 : 12);
  return "";
}

/** "Jan 2022 – Present", "2019 - 2021", "03/2020 to 05/2022" -> start/end. */
export function parseDuration(duration: string | undefined): { start: string; end: string } {
  const d = (duration ?? "").trim();
  if (!d) return { start: "", end: "" };
  // Dashes with spaces, en/em dashes, "to"; or a bare "2019-2021"
  const parts = d.split(/\s+(?:-|–|—|to|until)\s+|\s*[–—]\s*/i);
  const yearsOnly = /^(\d{4})\s*-\s*(\d{4})$/.exec(d);
  if (yearsOnly) return { start: ym(Number(yearsOnly[1]), 1), end: ym(Number(yearsOnly[2]), 12) };
  if (parts.length >= 2) return { start: parseMonth(parts[0], "start"), end: parseMonth(parts[parts.length - 1], "end") };
  return { start: parseMonth(d, "start"), end: "" };
}

/** Roles with parsed dates, for the date checks (the full report gets these from the AI). */
export function positionsFromContent(content: ResumeContent): Position[] {
  return (content.experiences ?? [])
    .filter((e) => e.role?.trim() || e.company?.trim() || e.bullets?.some((b) => b.trim()))
    .map((e) => ({ company: e.company ?? "", title: e.role ?? "", ...parseDuration(e.duration) }));
}

/** Where in the editor each check is fixed (an Assist-mode step). */
export const CHECK_STEP: Record<string, "personal" | "summary" | "skills" | "experience" | "education"> = {
  email: "personal",
  phone: "personal",
  linkedin: "personal",
  sections: "experience",
  dates: "experience",
  date_format: "experience",
  length: "experience",
  quantified: "experience",
  action_verbs: "experience",
  pronouns: "experience",
  bullet_length: "experience",
  role_detail: "experience",
  summary: "summary",
};

const STATUS_ORDER = { fail: 0, warn: 1, pass: 2 } as const;
const STATUS_POINTS = { pass: 1, warn: 0.5, fail: 0 } as const;

export const LIVE_ATS_WEIGHTS = { parseability: 0.45, content: 0.35, completeness: 0.2 } as const;

export type LiveAtsReport = {
  /** 0-100 readiness: parse checks, content checks and section completeness */
  score: number;
  parts: { parseability: number; content: number; completeness: number };
  /** Problems first (fail, warn), then passes */
  checks: AtsCheck[];
  counts: { pass: number; warn: number; fail: number };
  wordCount: number;
};

export function liveAtsReport(content: ResumeContent): LiveAtsReport {
  const plain = toPlainContent(content);
  const metrics = computeMetrics(plain);
  const checks = computeChecks(plain, metrics, positionsFromContent(plain));

  // An empty "sections" check fires for a blank page; fine, the score is low anyway
  const contentChecks = checks.filter((c) => c.category === "content");
  const parts = {
    parseability: parseabilityScore(checks),
    content: contentChecks.length
      ? clamp((100 * contentChecks.reduce((a, c) => a + STATUS_POINTS[c.status], 0)) / contentChecks.length)
      : 0,
    completeness: sectionCompleteness(plain).completeness,
  };
  // No real content yet: don't show a misleading "parse" score for a blank page
  const empty = metrics.wordCount < 5;
  const score = empty
    ? 0
    : clamp(
        parts.parseability * LIVE_ATS_WEIGHTS.parseability +
          parts.content * LIVE_ATS_WEIGHTS.content +
          parts.completeness * LIVE_ATS_WEIGHTS.completeness,
      );

  const counts = { pass: 0, warn: 0, fail: 0 };
  for (const c of checks) counts[c.status]++;

  return {
    score,
    parts,
    checks: [...checks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    counts,
    wordCount: metrics.wordCount,
  };
}

/** Score band for the badge colour/label. */
export function scoreBand(score: number): { label: string; tone: "good" | "ok" | "low" } {
  if (score >= 80) return { label: "Strong", tone: "good" };
  if (score >= 60) return { label: "Getting there", tone: "ok" };
  return { label: "Needs work", tone: "low" };
}

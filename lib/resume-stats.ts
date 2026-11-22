// Pure aggregation for the Resumes dashboard (no server deps, unit-tested).
import type { Resume } from "@/config/schema";

export type ResumeLibraryItem = {
  id: string;
  title: string;
  category: string;
  /** "parsed" = uploaded + AI-parsed, "created" = built in the editor */
  status: "parsed" | "created";
  hasFile: boolean;
  fileUrl: string | null;
  score: number | null;
  readability: string | null;
  improvementsCount: number;
  keywords: string[];
  /** Share of the 6 core sections that have content (0-100) */
  completeness: number;
  missingSections: string[];
  /** When the current analysis was produced (from the usage log; falls back to updatedAt) */
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ResumeStats = {
  total: number;
  analyzed: number;
  uploaded: number;
  built: number;
  notAnalyzed: number;
  avgScore: number | null;
  bestScore: number | null;
  /** Latest analyzed score minus the first one (null with < 2 analyses) */
  scoreDelta: number | null;
  avgCompleteness: number;
};

export type ScoreBucket = { bucket: string; min: number; count: number };
export type MonthActivity = { month: string; key: string; analyses: number; built: number };

type ResumeRow = Pick<
  Resume,
  "id" | "title" | "category" | "status" | "fileUrl" | "content" | "analysis" | "createdAt" | "updatedAt"
>;

const SECTIONS: { key: string; label: string; filled: (c: Resume["content"]) => boolean }[] = [
  { key: "personal", label: "Contact details", filled: (c) => Boolean(c.personalDetails?.name && (c.personalDetails?.email || c.personalDetails?.phone)) },
  { key: "summary", label: "Summary", filled: (c) => Boolean(c.professionalSummary?.trim()) },
  { key: "skills", label: "Skills", filled: (c) => (c.skills?.length ?? 0) > 0 },
  { key: "experience", label: "Experience", filled: (c) => (c.experiences?.length ?? 0) > 0 },
  { key: "projects", label: "Projects", filled: (c) => (c.projects?.length ?? 0) > 0 },
  { key: "education", label: "Education", filled: (c) => (c.educations?.length ?? 0) > 0 },
];

export function sectionCompleteness(content: Resume["content"] | null | undefined) {
  const c = content ?? ({} as Resume["content"]);
  const missing = SECTIONS.filter((s) => !s.filled(c)).map((s) => s.label);
  return {
    completeness: Math.round(((SECTIONS.length - missing.length) / SECTIONS.length) * 100),
    missingSections: missing,
  };
}

const validScore = (n: unknown): number | null =>
  typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;

export function toLibraryItem(r: ResumeRow, analyzedAt?: Date | null): ResumeLibraryItem {
  const { completeness, missingSections } = sectionCompleteness(r.content);
  const score = validScore(r.analysis?.overallScore);
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    status: r.status,
    hasFile: Boolean(r.fileUrl),
    fileUrl: r.fileUrl,
    score,
    readability: r.analysis?.readability ?? null,
    improvementsCount: r.analysis?.improvements?.length ?? 0,
    keywords: (r.analysis?.keyKeywords ?? []).slice(0, 6),
    completeness,
    missingSections,
    analyzedAt:
      score == null ? null : new Date(analyzedAt ?? r.updatedAt).toISOString(),
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  };
}

export function computeStats(items: ResumeLibraryItem[]): ResumeStats {
  const scored = items.filter((i) => i.score != null);
  const chrono = byAnalyzedAt(scored);
  const scores = scored.map((i) => i.score as number);
  return {
    total: items.length,
    analyzed: scored.length,
    uploaded: items.filter((i) => i.status === "parsed").length,
    built: items.filter((i) => i.status === "created").length,
    notAnalyzed: items.length - scored.length,
    avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    scoreDelta:
      chrono.length >= 2
        ? (chrono[chrono.length - 1].score as number) - (chrono[0].score as number)
        : null,
    avgCompleteness: items.length
      ? Math.round(items.reduce((a, i) => a + i.completeness, 0) / items.length)
      : 0,
  };
}

const analyzedKey = (i: ResumeLibraryItem) => i.analyzedAt ?? i.updatedAt;
/** Oldest -> newest by when each analysis was produced. */
const byAnalyzedAt = (items: ResumeLibraryItem[]) =>
  [...items].sort((a, b) => analyzedKey(a).localeCompare(analyzedKey(b)));

/** ATS score histogram in fixed buckets (always all buckets, so the axis is stable). */
export function scoreDistribution(items: ResumeLibraryItem[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { bucket: "<50", min: 0, count: 0 },
    { bucket: "50s", min: 50, count: 0 },
    { bucket: "60s", min: 60, count: 0 },
    { bucket: "70s", min: 70, count: 0 },
    { bucket: "80s", min: 80, count: 0 },
    { bucket: "90+", min: 90, count: 0 },
  ];
  for (const i of items) {
    if (i.score == null) continue;
    const b = [...buckets].reverse().find((x) => (i.score as number) >= x.min);
    if (b) b.count += 1;
  }
  return buckets;
}

/** Score per analyzed resume, oldest first (for the trend line). */
export function scoreTrend(items: ResumeLibraryItem[]) {
  return byAnalyzedAt(items.filter((i) => i.score != null)).map((i) => ({
    id: i.id,
    title: i.title,
    date: analyzedKey(i),
    score: i.score as number,
  }));
}

/**
 * Activity for the last `months` calendar months (UTC), oldest first.
 * `analysisDates` = every metered analysis (incl. re-analyses), `builtDates` =
 * resumes created in the editor.
 */
export function monthlyActivity(
  analysisDates: Date[],
  builtDates: Date[],
  months = 6,
  now = new Date(),
): MonthActivity[] {
  const out: MonthActivity[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      analyses: 0,
      built: 0,
    });
  }
  const keyOf = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const index = new Map(out.map((m, i) => [m.key, i]));
  for (const d of analysisDates) {
    const i = index.get(keyOf(d));
    if (i !== undefined) out[i].analyses += 1;
  }
  for (const d of builtDates) {
    const i = index.get(keyOf(d));
    if (i !== undefined) out[i].built += 1;
  }
  return out;
}

/** Most frequent ATS keywords across all analyzed resumes (case-insensitive). */
export function topKeywords(rows: { analysis: Resume["analysis"] }[], limit = 8) {
  const counts = new Map<string, { keyword: string; count: number }>();
  for (const r of rows) {
    const seen = new Set<string>();
    for (const raw of r.analysis?.keyKeywords ?? []) {
      const k = raw.trim();
      const key = k.toLowerCase();
      if (!k || seen.has(key)) continue; // count once per resume
      seen.add(key);
      const entry = counts.get(key) ?? { keyword: k, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.keyword.localeCompare(b.keyword))
    .slice(0, limit);
}

/** The single most useful next step for the user's resume library. */
export function nextBestAction(
  items: ResumeLibraryItem[],
  rows: Map<string, Resume["analysis"]>,
):
  | { kind: "start" }
  | { kind: "analyze"; id: string; title: string }
  | { kind: "improve"; id: string; title: string; score: number; section: string; suggested: string; reason: string }
  | { kind: "complete"; id: string; title: string; missing: string[] }
  | null {
  if (items.length === 0) return { kind: "start" };

  // Lowest-scoring analyzed resume with a concrete rewrite suggestion
  const weakest = items
    .filter((i) => i.score != null && i.score < 80)
    .sort((a, b) => (a.score as number) - (b.score as number))[0];
  const tip = weakest ? rows.get(weakest.id)?.improvements?.[0] : undefined;
  if (weakest && tip) {
    return {
      kind: "improve",
      id: weakest.id,
      title: weakest.title,
      score: weakest.score as number,
      section: tip.section,
      suggested: tip.suggested,
      reason: tip.reason,
    };
  }

  const unanalyzed = items.find((i) => i.score == null);
  if (unanalyzed) return { kind: "analyze", id: unanalyzed.id, title: unanalyzed.title };

  const incomplete = [...items].sort((a, b) => a.completeness - b.completeness)[0];
  if (incomplete && incomplete.completeness < 100) {
    return { kind: "complete", id: incomplete.id, title: incomplete.title, missing: incomplete.missingSections };
  }
  return null;
}

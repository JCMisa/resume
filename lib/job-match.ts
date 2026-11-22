// Resume vs job description matching (pure, unit-tested).
//
// Split of work:
//  - Gemini reads the job description and lists its requirements, judges
//    whether the resume shows each one (even with different wording), and
//    writes the tailored summary/bullets.
//  - This module checks whether each requirement's exact term appears in the
//    resume (many ATS systems match keywords literally), and computes the
//    match score, so the score is explainable and stable.

export type RequirementImportance = "required" | "preferred";
export type RequirementCategory = "hard" | "tool" | "soft" | "certification" | "education" | "experience";
/** found = exact term in the resume; implied = shown with different wording; missing = not shown */
export type RequirementStatus = "found" | "implied" | "missing";

export type JobRequirement = {
  /** The term as written in the job description, e.g. "PostgreSQL" */
  term: string;
  category: RequirementCategory;
  importance: RequirementImportance;
  status: RequirementStatus;
  /** Where the resume shows it (AI), for found/implied */
  evidence: string;
};

export type TailoredBullet = { original: string; rewrite: string; reason: string };

export type JobMatchData = {
  version: 1;
  matchScore: number;
  breakdown: {
    /** Weighted requirement coverage (required x2, preferred x1; implied counts half) */
    requirements: number;
    /** Candidate's years vs the posting's minimum */
    experience: number;
    /** AI: how closely the candidate's titles/level fit the role */
    titleFit: number;
  };
  jobTitle: string;
  company: string;
  seniority: string;
  requiredYears: number | null;
  candidateYears: number | null;
  requirements: JobRequirement[];
  /** Terms to add verbatim (implied or missing hard skills/tools the candidate may have) */
  missingKeywords: string[];
  tailoredSummary: string;
  tailoredBullets: TailoredBullet[];
  topActions: string[];
  verdict: string;
};

export const MATCH_WEIGHTS = { requirements: 0.6, experience: 0.2, titleFit: 0.2 } as const;
export const MAX_JOB_DESCRIPTION_CHARS = 15_000;
export const MIN_JOB_DESCRIPTION_CHARS = 80;

// ── Sanitizing the AI part ──────────────────────────────────────────────────

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const texts = (v: unknown, cap: number) =>
  (Array.isArray(v) ? v.map(text).filter(Boolean) : []).slice(0, cap);
const list = (v: unknown) => (Array.isArray(v) ? v.map(obj) : []);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => {
  const t = text(v).toLowerCase();
  return allowed.find((a) => a === t) ?? fallback;
};
const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(n)));
const yearsOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 60 ? Math.round(n * 10) / 10 : null;
};

const CATEGORIES: RequirementCategory[] = ["hard", "tool", "soft", "certification", "education", "experience"];

export type JobMatchAi = {
  jobTitle: string;
  company: string;
  seniority: string;
  requiredYears: number | null;
  candidateYears: number | null;
  titleFit: number;
  requirements: { term: string; category: RequirementCategory; importance: RequirementImportance; aiStatus: RequirementStatus; evidence: string }[];
  tailoredSummary: string;
  tailoredBullets: TailoredBullet[];
  topActions: string[];
  verdict: string;
};

export function sanitizeJobMatchAi(raw: unknown): JobMatchAi {
  const a = obj(raw);
  const titleFit = Math.round(Number(a.titleFit));
  if (!Number.isFinite(titleFit)) throw new Error("Job match is missing the title fit score.");

  const seen = new Set<string>();
  const requirements = list(a.requirements)
    .map((r) => ({
      term: text(r.term),
      category: oneOf(r.category, CATEGORIES, "hard"),
      importance: oneOf(r.importance, ["required", "preferred"] as const, "preferred"),
      aiStatus: oneOf(r.status, ["found", "implied", "missing"] as const, "missing"),
      evidence: text(r.evidence),
    }))
    .filter((r) => {
      const key = r.term.toLowerCase();
      if (!r.term || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
  if (!requirements.length) throw new Error("No requirements were extracted from the job description.");

  return {
    jobTitle: text(a.jobTitle),
    company: text(a.company),
    seniority: text(a.seniority),
    requiredYears: yearsOrNull(a.requiredYears),
    candidateYears: yearsOrNull(a.candidateYears),
    titleFit: clamp(titleFit),
    requirements,
    tailoredSummary: text(a.tailoredSummary),
    tailoredBullets: list(a.tailoredBullets)
      .map((b) => ({ original: text(b.original), rewrite: text(b.rewrite), reason: text(b.reason) }))
      .filter((b) => b.rewrite)
      .slice(0, 8),
    topActions: texts(a.topActions, 5),
    verdict: text(a.verdict),
  };
}

// ── Exact-term matching ─────────────────────────────────────────────────────

/** Common spellings recruiters/ATS treat as the same skill. */
const ALIASES: string[][] = [
  ["javascript", "js", "ecmascript"],
  ["typescript", "ts"],
  ["node.js", "nodejs", "node"],
  ["react", "react.js", "reactjs"],
  ["next.js", "nextjs"],
  ["vue", "vue.js", "vuejs"],
  ["postgresql", "postgres", "psql"],
  ["kubernetes", "k8s"],
  ["amazon web services", "aws"],
  ["google cloud platform", "gcp", "google cloud"],
  ["microsoft azure", "azure"],
  ["ci/cd", "cicd", "continuous integration", "continuous delivery"],
  ["machine learning", "ml"],
  ["artificial intelligence", "ai"],
  ["user experience", "ux"],
  ["user interface", "ui"],
  ["c#", "csharp"],
  ["c++", "cpp"],
  ["golang", "go"],
  ["rest api", "rest apis", "restful api", "restful"],
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‐-―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Spellings to look for: the term itself plus known aliases. */
export function termVariants(term: string): string[] {
  const t = norm(term);
  const group = ALIASES.find((g) => g.includes(t));
  return group ? [...new Set([t, ...group])] : [t];
}

/**
 * True when the term (or an alias) appears as a whole word/phrase. Short
 * aliases like "js", "go", "ai" need word boundaries so "Django" isn't "go".
 */
export function containsTerm(haystack: string, term: string): boolean {
  const h = norm(haystack);
  return termVariants(term).some((v) => {
    if (!v) return false;
    // Boundaries that work for terms ending in symbols (c++, c#, node.js)
    const re = new RegExp(`(^|[^a-z0-9+#.])${escapeRe(v)}(?=$|[^a-z0-9+#]|\\.(?![a-z0-9]))`, "i");
    if (re.test(h)) return true;
    // Light stemming for single words, like most ATS: "Mentoring" ~ "mentored",
    // "Leadership" isn't stemmed (no suffix rule), short stems are skipped
    const stem = stemWord(v);
    return stem !== null && new RegExp(`(^|[^a-z0-9])${escapeRe(stem)}(?:ing|ed|es|s|er|ers)?(?![a-z0-9])`, "i").test(h);
  });
}

/** "mentoring" -> "mentor"; null when not a single plain word or the stem is too short. */
export function stemWord(word: string): string | null {
  if (!/^[a-z]+$/.test(word)) return null;
  const stem = word.replace(/(ing|ed|es|s)$/, "");
  return stem !== word && stem.length >= 5 ? stem : null;
}

/**
 * Final status per requirement:
 * - exact term present -> found (even if the AI said otherwise: ATS will see it)
 * - AI says shown but the term isn't literally there -> implied
 * - otherwise missing
 */
export function resolveStatus(resumeText: string, term: string, aiStatus: RequirementStatus): RequirementStatus {
  if (containsTerm(resumeText, term)) return "found";
  return aiStatus === "missing" ? "missing" : "implied";
}

// ── Scoring ─────────────────────────────────────────────────────────────────

export function requirementsScore(reqs: Pick<JobRequirement, "importance" | "status">[]): number {
  if (!reqs.length) return 0;
  let earned = 0;
  let possible = 0;
  for (const r of reqs) {
    const w = r.importance === "required" ? 2 : 1;
    possible += w;
    earned += w * (r.status === "found" ? 1 : r.status === "implied" ? 0.5 : 0);
  }
  return clamp((earned / possible) * 100);
}

/** 100 when the posting has no minimum or the candidate meets it; scales down below. */
export function experienceScore(requiredYears: number | null, candidateYears: number | null): number {
  if (!requiredYears) return 100;
  if (candidateYears == null) return 50; // unknown: neutral
  return clamp((candidateYears / requiredYears) * 100);
}

export function buildJobMatch(
  ai: JobMatchAi,
  resumeText: string,
  /** Prefer the code-computed years from the resume analysis when available */
  knownYears?: number | null,
): JobMatchData {
  const requirements: JobRequirement[] = ai.requirements.map((r) => ({
    term: r.term,
    category: r.category,
    importance: r.importance,
    status: resolveStatus(resumeText, r.term, r.aiStatus),
    evidence: r.evidence,
  }));

  const candidateYears = knownYears ?? ai.candidateYears;
  const breakdown = {
    requirements: requirementsScore(requirements),
    experience: experienceScore(ai.requiredYears, candidateYears),
    titleFit: ai.titleFit,
  };
  const matchScore = clamp(
    breakdown.requirements * MATCH_WEIGHTS.requirements +
      breakdown.experience * MATCH_WEIGHTS.experience +
      breakdown.titleFit * MATCH_WEIGHTS.titleFit,
    1,
    100,
  );

  // Keywords worth adding verbatim: skills/tools/certs the ATS will search for
  const keywordish = new Set<RequirementCategory>(["hard", "tool", "certification"]);
  const missingKeywords = requirements
    .filter((r) => r.status !== "found" && keywordish.has(r.category))
    .sort((a, b) => (a.importance === b.importance ? 0 : a.importance === "required" ? -1 : 1))
    .map((r) => r.term);

  return {
    version: 1,
    matchScore,
    breakdown,
    jobTitle: ai.jobTitle,
    company: ai.company,
    seniority: ai.seniority,
    requiredYears: ai.requiredYears,
    candidateYears,
    requirements,
    missingKeywords,
    tailoredSummary: ai.tailoredSummary,
    tailoredBullets: ai.tailoredBullets,
    topActions: ai.topActions,
    verdict: ai.verdict,
  };
}

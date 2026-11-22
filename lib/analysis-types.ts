// Shape of resumes.analysis (jsonb). v1 fields are always present; v2 fields
// are optional so analyses saved before v2 still type-check and render.
// Keep in sync with: ANALYSIS_SCHEMA (lib/resume-ai.ts), sanitizeAiAnalysis
// (lib/resume-sanitize.ts) and buildAnalysis (lib/resume-checks.ts).

export const ANALYSIS_VERSION = 2;

export type CheckStatus = "pass" | "warn" | "fail";

export type AtsCheck = {
  id: string;
  /** "ats" = affects machine parsing; "content" = recruiter-facing quality */
  category: "ats" | "content";
  label: string;
  status: CheckStatus;
  detail: string;
};

export type SubScores = {
  /** Code: contact info, standard sections, dates, length */
  atsParseability: number;
  /** AI judgment blended with the share of quantified bullets */
  impact: number;
  /** AI judgment: role-relevant keywords and skills coverage */
  keywords: number;
  /** AI judgment minus code penalties (long bullets, pronouns) */
  clarity: number;
  /** Code: share of core sections filled */
  completeness: number;
};

export type ResumeMetrics = {
  wordCount: number;
  bulletCount: number;
  quantifiedBullets: number;
  /** 0-100 */
  quantifiedRate: number;
  weakPhraseBullets: number;
  longBullets: number;
  pronounBullets: number;
  avgBulletWords: number;
};

export type BulletRating = "strong" | "ok" | "weak";

export type BulletAuditItem = {
  /** Where the bullet is, e.g. "Acme Corp — Frontend Engineer" */
  context: string;
  text: string;
  rating: BulletRating;
  issues: string[];
  /** Suggested rewrite (empty for strong bullets) */
  rewrite: string;
};

export type RedFlagType = "spelling" | "grammar" | "tense" | "pronoun" | "email" | "formatting" | "other";

export type RedFlag = { type: RedFlagType; text: string; fix: string };

export type Seniority = "entry" | "junior" | "mid" | "senior" | "lead" | "executive";

export type Position = {
  company: string;
  title: string;
  /** "YYYY-MM" or "" if unknown */
  start: string;
  /** "YYYY-MM", "present", or "" if unknown */
  end: string;
};

export type EmploymentGap = {
  /** "YYYY-MM" */
  from: string;
  /** "YYYY-MM" or "present" */
  to: string;
  months: number;
};

export type CareerProfile = {
  targetRole: string;
  seniority: Seniority;
  /** Code: total months covered by positions (overlaps merged), in years */
  yearsExperience: number | null;
  positions: Position[];
  employmentGaps: EmploymentGap[];
};

export type SkillsBreakdown = {
  hard: string[];
  soft: string[];
  tools: string[];
  /** In-demand skills for the target role that the resume doesn't show */
  suggested: string[];
};

export type ResumeAnalysisData = {
  // ── v1 (always present) ──
  overallScore: number;
  readability: string;
  keyKeywords: string[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: { section: string; current: string; suggested: string; reason: string }[];
  /** Missing essentials / content gaps (employment gaps live in careerProfile) */
  gapsDetected: string[];

  // ── v2 (optional: absent on older analyses) ──
  analysisVersion?: number;
  subScores?: SubScores;
  checks?: AtsCheck[];
  metrics?: ResumeMetrics;
  bulletAudit?: BulletAuditItem[];
  redFlags?: RedFlag[];
  careerProfile?: CareerProfile;
  skills?: SkillsBreakdown;
  firstImpression?: string;
};

/** Weights for the overall score (sum = 1). */
export const SUBSCORE_WEIGHTS: Record<keyof SubScores, number> = {
  atsParseability: 0.25,
  impact: 0.25,
  keywords: 0.2,
  clarity: 0.15,
  completeness: 0.15,
};

// Pure sanitizers for Gemini resume output (no server deps, unit-tested).
// Never trust the model's output shape: coerce every field to the jsonb types
// in config/schema.ts and add the ids + section order the editor needs.
import type { Resume } from "@/config/schema";
import type {
  BulletAuditItem,
  BulletRating,
  Position,
  RedFlag,
  RedFlagType,
  Seniority,
  SkillsBreakdown,
} from "@/lib/analysis-types";

export type ResumeContent = Resume["content"];
export type ResumeAnalysis = NonNullable<Resume["analysis"]>;

export const DEFAULT_SECTION_ORDER = [
  "personal",
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certificates",
];

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const optText = (v: unknown) => text(v) || undefined;
const texts = (v: unknown) =>
  Array.isArray(v) ? v.map(text).filter(Boolean) : [];
const list = (v: unknown) => (Array.isArray(v) ? v.map(obj) : []);
const links = (v: unknown) =>
  list(v)
    .map((l) => ({ label: text(l.label) || text(l.url), url: text(l.url) }))
    .filter((l) => l.url);
const newId = () => globalThis.crypto.randomUUID();

// ── AI part of the analysis (v2) ────────────────────────────────────────────
// Gemini supplies judgments; lib/resume-checks.ts adds the computed parts and
// the overall score (buildAnalysis).

const READABILITY = ["Excellent", "Good", "Fair", "Needs Improvement"];
const SENIORITY: Seniority[] = ["entry", "junior", "mid", "senior", "lead", "executive"];
const BULLET_RATINGS: BulletRating[] = ["strong", "ok", "weak"];
const RED_FLAG_TYPES: RedFlagType[] = ["spelling", "grammar", "tense", "pronoun", "email", "formatting", "other"];

/** Output caps keep stored reports (and model output) bounded. */
export const AI_LIMITS = {
  keywords: 20,
  listItems: 8,
  improvements: 10,
  bulletAudit: 20,
  redFlags: 12,
  skills: 20,
  suggestedSkills: 8,
} as const;

const capped = (v: unknown, n: number) => texts(v).slice(0, n);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => {
  const t = text(v).toLowerCase();
  return allowed.find((a) => a.toLowerCase() === t) ?? fallback;
};
const score = (v: unknown, name: string) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) throw new Error(`Analysis is missing the ${name} score.`);
  return Math.min(100, Math.max(0, n));
};
/** "YYYY-MM", "present", or "" (unknown). Accepts "YYYY" as January. */
const ym = (v: unknown, allowPresent: boolean) => {
  const t = text(v).toLowerCase();
  if (allowPresent && /^(present|current|now)$/.test(t)) return "present";
  const full = /^(\d{4})-(\d{1,2})$/.exec(t);
  if (full && Number(full[2]) >= 1 && Number(full[2]) <= 12) {
    return `${full[1]}-${full[2].padStart(2, "0")}`;
  }
  if (/^\d{4}$/.test(t)) return `${t}-01`;
  return "";
};

export type AiAnalysis = {
  readability: string;
  keyKeywords: string[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: ResumeAnalysis["improvements"];
  gapsDetected: string[];
  scores: { impact: number; keywords: number; clarity: number };
  bulletAudit: BulletAuditItem[];
  redFlags: RedFlag[];
  targetRole: string;
  seniority: Seniority;
  positions: Position[];
  skills: SkillsBreakdown;
  firstImpression: string;
};

export function sanitizeAiAnalysis(raw: unknown): AiAnalysis {
  const a = obj(raw);
  const s = obj(a.scores);
  const skills = obj(a.skills);
  return {
    // Throws when a score is missing, so the call is retried rather than saved
    scores: {
      impact: score(s.impact, "impact"),
      keywords: score(s.keywords, "keywords"),
      clarity: score(s.clarity, "clarity"),
    },
    readability: oneOf(a.readability, READABILITY, "Good"),
    keyKeywords: capped(a.keyKeywords, AI_LIMITS.keywords),
    summary: text(a.summary),
    strengths: capped(a.strengths, AI_LIMITS.listItems),
    weaknesses: capped(a.weaknesses, AI_LIMITS.listItems),
    improvements: list(a.improvements)
      .map((i) => ({
        section: text(i.section),
        current: text(i.current),
        suggested: text(i.suggested),
        reason: text(i.reason),
      }))
      .filter((i) => i.suggested)
      .slice(0, AI_LIMITS.improvements),
    gapsDetected: capped(a.gapsDetected, AI_LIMITS.listItems),
    bulletAudit: list(a.bulletAudit)
      .map((b) => {
        const rating = oneOf(b.rating, BULLET_RATINGS, "ok");
        return {
          context: text(b.context),
          text: text(b.text),
          rating,
          issues: capped(b.issues, 4),
          rewrite: rating === "strong" ? "" : text(b.rewrite),
        };
      })
      .filter((b) => b.text)
      .slice(0, AI_LIMITS.bulletAudit),
    redFlags: list(a.redFlags)
      .map((f) => ({ type: oneOf(f.type, RED_FLAG_TYPES, "other"), text: text(f.text), fix: text(f.fix) }))
      .filter((f) => f.text)
      .slice(0, AI_LIMITS.redFlags),
    targetRole: text(a.targetRole),
    seniority: oneOf(a.seniority, SENIORITY, "mid"),
    positions: list(a.positions)
      .map((p) => ({
        company: text(p.company),
        title: text(p.title),
        start: ym(p.start, false),
        end: ym(p.end, true),
      }))
      .filter((p) => p.company || p.title)
      .slice(0, 30),
    skills: {
      hard: capped(skills.hard, AI_LIMITS.skills),
      soft: capped(skills.soft, AI_LIMITS.skills),
      tools: capped(skills.tools, AI_LIMITS.skills),
      suggested: capped(skills.suggested, AI_LIMITS.suggestedSkills),
    },
    firstImpression: text(a.firstImpression),
  };
}

/** Sanitize parsed content and add the ids + section order the editor's drag-and-drop needs. */
export function sanitizeContent(raw: unknown): ResumeContent {
  const c = obj(raw);
  const p = obj(c.personalDetails);
  return {
    personalDetails: {
      name: text(p.name),
      phone: text(p.phone),
      email: text(p.email),
      address: text(p.address),
      links: links(p.links),
    },
    professionalSummary: text(c.professionalSummary),
    skills: list(c.skills)
      .map((s) => ({ id: newId(), category: text(s.category) || "Skills", value: text(s.value) }))
      .filter((s) => s.value),
    experiences: list(c.experiences)
      .map((e) => ({
        id: newId(),
        company: text(e.company),
        role: text(e.role),
        duration: text(e.duration),
        bullets: texts(e.bullets),
      }))
      .filter((e) => e.company || e.role),
    projects: list(c.projects)
      .map((pr) => ({
        id: newId(),
        title: text(pr.title),
        duration: text(pr.duration),
        description: texts(pr.description),
        links: links(pr.links),
      }))
      .filter((pr) => pr.title),
    educations: list(c.educations)
      .map((ed) => ({
        id: newId(),
        schoolName: text(ed.schoolName),
        course: text(ed.course),
        major: optText(ed.major),
        duration: text(ed.duration),
        gwa: optText(ed.gwa),
      }))
      .filter((ed) => ed.schoolName || ed.course),
    certificates: list(c.certificates)
      .map((ce) => ({
        id: newId(),
        title: text(ce.title),
        issuedDate: text(ce.issuedDate),
        expirationDate: optText(ce.expirationDate),
        description: optText(ce.description),
        links: links(ce.links),
      }))
      .filter((ce) => ce.title),
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  };
}

/** Combined parse + analysis response: { content, analysis } -> { content, ai }. */
export function sanitizeParsedResume(raw: unknown) {
  const root = obj(raw);
  return {
    content: sanitizeContent(root.content),
    ai: sanitizeAiAnalysis(root.analysis),
  };
}

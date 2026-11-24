// Deterministic resume checks (pure, unit-tested). Everything countable is
// computed here instead of asked from the model, so it's free, instant and
// gives the same answer every run. buildAnalysis() merges it with the AI part.
import type { Resume } from "@/config/schema";
import {
  ANALYSIS_VERSION,
  SUBSCORE_WEIGHTS,
  type AtsCheck,
  type CheckStatus,
  type EmploymentGap,
  type Position,
  type ResumeAnalysisData,
  type ResumeMetrics,
  type SubScores,
} from "@/lib/analysis-types";
import { sectionCompleteness } from "@/lib/resume-stats";
import type { AiAnalysis } from "@/lib/resume-sanitize";

type Content = Resume["content"];

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(n)));
const words = (s: string) => s.split(/\s+/).filter(Boolean);

// ── Bullets ─────────────────────────────────────────────────────────────────

/** Numbers, %, currency, or multipliers ("3x") = a quantified achievement. */
const QUANTIFIED_RE = /(\d|%|\$|€|£|¥|₱|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|dozens?|hundreds?|thousands?|millions?|billions?|double[ds]?|triple[ds]?|half)\b)/i;
const WEAK_PHRASE_RE = /^(?:responsible for|in charge of|duties included|tasked with|helped(?: to)?|assisted(?: with| in)?|worked on|involved in|participated in|handled)\b/i;
const PRONOUN_RE = /\b(?:I|me|my|mine|myself|we|our)\b/;
const LONG_BULLET_WORDS = 35;

export function allBullets(content: Content): string[] {
  return [
    ...(content.experiences ?? []).flatMap((e) => e.bullets ?? []),
    ...(content.projects ?? []).flatMap((p) => p.description ?? []),
  ]
    .map((b) => b.trim())
    .filter(Boolean);
}

export const isQuantified = (bullet: string) => QUANTIFIED_RE.test(bullet);
export const hasWeakPhrase = (bullet: string) => WEAK_PHRASE_RE.test(bullet.replace(/^[•\-–*]\s*/, ""));
export const hasPronoun = (bullet: string) => PRONOUN_RE.test(bullet);

/** All visible text of the structured resume (used when raw text isn't available). */
export function contentText(content: Content): string {
  const p = content.personalDetails ?? {};
  return [
    p.name, p.email, p.phone, p.address,
    content.professionalSummary,
    ...(content.skills ?? []).map((s) => `${s.category} ${s.value}`),
    ...(content.experiences ?? []).flatMap((e) => [e.company, e.role, e.duration, ...(e.bullets ?? [])]),
    ...(content.projects ?? []).flatMap((pr) => [pr.title, pr.duration, ...(pr.description ?? [])]),
    ...(content.educations ?? []).flatMap((ed) => [ed.schoolName, ed.course, ed.major, ed.duration]),
    ...(content.certificates ?? []).flatMap((c) => [c.title, c.issuedDate, c.description]),
    ...(content.customSections ?? []).flatMap((c) => [c.title, c.body]),
  ]
    .filter(Boolean)
    .join("\n");
}

export function computeMetrics(content: Content, rawText?: string): ResumeMetrics {
  const bullets = allBullets(content);
  const quantified = bullets.filter(isQuantified).length;
  const totalBulletWords = bullets.reduce((a, b) => a + words(b).length, 0);
  return {
    wordCount: words(rawText?.trim() ? rawText : contentText(content)).length,
    bulletCount: bullets.length,
    quantifiedBullets: quantified,
    quantifiedRate: bullets.length ? clamp((quantified / bullets.length) * 100) : 0,
    weakPhraseBullets: bullets.filter(hasWeakPhrase).length,
    longBullets: bullets.filter((b) => words(b).length > LONG_BULLET_WORDS).length,
    pronounBullets: bullets.filter(hasPronoun).length,
    avgBulletWords: bullets.length ? Math.round(totalBulletWords / bullets.length) : 0,
  };
}

// ── Dates, gaps, years of experience ─────────────────────────────────────────

const YM_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "YYYY-MM" -> months since year 0, or null. "present" -> `now`. */
export function toMonthIndex(ym: string, now = new Date()): number | null {
  if (ym === "present") return now.getUTCFullYear() * 12 + now.getUTCMonth();
  const m = YM_RE.exec(ym);
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
}

const fromMonthIndex = (i: number) =>
  `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;

/** Merge overlapping positions into continuous intervals [start, end] (month indexes). */
function mergedIntervals(positions: Position[], now: Date): [number, number][] {
  const spans = positions
    .map((p) => [toMonthIndex(p.start, now), toMonthIndex(p.end || "", now)] as const)
    .filter((s): s is readonly [number, number] => s[0] !== null && s[1] !== null && s[1] >= s[0])
    .map(([a, b]) => [a, b] as [number, number])
    .sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [a, b] of spans) {
    const last = merged[merged.length - 1];
    // Consecutive months (Jan -> Feb) count as continuous
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}

/** Total experience in years (overlapping roles counted once), 1 decimal. */
export function yearsOfExperience(positions: Position[], now = new Date()): number | null {
  const merged = mergedIntervals(positions, now);
  if (!merged.length) return null;
  const months = merged.reduce((a, [s, e]) => a + (e - s + 1), 0);
  return Math.round((months / 12) * 10) / 10;
}

/** Gaps of at least `minMonths` between roles, plus a current gap if the last role ended. */
export function employmentGaps(positions: Position[], now = new Date(), minMonths = 3): EmploymentGap[] {
  const merged = mergedIntervals(positions, now);
  const gaps: EmploymentGap[] = [];
  for (let i = 1; i < merged.length; i++) {
    const months = merged[i][0] - merged[i - 1][1] - 1;
    if (months >= minMonths) {
      gaps.push({ from: fromMonthIndex(merged[i - 1][1] + 1), to: fromMonthIndex(merged[i][0] - 1), months });
    }
  }
  const last = merged[merged.length - 1];
  const nowIndex = toMonthIndex("present", now)!;
  if (last && nowIndex - last[1] - 1 >= minMonths) {
    gaps.push({ from: fromMonthIndex(last[1] + 1), to: "present", months: nowIndex - last[1] - 1 });
  }
  return gaps;
}

/** Rough date style of a free-text duration, to spot inconsistent formats. */
export function dateStyle(duration: string): "month-name" | "numeric" | "year" | null {
  const d = duration.trim();
  if (!d) return null;
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}/i.test(d)) return "month-name";
  if (/\b\d{1,2}\s*[/.-]\s*\d{4}\b|\b\d{4}-\d{2}\b/.test(d)) return "numeric";
  if (/\b\d{4}\b/.test(d)) return "year";
  return null;
}

// ── ATS checks ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /\d[\d\s().+-]{6,}\d/;

function check(
  id: string,
  category: AtsCheck["category"],
  label: string,
  status: CheckStatus,
  detail: string,
): AtsCheck {
  return { id, category, label, status, detail };
}

export function computeChecks(
  content: Content,
  metrics: ResumeMetrics,
  positions: Position[],
): AtsCheck[] {
  const p = content.personalDetails ?? {};
  const links = p.links ?? [];
  const experiences = content.experiences ?? [];
  const checks: AtsCheck[] = [];

  // Contact details: ATS systems file you under these fields
  const email = (p.email ?? "").trim();
  checks.push(
    EMAIL_RE.test(email)
      ? check("email", "ats", "Email address", "pass", "A valid email was found.")
      : check("email", "ats", "Email address", "fail", email ? "The email doesn't look valid." : "No email address was found. Recruiters and ATS systems need one to contact you."),
  );
  checks.push(
    PHONE_RE.test(p.phone ?? "")
      ? check("phone", "ats", "Phone number", "pass", "A phone number was found.")
      : check("phone", "ats", "Phone number", "warn", "No phone number was found."),
  );
  const hasLinkedIn = links.some((l) => /linkedin\.com/i.test(l.url));
  checks.push(
    hasLinkedIn
      ? check("linkedin", "ats", "LinkedIn profile", "pass", "A LinkedIn URL was found.")
      : check("linkedin", "ats", "LinkedIn profile", "warn", "Add your LinkedIn URL; most recruiters check it."),
  );

  // Standard sections ATS parsers look for
  const missingCore = [
    !experiences.length && "Experience",
    !(content.educations ?? []).length && "Education",
    !(content.skills ?? []).length && "Skills",
  ].filter(Boolean) as string[];
  checks.push(
    missingCore.length === 0
      ? check("sections", "ats", "Standard sections", "pass", "Experience, Education and Skills were all found.")
      : check(
          "sections",
          "ats",
          "Standard sections",
          missingCore.includes("Experience") ? "fail" : "warn",
          `Not found: ${missingCore.join(", ")}. Use standard headings so ATS systems can find them.`,
        ),
  );

  // Dates on every role
  if (experiences.length) {
    const undated = positions.filter((pos) => toMonthIndex(pos.start) === null).length;
    checks.push(
      undated === 0
        ? check("dates", "ats", "Dates on every role", "pass", "Each role has a start date.")
        : check("dates", "ats", "Dates on every role", "warn", `${undated} role${undated === 1 ? " has" : "s have"} missing or unclear dates.`),
    );
    const styles = new Set(experiences.map((e) => dateStyle(e.duration ?? "")).filter(Boolean));
    checks.push(
      styles.size <= 1
        ? check("date_format", "ats", "Consistent date format", "pass", "Dates use one consistent format.")
        : check("date_format", "ats", "Consistent date format", "warn", "Dates mix formats (e.g. \"Jan 2022\" and \"01/2022\"). Pick one, such as \"Jan 2022 – Present\"."),
    );
  }

  // Length
  const w = metrics.wordCount;
  checks.push(
    w < 200
      ? check("length", "ats", "Length", "warn", `About ${w} words. That's thin; most strong resumes have 350–800.`)
      : w > 1000
        ? check("length", "ats", "Length", "warn", `About ${w} words. That's likely over two pages; trim older or less relevant detail.`)
        : check("length", "ats", "Length", "pass", `About ${w} words, a healthy length.`),
  );

  // Content quality signals
  if (metrics.bulletCount > 0) {
    const r = metrics.quantifiedRate;
    checks.push(
      check(
        "quantified",
        "content",
        "Quantified achievements",
        r >= 40 ? "pass" : r >= 20 ? "warn" : "fail",
        `${metrics.quantifiedBullets} of ${metrics.bulletCount} bullets (${r}%) include a number. Aim for at least 40%.`,
      ),
    );
    checks.push(
      metrics.weakPhraseBullets === 0
        ? check("action_verbs", "content", "Strong action verbs", "pass", "No bullets start with weak phrases.")
        : check("action_verbs", "content", "Strong action verbs", "warn", `${metrics.weakPhraseBullets} bullet${metrics.weakPhraseBullets === 1 ? " starts" : "s start"} with phrases like "Responsible for" or "Helped". Lead with what you did.`),
    );
    checks.push(
      metrics.pronounBullets === 0
        ? check("pronouns", "content", "No first-person pronouns", "pass", "Bullets avoid \"I\", \"my\" and \"we\".")
        : check("pronouns", "content", "No first-person pronouns", "warn", `${metrics.pronounBullets} bullet${metrics.pronounBullets === 1 ? " uses" : "s use"} "I", "my" or "we". Drop them.`),
    );
    checks.push(
      metrics.longBullets === 0
        ? check("bullet_length", "content", "Concise bullets", "pass", `Bullets average ${metrics.avgBulletWords} words.`)
        : check("bullet_length", "content", "Concise bullets", "warn", `${metrics.longBullets} bullet${metrics.longBullets === 1 ? " is" : "s are"} over ${LONG_BULLET_WORDS} words. Keep each to one or two lines.`),
    );
  }
  const thinRoles = experiences.filter((e) => (e.bullets ?? []).filter((b) => b.trim()).length < 2).length;
  if (experiences.length) {
    checks.push(
      thinRoles === 0
        ? check("role_detail", "content", "Detail on each role", "pass", "Every role has at least two bullets.")
        : check("role_detail", "content", "Detail on each role", "warn", `${thinRoles} role${thinRoles === 1 ? " has" : "s have"} fewer than two bullets.`),
    );
  }
  checks.push(
    content.professionalSummary?.trim()
      ? check("summary", "content", "Professional summary", "pass", "A summary was found.")
      : check("summary", "content", "Professional summary", "warn", "Add a 2–3 sentence summary tailored to the role you want."),
  );

  return checks;
}

// ── Scores ──────────────────────────────────────────────────────────────────

/** 100 minus penalties for the parse-relevant ("ats") checks. */
export function parseabilityScore(checks: AtsCheck[]): number {
  const penalty = checks
    .filter((c) => c.category === "ats")
    .reduce((a, c) => a + (c.status === "fail" ? 20 : c.status === "warn" ? 7 : 0), 0);
  return clamp(100 - penalty);
}

export function computeSubScores(
  ai: AiAnalysis["scores"],
  metrics: ResumeMetrics,
  checks: AtsCheck[],
  content: Content,
): SubScores {
  // 40%+ quantified bullets earns full marks for that half of "impact"
  const quantScore = metrics.bulletCount ? clamp((metrics.quantifiedRate / 40) * 100) : 0;
  const clarityPenalty = Math.min(20, metrics.longBullets * 3 + metrics.pronounBullets * 2);
  return {
    atsParseability: parseabilityScore(checks),
    impact: clamp(ai.impact * 0.6 + quantScore * 0.4),
    keywords: clamp(ai.keywords),
    clarity: clamp(ai.clarity - clarityPenalty),
    completeness: sectionCompleteness(content).completeness,
  };
}

export function overallFromSubScores(s: SubScores): number {
  const total = (Object.keys(SUBSCORE_WEIGHTS) as (keyof SubScores)[]).reduce(
    (a, k) => a + s[k] * SUBSCORE_WEIGHTS[k],
    0,
  );
  return clamp(total, 1, 100);
}

/** Merge the sanitized AI output with the deterministic checks into the stored analysis. */
export function buildAnalysis(
  ai: AiAnalysis,
  content: Content,
  rawText?: string,
  now = new Date(),
): ResumeAnalysisData {
  const metrics = computeMetrics(content, rawText);
  const checks = computeChecks(content, metrics, ai.positions);
  const subScores = computeSubScores(ai.scores, metrics, checks, content);
  return {
    // v1 fields (overall score is now computed, not asked for)
    overallScore: overallFromSubScores(subScores),
    readability: ai.readability,
    keyKeywords: ai.keyKeywords,
    summary: ai.summary,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
    improvements: ai.improvements,
    gapsDetected: ai.gapsDetected,
    // v2
    analysisVersion: ANALYSIS_VERSION,
    subScores,
    checks,
    metrics,
    bulletAudit: ai.bulletAudit,
    redFlags: ai.redFlags,
    careerProfile: {
      targetRole: ai.targetRole,
      seniority: ai.seniority,
      yearsExperience: yearsOfExperience(ai.positions, now),
      positions: ai.positions,
      employmentGaps: employmentGaps(ai.positions, now),
    },
    skills: ai.skills,
    firstImpression: ai.firstImpression,
  };
}

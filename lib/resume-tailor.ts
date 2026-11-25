// "Tailor to a job" (Create screen): pure rules, unit-tested.
//
// The AI (lib/resume-tailor-ai.ts, T2) suggests a tailored version of a resume
// for one job. Everything here decides what is ACCEPTED from it:
//   - the fact guard: employers, titles, dates, schools, certificates, contact
//     details and the number of entries always come from the original; the
//     AI may only rewrite the summary and bullets and reorder skills/sections
//   - before/after keyword scoring (exact-term matching, same as Job match)
//   - the "what changed" list and the record stored in resumes.tailored_for
import { addSkills, existingSkillKeys, sanitizeSkillSuggestions, type SkillSuggestion } from "@/lib/ai-writing";
import { containsTerm, requirementsScore, MAX_JOB_DESCRIPTION_CHARS } from "@/lib/job-match";
import { contentText } from "@/lib/resume-checks";
import { EDITOR_LIMITS, normalizeResumeTitle, normalizeSectionOrder } from "@/lib/resume-editor";
import { sectionTitle } from "@/lib/resume-templates";
import { stripRich, toPlainContent } from "@/lib/rich-text";
import type { ResumeContent } from "@/lib/resume-sanitize";

export const TAILOR_LIMITS = {
  keywords: 25,
  suggestedSkills: 12,
  termMax: 60,
  summaryMax: 900,
  bulletMax: 300,
  reasonMax: 200,
  jobDescriptionMax: MAX_JOB_DESCRIPTION_CHARS,
} as const;

export type KeywordImportance = "required" | "preferred";
/**
 * kind: "tool" = a named thing that is a checkable fact (technology, language,
 * framework, platform, standard, certification); "skill" = a general ability,
 * soft skill, domain or role phrase. Only "tool" terms are held to the
 * "the resume must already mention it" rule.
 */
export type TailorKeyword = { term: string; importance: KeywordImportance; kind?: "tool" | "skill" };

export type TailorChange = {
  section: "summary" | "experience" | "projects" | "skills" | "order";
  /** "Summary", "Frontend Developer at Acme", "Added skills"… */
  label: string;
  before: string[];
  after: string[];
  reason: string;
};

/** Stored with the tailored resume (resumes.tailored_for). */
export type TailoredFor = {
  version: 1;
  /**
   * "review": made by the AI, waiting for the user to tick the missing skills
   * they really have and pick a template; "done": finished
   */
  stage: "review" | "done";
  /** Missing skills offered in the review step (emptied when done) */
  suggestedSkills: SkillSuggestion[];
  jobTitle: string;
  company: string;
  jobDescription: string;
  source: "upload" | "resume";
  /** The saved resume it was made from (source "resume") */
  sourceResumeId: string | null;
  /** The uploaded file's name (source "upload") */
  sourceName: string | null;
  createdAt: string;
  score: { before: number; after: number };
  keywords: (TailorKeyword & { before: boolean; after: boolean })[];
  changes: TailorChange[];
};

/** What the AI's answer becomes after the guard: a draft the user confirms. */
export type TailorDraft = {
  jobTitle: string;
  company: string;
  content: ResumeContent;
  /** Why each entry changed, keyed "experience:0", "projects:1", "summary" */
  reasons: Record<string, string>;
  keywords: TailorKeyword[];
  /** Skills the job wants that aren't on the resume: the user ticks only real ones */
  suggestedSkills: SkillSuggestion[];
};

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const list = (v: unknown) => (Array.isArray(v) ? v : []);
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Plain one-line text from the model (no markdown, no bullet marks). */
const clean = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(CONTROL, "")
        .replace(/[*`]|__/g, "")
        .replace(/^\s*(?:[•\-–]|\d+[.)])\s+/, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
const plain = (s: string | undefined) => stripRich(s ?? "").trim();
const nonEmpty = (items: string[] | undefined) => (items ?? []).filter((b) => plain(b));

/**
 * Text that still needs the user's input ("[X%]", "XX users", "TBD") can't
 * go into a resume that is downloaded and sent as-is.
 */
export const hasPlaceholder = (s: string) => /\[[^\]]{0,40}\]|\bX{2,}\b|\bTBD\b|\bN\/A\b/i.test(s);

const okLine = (s: string, min = 8) => s.length >= min && !hasPlaceholder(s);

/**
 * New bullets for one entry, or null to keep the original. The count must stay
 * close to the original (n-1 to n+1): the AI may merge or split a bullet, not
 * drop a role's content or pad it out.
 */
function guardBullets(original: string[] | undefined, raw: unknown): string[] | null {
  const n = nonEmpty(original).length;
  if (n === 0) return null; // nothing to rewrite: writing new bullets would be inventing
  const next = list(raw)
    .map((b) => clean(b, TAILOR_LIMITS.bulletMax))
    .filter((b) => okLine(b));
  if (next.length < Math.max(1, n - 1) || next.length > Math.min(n + 1, EDITOR_LIMITS.bullets)) return null;
  return next;
}

/**
 * Skills reordered/regrouped by the AI, keeping ONLY skills already on the
 * resume. Anything the AI dropped is added back at the end, so nothing is lost.
 */
function guardSkills(original: ResumeContent["skills"], raw: unknown, newId: () => string): ResumeContent["skills"] {
  const orig = original ?? [];
  // Each original skill value (comma lists split), with its category
  const known = new Map<string, { category: string; skill: string }>();
  for (const s of orig) {
    for (const v of (s.value ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      if (!known.has(key(v))) known.set(key(v), { category: s.category, skill: v });
    }
  }
  if (!known.size) return orig;

  const used = new Set<string>();
  const out: NonNullable<ResumeContent["skills"]> = [];
  for (const item of list(raw)) {
    const o = obj(item);
    const k = key(clean(o.skill, TAILOR_LIMITS.termMax));
    const hit = known.get(k);
    if (!hit || used.has(k)) continue; // not on the resume: never added here
    used.add(k);
    out.push({ id: newId(), category: clean(o.category, 40) || hit.category || "Skills", value: hit.skill });
  }
  if (!out.length) return orig; // the AI gave nothing usable: keep the original grouping
  for (const [k, s] of known) {
    if (!used.has(k)) out.push({ id: newId(), category: s.category || "Skills", value: s.skill });
  }
  return out;
}

// ── Honesty checks on rewritten text ────────────────────────────────────────

/**
 * Numbers in a text, normalized: "1,200" -> "1200"; "40%" / "40 percent" and
 * "500+" / "over 500" count as the same number. Metrics, counts, years.
 */
export function numbersIn(text: string): Set<string> {
  return new Set((text.match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/,/g, "").replace(/\.$/, "")));
}

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

/**
 * Job keywords a rewrite uses that the ORIGINAL resume never mentions: the
 * model claiming experience the candidate didn't state (e.g. "WCAG").
 */
export function unsupportedTerms(rewrite: string, originalText: string, keywords: TailorKeyword[]): string[] {
  return keywords
    .filter((k) => k.kind !== "skill" && containsTerm(rewrite, k.term) && !containsTerm(originalText, k.term))
    .map((k) => k.term);
}

/** Turn the AI's raw answer into a safe draft based on the original resume. */
export function sanitizeTailorAi(
  raw: unknown,
  original: ResumeContent,
  newId: () => string = () => globalThis.crypto.randomUUID(),
): TailorDraft {
  const o = obj(raw);
  const reasons: Record<string, string> = {};
  const content: ResumeContent = structuredClone(original);
  const originalText = contentText(toPlainContent(original));

  const seenTerms = new Set<string>();
  const keywords: TailorKeyword[] = [];
  for (const item of list(o.keywords)) {
    const k = obj(item);
    const term = clean(k.term, TAILOR_LIMITS.termMax);
    if (!term || seenTerms.has(key(term))) continue;
    seenTerms.add(key(term));
    keywords.push({
      term,
      importance: k.importance === "preferred" ? "preferred" : "required",
      kind: k.kind === "skill" ? "skill" : "tool",
    });
    if (keywords.length === TAILOR_LIMITS.keywords) break;
  }

  // Summary: no job terms the resume never mentions, no numbers it doesn't contain
  const summary = clean(o.summary, TAILOR_LIMITS.summaryMax);
  const resumeNumbers = numbersIn(originalText);
  if (
    okLine(summary, 20) &&
    !unsupportedTerms(summary, originalText, keywords).length &&
    [...numbersIn(summary)].every((n) => resumeNumbers.has(n))
  ) {
    content.professionalSummary = summary;
    const r = clean(o.summaryReason, TAILOR_LIMITS.reasonMax);
    if (r) reasons.summary = r;
  }

  const entries = (field: "experiences" | "projects", section: "experience" | "projects", bulletKey: "bullets" | "description") => {
    const seen = new Set<number>();
    for (const item of list(o[field])) {
      const e = obj(item);
      const index = Number(e.index);
      const target = content[field]?.[index] as Record<string, unknown> | undefined;
      if (!Number.isInteger(index) || seen.has(index) || !target) continue;
      seen.add(index);
      const before = nonEmpty(target[bulletKey] as string[] | undefined).map(plain).join("\n");
      const next = guardBullets(target[bulletKey] as string[] | undefined, e.bullets);
      if (!next) continue;
      const after = next.join("\n");
      // Every number kept and none added; no job terms the resume never mentions
      if (!sameSet(numbersIn(before), numbersIn(after))) continue;
      if (unsupportedTerms(after, originalText, keywords).length) continue;
      target[bulletKey] = next;
      const r = clean(e.reason, TAILOR_LIMITS.reasonMax);
      if (r) reasons[`${section}:${index}`] = r;
    }
  };
  entries("experiences", "experience", "bullets");
  entries("projects", "projects", "description");

  content.skills = guardSkills(original.skills, o.skills, newId);

  // Section order: known keys only, every section kept, contact details first
  const order = normalizeSectionOrder(o.sectionOrder, (original.customSections ?? []).map((c) => c.id));
  content.sectionOrder = ["personal", ...order.filter((k) => k !== "personal")];

  return {
    jobTitle: clean(o.jobTitle, 120),
    company: clean(o.company, 120),
    content,
    reasons,
    keywords,
    suggestedSkills: sanitizeSkillSuggestions({ skills: o.missingSkills }, content.skills, TAILOR_LIMITS.suggestedSkills),
  };
}

// ── Scoring (no AI: exact terms, like an ATS) ───────────────────────────────

/** Share of the job's key terms the resume contains (required count double). */
export function keywordScore(content: ResumeContent, keywords: TailorKeyword[]) {
  const text = contentText(toPlainContent(content));
  const items = keywords.map((k) => ({ ...k, found: containsTerm(text, k.term) }));
  return {
    score: requirementsScore(items.map((i) => ({ importance: i.importance, status: i.found ? "found" : "missing" }))),
    items,
  };
}

export function compareScores(before: ResumeContent, after: ResumeContent, keywords: TailorKeyword[]) {
  const b = keywordScore(before, keywords);
  const a = keywordScore(after, keywords);
  return {
    score: { before: b.score, after: a.score },
    keywords: keywords.map((k, i) => ({ ...k, before: b.items[i].found, after: a.items[i].found })),
  };
}

// ── Finishing and describing the result ─────────────────────────────────────

/** The draft plus the missing skills the user confirmed they really have. */
export function finalizeTailoredContent(draft: ResumeContent, confirmedSkills: SkillSuggestion[]): ResumeContent {
  return confirmedSkills.length ? { ...draft, skills: addSkills(draft.skills, confirmedSkills) } : draft;
}

const skillNames = (skills: ResumeContent["skills"]) =>
  (skills ?? []).flatMap((s) => (s.value ?? "").split(",")).map((v) => v.trim()).filter(Boolean);

/** What changed and why, for the result screen. */
export function buildTailorChanges(
  original: ResumeContent,
  tailored: ResumeContent,
  reasons: Record<string, string>,
  confirmedSkills: SkillSuggestion[] = [],
): TailorChange[] {
  const changes: TailorChange[] = [];

  if (plain(original.professionalSummary) !== plain(tailored.professionalSummary)) {
    changes.push({
      section: "summary",
      label: "Summary",
      before: plain(original.professionalSummary) ? [plain(original.professionalSummary)] : [],
      after: [plain(tailored.professionalSummary)],
      reason: reasons.summary || "Rewritten for this job",
    });
  }

  const entryChanges = (field: "experiences" | "projects", section: "experience" | "projects") => {
    (tailored[field] ?? []).forEach((entry, i) => {
      const was = original[field]?.[i];
      const before = nonEmpty(field === "experiences" ? (was as { bullets?: string[] })?.bullets : (was as { description?: string[] })?.description).map(plain);
      const after = nonEmpty(field === "experiences" ? (entry as { bullets?: string[] }).bullets : (entry as { description?: string[] }).description).map(plain);
      if (before.join("\n") === after.join("\n")) return;
      const e = entry as { role?: string; company?: string; title?: string };
      const label = section === "experience" ? [e.role, e.company && `at ${e.company}`].filter(Boolean).join(" ") : e.title ?? "";
      changes.push({ section, label: label || (section === "experience" ? "Experience" : "Project"), before, after, reason: reasons[`${section}:${i}`] || "Rewritten for this job" });
    });
  };
  entryChanges("experiences", "experience");
  entryChanges("projects", "projects");

  // Skills: reordered (the confirmed additions are listed separately)
  const addedKeys = new Set(confirmedSkills.map((s) => key(s.skill)));
  const beforeSkills = skillNames(original.skills);
  const afterSkills = skillNames(tailored.skills).filter((s) => !addedKeys.has(key(s)) || existingSkillKeys(original.skills).has(key(s)));
  if (beforeSkills.map(key).join("|") !== afterSkills.map(key).join("|")) {
    changes.push({ section: "skills", label: "Skills order", before: beforeSkills, after: afterSkills, reason: "The skills this job asks for come first" });
  }
  const added = addedSkillsChange(confirmedSkills.map((s) => s.skill).filter((s) => !existingSkillKeys(original.skills).has(key(s))));
  if (added) changes.push(added);

  const titles = (c: ResumeContent) => c.sectionOrder.filter((k) => k !== "personal").map((k) => sectionTitle(c, k));
  if (original.sectionOrder.join("|") !== tailored.sectionOrder.join("|")) {
    changes.push({ section: "order", label: "Section order", before: titles(original), after: titles(tailored), reason: "The most relevant sections come first" });
  }
  return changes;
}

/**
 * Review step preview (browser, no resume needed): the "after" score if the
 * user adds these skills. A missing keyword counts as found when a ticked
 * skill matches it. The server recomputes the real score on finish.
 */
export function previewScore(keywords: (TailorKeyword & { after: boolean })[], confirmed: SkillSuggestion[]): number {
  if (!keywords.length) return 0;
  const names = confirmed.map((s) => s.skill).join(", ");
  return requirementsScore(
    keywords.map((k) => ({ importance: k.importance, status: k.after || (names && containsTerm(names, k.term)) ? "found" : "missing" })),
  );
}

/** The "Added skills" entry of the change list (null when nothing was added). */
export function addedSkillsChange(skills: string[]): TailorChange | null {
  return skills.length
    ? { section: "skills", label: "Added skills", before: [], after: skills, reason: "You confirmed you have these and the job asks for them" }
    : null;
}

/**
 * The confirmed skills, keeping only ones that were actually offered (a
 * client can't add arbitrary skills through the review step).
 */
export function pickOfferedSkills(raw: unknown, offered: SkillSuggestion[]): SkillSuggestion[] {
  const byKey = new Map(offered.map((s) => [key(s.skill), s]));
  const out: SkillSuggestion[] = [];
  const seen = new Set<string>();
  for (const item of list(raw)) {
    const k = key(typeof obj(item).skill === "string" ? (obj(item).skill as string) : "");
    const hit = byKey.get(k);
    if (hit && !seen.has(k)) {
      seen.add(k);
      out.push(hit);
    }
  }
  return out;
}

/** "Resume · Acme · Frontend Developer" (fits the title limit). */
export function tailoredTitle(jobTitle: string, company: string): string {
  const parts = [company.trim(), jobTitle.trim()].filter(Boolean);
  return parts.length ? normalizeResumeTitle(`Resume · ${parts.join(" · ")}`) : "Tailored resume";
}

/** Read resumes.tailored_for safely (old/odd rows -> null). */
export function sanitizeTailoredFor(raw: unknown): TailoredFor | null {
  const o = obj(raw);
  if (o.version !== 1) return null;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const score = obj(o.score);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0);
  const strings = (v: unknown) => list(v).filter((x): x is string => typeof x === "string").slice(0, 60).map((x) => x.slice(0, 2000));
  return {
    version: 1,
    stage: o.stage === "review" ? "review" : "done",
    suggestedSkills: sanitizeSkillSuggestions({ skills: o.suggestedSkills }, [], TAILOR_LIMITS.suggestedSkills),
    jobTitle: str(o.jobTitle, 120),
    company: str(o.company, 120),
    jobDescription: str(o.jobDescription, TAILOR_LIMITS.jobDescriptionMax),
    source: o.source === "upload" ? "upload" : "resume",
    sourceResumeId: typeof o.sourceResumeId === "string" ? o.sourceResumeId : null,
    sourceName: typeof o.sourceName === "string" ? o.sourceName.slice(0, 200) : null,
    createdAt: str(o.createdAt, 40),
    score: { before: num(score.before), after: num(score.after) },
    keywords: list(o.keywords)
      .map(obj)
      .filter((k) => typeof k.term === "string")
      .slice(0, TAILOR_LIMITS.keywords)
      .map((k) => ({
        term: str(k.term, TAILOR_LIMITS.termMax),
        importance: k.importance === "preferred" ? ("preferred" as const) : ("required" as const),
        before: k.before === true,
        after: k.after === true,
      })),
    changes: list(o.changes)
      .map(obj)
      .slice(0, 100)
      .map((c) => ({
        section: (["summary", "experience", "projects", "skills", "order"] as const).find((s) => s === c.section) ?? "summary",
        label: str(c.label, 200),
        before: strings(c.before),
        after: strings(c.after),
        reason: str(c.reason, TAILOR_LIMITS.reasonMax),
      })),
  };
}

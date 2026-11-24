// AI writing help in the editor: tasks, what the model sees, and the
// sanitizing/applying of its answers. Pure and unit-tested; the Gemini calls
// are in lib/ai-writing-ai.ts and the server actions in lib/actions/ai-writing.ts.
//
// The model never edits the resume directly. It returns suggestions, the user
// picks what to keep, and the client applies them with the helpers below.
import { stripRich, toPlainContent } from "@/lib/rich-text";
import type { ResumeContent } from "@/lib/resume-sanitize";

export const AI_WRITE = {
  summaryOptions: 3,
  summaryMax: 900,
  bulletMax: 300,
  maxBullets: 8,
  maxSkills: 12,
  tailorBullets: 12,
  tailorKeywords: 10,
  reasonMax: 200,
} as const;

export type BulletSection = "experience" | "projects";

export type AiWriteTask =
  | { kind: "summary" }
  | { kind: "bullets"; section: BulletSection; index: number }
  | { kind: "skills" };

export type SkillSuggestion = { category: string; skill: string };

export type AiWriteResult =
  | { kind: "summary"; options: string[] }
  | { kind: "bullets"; bullets: string[] }
  | { kind: "skills"; skills: SkillSuggestion[] };

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Plain, single-spaced text: the model sometimes adds markdown or bullets */
const clean = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(CONTROL, "")
        .replace(/[*`]|__/g, "")
        .replace(/^\s*(?:[•\-–*]|\d+[.)])\s+/, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

/** Task from the client, or null if it isn't one we know. */
export function parseAiWriteTask(raw: unknown): AiWriteTask | null {
  const o = obj(raw);
  if (o.kind === "summary" || o.kind === "skills") return { kind: o.kind };
  if (o.kind === "bullets" && (o.section === "experience" || o.section === "projects")) {
    const index = Number(o.index);
    if (Number.isInteger(index) && index >= 0 && index < 100) return { kind: "bullets", section: o.section, index };
  }
  return null;
}

/** The entry a bullets task points at, in plain text, or null if it's gone. */
export function bulletTarget(content: ResumeContent, task: { section: BulletSection; index: number }) {
  if (task.section === "experience") {
    const e = content.experiences?.[task.index];
    if (!e) return null;
    const heading = [e.role?.trim(), e.company?.trim() && `at ${e.company.trim()}`, e.duration?.trim() && `(${e.duration.trim()})`]
      .filter(Boolean)
      .join(" ");
    return { heading, bullets: (e.bullets ?? []).map((b) => stripRich(b)).filter((b) => b.trim()) };
  }
  const p = content.projects?.[task.index];
  if (!p) return null;
  return {
    heading: [p.title?.trim(), p.duration?.trim() && `(${p.duration.trim()})`].filter(Boolean).join(" "),
    bullets: (p.description ?? []).map((b) => stripRich(b)).filter((b) => b.trim()),
  };
}

/**
 * Why a task can't run yet (shown before spending an AI action), or null.
 * The model needs something real to work from, or it would invent a resume.
 */
export function aiWriteBlocker(content: ResumeContent, task: AiWriteTask): string | null {
  const hasRoles = (content.experiences ?? []).some((e) => e.role?.trim() || e.company?.trim());
  const hasProjects = (content.projects ?? []).some((p) => p.title?.trim());
  const hasSkills = (content.skills ?? []).some((s) => s.value?.trim());
  if (task.kind === "bullets") {
    const target = bulletTarget(content, task);
    if (!target) return "That entry no longer exists.";
    if (!target.heading && !target.bullets.length) {
      return task.section === "experience" ? "Add the role title first." : "Add the project name first.";
    }
    return null;
  }
  if (task.kind === "summary" && !hasRoles && !hasProjects && !hasSkills) {
    return "Add some experience, projects or skills first, so the summary is about you.";
  }
  if (task.kind === "skills" && !hasRoles && !hasProjects && !content.professionalSummary?.trim()) {
    return "Add some experience, projects or a summary first.";
  }
  return null;
}

/** The resume as the model sees it: plain text, no contact details. */
export function resumeForPrompt(content: ResumeContent, opts: { bulletIds?: boolean } = {}): string {
  const c = toPlainContent(content);
  const out: string[] = [];
  if (c.professionalSummary?.trim()) out.push(`SUMMARY:\n${c.professionalSummary.trim()}`);
  const skills = (c.skills ?? []).filter((s) => s.value?.trim());
  if (skills.length) out.push(`SKILLS:\n${skills.map((s) => `${s.category ? `${s.category}: ` : ""}${s.value}`).join("\n")}`);
  const exp = c.experiences ?? [];
  if (exp.length) {
    out.push(
      "EXPERIENCE:\n" +
        exp
          .map((e, i) =>
            [
              `- ${[e.role, e.company && `at ${e.company}`, e.duration && `(${e.duration})`].filter(Boolean).join(" ")}`,
              ...(e.bullets ?? []).filter((b) => b.trim()).map((b, j) => `  ${opts.bulletIds ? `[e${i}.b${j}] ` : "• "}${b.trim()}`),
            ].join("\n"),
          )
          .join("\n"),
    );
  }
  const projects = c.projects ?? [];
  if (projects.length) {
    out.push(
      "PROJECTS:\n" +
        projects
          .map((p, i) =>
            [
              `- ${[p.title, p.duration && `(${p.duration})`].filter(Boolean).join(" ")}`,
              ...(p.description ?? []).filter((b) => b.trim()).map((b, j) => `  ${opts.bulletIds ? `[p${i}.b${j}] ` : "• "}${b.trim()}`),
            ].join("\n"),
          )
          .join("\n"),
    );
  }
  const edu = c.educations ?? [];
  if (edu.length) {
    out.push(`EDUCATION:\n${edu.map((e) => `- ${[e.course, e.major, e.schoolName, e.duration].filter(Boolean).join(", ")}`).join("\n")}`);
  }
  const certs = (c.certificates ?? []).filter((x) => x.title?.trim());
  if (certs.length) out.push(`CERTIFICATIONS:\n${certs.map((x) => `- ${x.title}`).join("\n")}`);
  return out.join("\n\n");
}

// ── Sanitizing model output ─────────────────────────────────────────────────

export function sanitizeSummaryOptions(raw: unknown): string[] {
  const list = Array.isArray(obj(raw).options) ? (obj(raw).options as unknown[]) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const s = clean(item, AI_WRITE.summaryMax);
    if (s.length < 20 || seen.has(key(s))) continue;
    seen.add(key(s));
    out.push(s);
    if (out.length === AI_WRITE.summaryOptions) break;
  }
  if (!out.length) throw new Error("No usable summary options.");
  return out;
}

export function sanitizeBullets(raw: unknown): string[] {
  const list = Array.isArray(obj(raw).bullets) ? (obj(raw).bullets as unknown[]) : [];
  const seen = new Set<string>();
  const out = list
    .map((b) => clean(b, AI_WRITE.bulletMax))
    .filter((b) => b.length >= 8 && !seen.has(key(b)) && (seen.add(key(b)), true))
    .slice(0, AI_WRITE.maxBullets);
  if (!out.length) throw new Error("No usable bullets.");
  return out;
}

/** Skill names already on the resume, normalized (values may be comma lists). */
export function existingSkillKeys(skills: ResumeContent["skills"]): Set<string> {
  return new Set(
    (skills ?? [])
      .flatMap((s) => (s.value ?? "").split(","))
      .map((v) => key(v))
      .filter(Boolean),
  );
}

export function sanitizeSkillSuggestions(raw: unknown, existing: ResumeContent["skills"], cap: number = AI_WRITE.maxSkills): SkillSuggestion[] {
  const list = Array.isArray(obj(raw).skills) ? (obj(raw).skills as unknown[]) : [];
  const have = existingSkillKeys(existing);
  const out: SkillSuggestion[] = [];
  for (const item of list) {
    const o = obj(item);
    const skill = clean(o.skill, 60).replace(/[,;]+/g, " ").trim();
    const category = clean(o.category, 40) || "Skills";
    const k = key(skill);
    if (!k || have.has(k)) continue;
    have.add(k);
    out.push({ category, skill });
    if (out.length === cap) break;
  }
  return out;
}

// ── Applying suggestions ────────────────────────────────────────────────────

/**
 * Add picked skills. A suggestion joins an existing category with the same
 * name (any case), else starts a new one. Already-present skills are skipped.
 */
export function addSkills(
  skills: ResumeContent["skills"],
  picks: SkillSuggestion[],
  newId: () => string = () => globalThis.crypto.randomUUID(),
): NonNullable<ResumeContent["skills"]> {
  const next = [...(skills ?? [])];
  const have = existingSkillKeys(next);
  for (const p of picks) {
    const k = key(p.skill);
    if (!k || have.has(k)) continue;
    have.add(k);
    const category = next.find((s) => s.category.trim().toLowerCase() === p.category.trim().toLowerCase())?.category ?? p.category;
    // Fill an empty placeholder row of that category before adding a new one
    const blank = next.findIndex((s) => s.category === category && !s.value.trim());
    if (blank >= 0) next[blank] = { ...next[blank], value: p.skill };
    else next.push({ id: newId(), category, value: p.skill });
  }
  return next;
}

/** Replace an entry's bullets (experience) or description (projects). */
export function setEntryBullets(content: ResumeContent, task: { section: BulletSection; index: number }, bullets: string[]): ResumeContent {
  if (task.section === "experience") {
    return { ...content, experiences: (content.experiences ?? []).map((e, i) => (i === task.index ? { ...e, bullets } : e)) };
  }
  return { ...content, projects: (content.projects ?? []).map((p, i) => (i === task.index ? { ...p, description: bullets } : p)) };
}

// ── Tailor to a job (Pro) ───────────────────────────────────────────────────

export type TailorBullet = {
  /** "e0.b1" = experiences[0].bullets[1]; "p2.b0" = projects[2].description[0] */
  id: string;
  section: BulletSection;
  entry: number;
  bullet: number;
  /** Plain text of the bullet when the suggestion was made */
  original: string;
  rewrite: string;
  reason: string;
};

export type TailorResult = {
  jobTitle: string;
  summary: string;
  bullets: TailorBullet[];
  /** Skills the job asks for that the resume doesn't list (user decides if true) */
  keywords: SkillSuggestion[];
};

const BULLET_ID = /^([ep])(\d{1,2})\.b(\d{1,2})$/;

/** Plain text of the bullet an id points at, or null. */
export function bulletAt(content: ResumeContent, id: string): { section: BulletSection; entry: number; bullet: number; text: string } | null {
  const m = BULLET_ID.exec(id);
  if (!m) return null;
  const section: BulletSection = m[1] === "e" ? "experience" : "projects";
  const entry = Number(m[2]);
  const bullet = Number(m[3]);
  // Same filtering as resumeForPrompt: ids count non-empty bullets only
  const list =
    section === "experience" ? content.experiences?.[entry]?.bullets : content.projects?.[entry]?.description;
  const nonEmpty = (list ?? []).map((b, i) => ({ b, i })).filter((x) => stripRich(x.b).trim());
  const hit = nonEmpty[bullet];
  if (!hit) return null;
  return { section, entry, bullet: hit.i, text: stripRich(hit.b).trim() };
}

export function sanitizeTailor(raw: unknown, content: ResumeContent): TailorResult {
  const o = obj(raw);
  const seen = new Set<string>();
  const bullets: TailorBullet[] = [];
  for (const item of Array.isArray(o.bullets) ? o.bullets : []) {
    const b = obj(item);
    const id = typeof b.id === "string" ? b.id.trim() : "";
    const at = bulletAt(content, id);
    const rewrite = clean(b.rewrite, AI_WRITE.bulletMax);
    // The original always comes from the resume, never from the model
    if (!at || seen.has(id) || rewrite.length < 8 || key(rewrite) === key(at.text)) continue;
    seen.add(id);
    bullets.push({ id, section: at.section, entry: at.entry, bullet: at.bullet, original: at.text, rewrite, reason: clean(b.reason, AI_WRITE.reasonMax) });
    if (bullets.length === AI_WRITE.tailorBullets) break;
  }
  const summary = clean(o.summary, AI_WRITE.summaryMax);
  const currentSummary = stripRich(content.professionalSummary).trim();
  return {
    jobTitle: clean(o.jobTitle, 120),
    summary: summary.length >= 20 && key(summary) !== key(currentSummary) ? summary : "",
    bullets,
    keywords: sanitizeSkillSuggestions({ skills: o.keywords }, content.skills, AI_WRITE.tailorKeywords),
  };
}

export type TailorPicks = { summary: boolean; bulletIds: string[]; keywords: SkillSuggestion[] };

/**
 * Apply the picked suggestions. A bullet the user changed after the
 * suggestion was made is left alone (and counted in `skipped`).
 */
export function applyTailor(content: ResumeContent, result: TailorResult, picks: TailorPicks) {
  let next = content;
  let applied = 0;
  let skipped = 0;
  if (picks.summary && result.summary) {
    next = { ...next, professionalSummary: result.summary };
    applied++;
  }
  const wanted = new Set(picks.bulletIds);
  for (const b of result.bullets) {
    if (!wanted.has(b.id)) continue;
    const list = b.section === "experience" ? next.experiences?.[b.entry]?.bullets : next.projects?.[b.entry]?.description;
    const current = list?.[b.bullet];
    if (current === undefined || stripRich(current).trim() !== b.original) {
      skipped++;
      continue;
    }
    const updated = list!.map((x, i) => (i === b.bullet ? b.rewrite : x));
    next = setEntryBullets(next, { section: b.section, index: b.entry }, updated);
    applied++;
  }
  if (picks.keywords.length) {
    const had = existingSkillKeys(next.skills);
    applied += new Set(picks.keywords.map((k) => key(k.skill)).filter((k) => k && !had.has(k))).size;
    next = { ...next, skills: addSkills(next.skills, picks.keywords) };
  }
  return { content: next, applied, skipped };
}

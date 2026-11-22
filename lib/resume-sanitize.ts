// Pure sanitizers for Gemini resume output (no server deps, unit-tested).
// Never trust the model's output shape: coerce every field to the jsonb types
// in config/schema.ts and add the ids + section order the editor needs.
import type { Resume } from "@/config/schema";

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

export function sanitizeAnalysis(raw: unknown): ResumeAnalysis {
  const a = obj(raw);
  const score = Math.round(Number(a.overallScore));
  if (!Number.isFinite(score)) throw new Error("Analysis is missing an overall score.");
  return {
    overallScore: Math.min(100, Math.max(1, score)),
    readability: text(a.readability) || "Good",
    keyKeywords: texts(a.keyKeywords),
    summary: text(a.summary),
    strengths: texts(a.strengths),
    weaknesses: texts(a.weaknesses),
    improvements: list(a.improvements)
      .map((i) => ({
        section: text(i.section),
        current: text(i.current),
        suggested: text(i.suggested),
        reason: text(i.reason),
      }))
      .filter((i) => i.suggested),
    gapsDetected: texts(a.gapsDetected),
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

/** Combined parse + analysis response: { content, analysis }. */
export function sanitizeParsedResume(raw: unknown) {
  const root = obj(raw);
  return {
    content: sanitizeContent(root.content),
    analysis: sanitizeAnalysis(root.analysis),
  };
}

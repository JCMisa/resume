// Pure rules for the resume editor (unit-tested in tests/resume-editor.test.ts).
// Unlike sanitizeContent() in lib/resume-sanitize.ts (for AI output, which
// drops incomplete entries), the editor keeps half-filled entries: the user
// is still typing them. Everything is length- and count-capped so a client
// can't store unbounded JSON.

import { DEFAULT_SECTION_ORDER, type ResumeContent } from "./resume-sanitize";

export const EDITOR_LIMITS = {
  short: 200, // names, roles, dates, labels
  medium: 500, // addresses, URLs
  long: 3000, // summary, bullets, descriptions
  items: 30, // entries per section
  bullets: 20, // bullets per entry
  links: 10,
} as const;

export const TITLE_MAX = 100;
export const DEFAULT_TITLE = "Untitled resume";

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : {});
const arr = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []);
// Strip control characters (keep tab/newline), cap length. Not trimmed: the
// user may be mid-word with a trailing space.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(CONTROL, "").slice(0, max) : "");
const optStr = (v: unknown, max: number) => str(v, max) || undefined;
const newId = () => globalThis.crypto.randomUUID();
const keepId = (v: unknown) => (typeof v === "string" && /^[\w-]{1,64}$/.test(v) ? v : newId());

const links = (v: unknown) =>
  arr(v, EDITOR_LIMITS.links).map((l) => {
    const o = obj(l);
    return { label: str(o.label, EDITOR_LIMITS.short), url: str(o.url, EDITOR_LIMITS.medium) };
  });
const lines = (v: unknown) => arr(v, EDITOR_LIMITS.bullets).map((b) => str(b, EDITOR_LIMITS.long));

/** Known section keys, each once; missing ones appended in default order. */
export function normalizeSectionOrder(order: unknown): string[] {
  const known = new Set(DEFAULT_SECTION_ORDER);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of Array.isArray(order) ? order : []) {
    if (typeof key === "string" && known.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  for (const key of DEFAULT_SECTION_ORDER) if (!seen.has(key)) out.push(key);
  return out;
}

/** Editor content from the client -> safe, complete ResumeContent. */
export function sanitizeEditorContent(raw: unknown): ResumeContent {
  const c = obj(raw);
  const p = obj(c.personalDetails);
  const { short, medium, long, items } = EDITOR_LIMITS;
  return {
    personalDetails: {
      name: str(p.name, short),
      phone: str(p.phone, short),
      email: str(p.email, short),
      address: str(p.address, medium),
      links: links(p.links),
    },
    professionalSummary: str(c.professionalSummary, long),
    skills: arr(c.skills, 60).map((s) => {
      const o = obj(s);
      return { id: keepId(o.id), category: str(o.category, short), value: str(o.value, short) };
    }),
    experiences: arr(c.experiences, items).map((e) => {
      const o = obj(e);
      return {
        id: keepId(o.id),
        company: str(o.company, short),
        role: str(o.role, short),
        duration: str(o.duration, short),
        bullets: lines(o.bullets),
      };
    }),
    projects: arr(c.projects, items).map((pr) => {
      const o = obj(pr);
      return {
        id: keepId(o.id),
        title: str(o.title, short),
        duration: str(o.duration, short),
        description: lines(o.description),
        links: links(o.links),
      };
    }),
    educations: arr(c.educations, items).map((ed) => {
      const o = obj(ed);
      return {
        id: keepId(o.id),
        schoolName: str(o.schoolName, short),
        course: str(o.course, short),
        major: optStr(o.major, short),
        duration: str(o.duration, short),
        gwa: optStr(o.gwa, short),
      };
    }),
    certificates: arr(c.certificates, items).map((ce) => {
      const o = obj(ce);
      return {
        id: keepId(o.id),
        title: str(o.title, short),
        issuedDate: str(o.issuedDate, short),
        expirationDate: optStr(o.expirationDate, short),
        description: optStr(o.description, long),
        links: links(o.links),
      };
    }),
    sectionOrder: normalizeSectionOrder(c.sectionOrder),
  };
}

/** A new, empty resume (name/email prefilled from the account when known). */
export function blankContent(prefill: { name?: string | null; email?: string | null } = {}): ResumeContent {
  return sanitizeEditorContent({
    personalDetails: { name: prefill.name ?? "", email: prefill.email ?? "", links: [] },
  });
}

/** Copy of another resume's content with fresh ids ("start from existing"). */
export function cloneContent(content: unknown): ResumeContent {
  const c = sanitizeEditorContent(content);
  const reId = <T extends { id: string }>(list: T[] | undefined) => (list ?? []).map((x) => ({ ...x, id: newId() }));
  return {
    ...c,
    skills: reId(c.skills),
    experiences: reId(c.experiences),
    projects: reId(c.projects),
    educations: reId(c.educations),
    certificates: reId(c.certificates),
  };
}

/** Trimmed, single-line, capped; empty -> fallback. */
export function normalizeResumeTitle(value: unknown, fallback = DEFAULT_TITLE): string {
  const t = typeof value === "string" ? value.replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, TITLE_MAX) : "";
  return t || fallback;
}

/** "Copy of <title>", without our upload suffixes. */
export function copyTitle(title: string): string {
  const base = title.replace(/\s*\((AI Analyzed|copy)\)\s*$/i, "").trim() || DEFAULT_TITLE;
  return normalizeResumeTitle(base.startsWith("Copy of ") ? base : `Copy of ${base}`);
}

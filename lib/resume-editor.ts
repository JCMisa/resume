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
  customSections: 5,
  customBody: 5000,
} as const;

export const CUSTOM_PREFIX = "custom:";
export const isCustomKey = (key: string) => key.startsWith(CUSTOM_PREFIX);
export const customKey = (id: string) => CUSTOM_PREFIX + id;
const TEXT_SCALES = ["sm", "md", "lg"] as const;

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

/**
 * Known section keys (standard + this resume's custom sections), each once;
 * missing ones appended (standard in default order, then custom).
 */
export function normalizeSectionOrder(order: unknown, customIds: string[] = []): string[] {
  const custom = customIds.map(customKey);
  const known = new Set([...DEFAULT_SECTION_ORDER, ...custom]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of Array.isArray(order) ? order : []) {
    if (typeof key === "string" && known.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  for (const key of [...DEFAULT_SECTION_ORDER, ...custom]) if (!seen.has(key)) out.push(key);
  return out;
}

/** Editor content from the client -> safe, complete ResumeContent. */
export function sanitizeEditorContent(raw: unknown): ResumeContent {
  const c = obj(raw);
  const p = obj(c.personalDetails);
  const { short, medium, long, items } = EDITOR_LIMITS;
  const customSections = arr(c.customSections, EDITOR_LIMITS.customSections).map((s) => {
    const o = obj(s);
    return { id: keepId(o.id), title: str(o.title, 80), body: str(o.body, EDITOR_LIMITS.customBody) };
  });
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
    customSections,
    design: sanitizeDesign(c.design),
    sectionOrder: normalizeSectionOrder(
      c.sectionOrder,
      customSections.map((s) => s.id),
    ),
  };
}

function sanitizeDesign(raw: unknown): NonNullable<ResumeContent["design"]> {
  const d = obj(raw);
  const out: NonNullable<ResumeContent["design"]> = {};
  if (TEXT_SCALES.includes(d.textScale as (typeof TEXT_SCALES)[number])) out.textScale = d.textScale as "sm" | "md" | "lg";
  if (typeof d.dividers === "boolean") out.dividers = d.dividers;
  const titles = obj(d.sectionTitles);
  const sectionTitles: Record<string, string> = {};
  for (const key of DEFAULT_SECTION_ORDER) {
    const t = str(titles[key], 60);
    if (t.trim()) sectionTitles[key] = t;
  }
  if (Object.keys(sectionTitles).length) out.sectionTitles = sectionTitles;
  return out;
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
    // Custom section ids are referenced by sectionOrder: keep them as they are
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

// ── Document-mode operations (pure; the editor applies them to its state) ──

export type EntrySection = "experience" | "projects" | "education" | "certificates";
const ENTRY_FIELD = {
  experience: "experiences",
  projects: "projects",
  education: "educations",
  certificates: "certificates",
} as const;

export function blankEntry(section: EntrySection) {
  const id = newId();
  switch (section) {
    case "experience":
      return { id, company: "", role: "", duration: "", bullets: [""] };
    case "projects":
      return { id, title: "", duration: "", description: [""], links: [] };
    case "education":
      return { id, schoolName: "", course: "", duration: "" };
    case "certificates":
      return { id, title: "", issuedDate: "", links: [] };
  }
}

type Entry = { id: string };
const entries = (content: ResumeContent, section: EntrySection) =>
  ((content[ENTRY_FIELD[section]] as Entry[] | undefined) ?? []) as Entry[];
const withEntries = (content: ResumeContent, section: EntrySection, list: Entry[]): ResumeContent => ({
  ...content,
  [ENTRY_FIELD[section]]: list,
});

export function addEntry(content: ResumeContent, section: EntrySection) {
  const entry = blankEntry(section);
  const list = entries(content, section);
  if (list.length >= EDITOR_LIMITS.items) return { content, id: null };
  return { content: withEntries(content, section, [...list, entry]), id: entry.id };
}

export function removeEntry(content: ResumeContent, section: EntrySection, id: string): ResumeContent {
  return withEntries(content, section, entries(content, section).filter((e) => e.id !== id));
}

export function moveEntry(content: ResumeContent, section: EntrySection, id: string, dir: -1 | 1): ResumeContent {
  const list = [...entries(content, section)];
  const i = list.findIndex((e) => e.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return content;
  [list[i], list[j]] = [list[j], list[i]];
  return withEntries(content, section, list);
}

export function addCustomSection(content: ResumeContent, title = "Custom section") {
  const list = content.customSections ?? [];
  if (list.length >= EDITOR_LIMITS.customSections) return { content, id: null };
  const id = newId();
  return {
    content: {
      ...content,
      customSections: [...list, { id, title, body: "" }],
      sectionOrder: [...content.sectionOrder, customKey(id)],
    },
    id,
  };
}

export function removeCustomSection(content: ResumeContent, id: string): ResumeContent {
  return {
    ...content,
    customSections: (content.customSections ?? []).filter((s) => s.id !== id),
    sectionOrder: content.sectionOrder.filter((k) => k !== customKey(id)),
  };
}

/** Skills as editable "Category: a, b" rows (document mode). */
export type SkillGroup = { category: string; values: string };

export function skillsToGroups(skills: ResumeContent["skills"]): SkillGroup[] {
  const groups: SkillGroup[] = [];
  for (const s of skills ?? []) {
    const g = groups.find((x) => x.category === s.category);
    if (g) g.values = g.values ? `${g.values}, ${s.value}` : s.value;
    else groups.push({ category: s.category, values: s.value });
  }
  return groups;
}

/** Rows back to items; ids kept by position so React keys stay stable. */
export function groupsToSkills(groups: SkillGroup[], previous: ResumeContent["skills"] = []) {
  const items = groups.flatMap((g) =>
    g.values
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((value) => ({ category: g.category, value })),
  );
  // A row with a category but no skills yet keeps one empty item, so it stays visible
  for (const g of groups) {
    if (!g.values.split(",").some((v) => v.trim())) items.push({ category: g.category, value: "" });
  }
  return items.map((it, i) => ({ id: previous[i]?.id ?? newId(), ...it }));
}

// Resume templates: ONE definition per template, read by both renderers
// (on-screen page: components/resume-templates/ResumeDocument.tsx, and PDF:
// ResumePdfDocument.tsx), so the editor preview and the download match.
// Pure (no React), unit-tested in tests/resume-templates.test.ts.
//
// All sizes are in points (1pt = 1/72in). The page is A4 (595 x 842pt); the
// HTML renderer uses CSS pt units so both renderers lay out the same.

import type { ResumeContent } from "./resume-sanitize";
import { stripRich } from "./rich-text";
export { safeLinkUrl } from "./rich-text";

export const TEMPLATE_IDS = ["classic", "modern", "compact", "executive", "studio", "elegant", "spotlight"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export const DEFAULT_TEMPLATE: TemplateId = "classic";

export const PAGE = { width: 595, height: 842 } as const; // A4 in pt

export type TemplateDef = {
  id: TemplateId;
  name: string;
  tagline: string;
  /** "pro" = designer template (Pro plan) */
  tier: "free" | "pro";
  /** Single column, real text, standard headings: parses cleanly in ATS */
  atsSafe: boolean;
  font: "sans" | "serif";
  size: { name: number; heading: number; body: number; meta: number };
  /** Page margin, gap between sections, gap between entries */
  spacing: { page: number; section: number; item: number };
  /**
   * style: "plain" text; "bar" = accent bar on the left; "band" = filled
   * accent block with white text (still real, selectable text)
   */
  header: { align: "center" | "left"; nameUpper: boolean; separator: string; style: "plain" | "bar" | "band" };
  /** bar: accent bar left of each section heading */
  heading: { upper: boolean; rule: boolean; letterSpacing: number; bar?: boolean };
  colors: { text: string; muted: string; accent: string; rule: string };
  lineHeight: number;
};

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  classic: {
    id: "classic",
    name: "Classic",
    tagline: "Centered header, clean rules. Safe for every industry.",
    tier: "free",
    atsSafe: true,
    font: "sans",
    size: { name: 20, heading: 10, body: 9.5, meta: 9 },
    spacing: { page: 40, section: 12, item: 8 },
    header: { align: "center", nameUpper: true, separator: "|", style: "plain" },
    heading: { upper: true, rule: true, letterSpacing: 0.8 },
    colors: { text: "#1c1917", muted: "#57534e", accent: "#1c1917", rule: "#d6d3d1" },
    lineHeight: 1.4,
  },
  modern: {
    id: "modern",
    name: "Modern",
    tagline: "Left-aligned with a navy accent. Great for tech and business.",
    tier: "free",
    atsSafe: true,
    font: "sans",
    size: { name: 22, heading: 10.5, body: 9.5, meta: 9 },
    spacing: { page: 42, section: 13, item: 8 },
    header: { align: "left", nameUpper: false, separator: "•", style: "bar" },
    heading: { upper: false, rule: true, letterSpacing: 0.2 },
    colors: { text: "#111827", muted: "#4b5563", accent: "#1e3a8a", rule: "#1e3a8a" },
    lineHeight: 1.45,
  },
  compact: {
    id: "compact",
    name: "Compact",
    tagline: "Serif and tight spacing. Fits a long career on one page.",
    tier: "free",
    atsSafe: true,
    font: "serif",
    size: { name: 18, heading: 9.5, body: 9, meta: 8.5 },
    spacing: { page: 32, section: 9, item: 5 },
    header: { align: "center", nameUpper: false, separator: "·", style: "plain" },
    heading: { upper: true, rule: true, letterSpacing: 1 },
    colors: { text: "#1c1917", muted: "#44403c", accent: "#1c1917", rule: "#a8a29e" },
    lineHeight: 1.3,
  },

  // ── Designer templates (Pro). Still one column of real text: ATS-safe.
  executive: {
    id: "executive",
    name: "Executive",
    tagline: "A deep navy header band and serif type. Confident and senior.",
    tier: "pro",
    atsSafe: true,
    font: "serif",
    size: { name: 24, heading: 10.5, body: 9.5, meta: 9 },
    spacing: { page: 40, section: 13, item: 8 },
    header: { align: "left", nameUpper: false, separator: "|", style: "band" },
    heading: { upper: true, rule: true, letterSpacing: 1 },
    colors: { text: "#0f172a", muted: "#475569", accent: "#0f2a4a", rule: "#cbd5e1" },
    lineHeight: 1.4,
  },
  studio: {
    id: "studio",
    name: "Studio",
    tagline: "Big name, teal accent bars. Modern and creative.",
    tier: "pro",
    atsSafe: true,
    font: "sans",
    size: { name: 26, heading: 10.5, body: 9.5, meta: 9 },
    spacing: { page: 42, section: 14, item: 8 },
    header: { align: "left", nameUpper: false, separator: "/", style: "bar" },
    heading: { upper: true, rule: false, letterSpacing: 1.2, bar: true },
    colors: { text: "#111827", muted: "#4b5563", accent: "#0f766e", rule: "#0f766e" },
    lineHeight: 1.45,
  },
  elegant: {
    id: "elegant",
    name: "Elegant",
    tagline: "Centered serif with wide-spaced headings in burgundy.",
    tier: "pro",
    atsSafe: true,
    font: "serif",
    size: { name: 22, heading: 9.5, body: 9.5, meta: 9 },
    spacing: { page: 44, section: 13, item: 8 },
    header: { align: "center", nameUpper: true, separator: "·", style: "plain" },
    heading: { upper: true, rule: true, letterSpacing: 2.2 },
    colors: { text: "#1c1917", muted: "#57534e", accent: "#7f1d1d", rule: "#7f1d1d" },
    lineHeight: 1.45,
  },
  spotlight: {
    id: "spotlight",
    name: "Spotlight",
    tagline: "A centered violet header band with accent bars. Stands out.",
    tier: "pro",
    atsSafe: true,
    font: "sans",
    size: { name: 24, heading: 10.5, body: 9.5, meta: 9 },
    spacing: { page: 38, section: 13, item: 8 },
    header: { align: "center", nameUpper: false, separator: "•", style: "band" },
    heading: { upper: false, rule: false, letterSpacing: 0.3, bar: true },
    colors: { text: "#111827", muted: "#4b5563", accent: "#5b21b6", rule: "#5b21b6" },
    lineHeight: 1.45,
  },
};

/** Designer (Pro) template id. */
export const isProTemplate = (id: unknown) => isTemplateId(id) && TEMPLATES[id].tier === "pro";

// ── Custom colours (Pro) ────────────────────────────────────────────────────

/** Swatches offered in the editor (any other colour is allowed too). */
export const ACCENT_PRESETS = [
  { name: "Ink", hex: "#1c1917" },
  { name: "Navy", hex: "#1e3a8a" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Emerald", hex: "#047857" },
  { name: "Burgundy", hex: "#9f1239" },
  { name: "Violet", hex: "#6d28d9" },
  { name: "Slate", hex: "#334155" },
  { name: "Rust", hex: "#c2410c" },
] as const;

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;
/** Text on white needs 4.5:1 (WCAG AA); the accent colours headings and links */
export const MIN_ACCENT_CONTRAST = 4.5;

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

/** WCAG contrast ratio of a colour against white. */
export function contrastOnWhite(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin(channel(hex, 0)) + 0.7152 * lin(channel(hex, 1)) + 0.0722 * lin(channel(hex, 2));
  return 1.05 / (l + 0.05);
}

/**
 * The colour itself if it's readable on white paper, else the same hue made
 * darker until it is (so a pale yellow becomes a readable mustard).
 */
export function readableAccent(hex: string): string {
  if (!HEX_COLOR.test(hex)) return "#1c1917";
  let [r, g, b] = [channel(hex, 0), channel(hex, 1), channel(hex, 2)];
  let out = toHex(r, g, b);
  for (let i = 0; i < 40 && contrastOnWhite(out) < MIN_ACCENT_CONTRAST; i++) {
    r *= 0.92;
    g *= 0.92;
    b *= 0.92;
    out = toHex(r, g, b);
  }
  return out;
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Stored value -> a real template (old resumes have none: Classic). */
export function resolveTemplate(value: unknown): TemplateDef {
  return TEMPLATES[isTemplateId(value) ? value : DEFAULT_TEMPLATE];
}

export const SECTION_TITLES: Record<string, string> = {
  summary: "Professional Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  certificates: "Certifications",
};

// ── Shared layout helpers (both renderers) ──────────────────────────────────

/** "Category: a, b" rows, keeping the order categories first appear in. */
export function groupSkills(skills: ResumeContent["skills"]) {
  const groups = new Map<string, string[]>();
  for (const s of skills ?? []) {
    const value = s.value?.trim();
    if (!value) continue;
    const category = s.category?.trim() || "Skills";
    groups.set(category, [...(groups.get(category) ?? []), value]);
  }
  return [...groups.entries()].map(([category, values]) => ({ category, values }));
}

/** Non-empty contact items for the header line. */
export function contactParts(personal: ResumeContent["personalDetails"]) {
  return [personal?.phone, personal?.email, personal?.address]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
}

const filled = (v?: string) => Boolean(v?.trim());

const TEXT_SCALE = { sm: 0.92, md: 1, lg: 1.08 } as const;

/**
 * The template with the resume's own look settings applied: text size,
 * divider lines, and (Pro) accent colour and font.
 */
export function effectiveTemplate(t: TemplateDef, design?: ResumeContent["design"]): TemplateDef {
  const k = TEXT_SCALE[design?.textScale ?? "md"];
  const round = (n: number) => Math.round(n * k * 4) / 4;
  const accent = design?.accent && HEX_COLOR.test(design.accent) ? readableAccent(design.accent) : null;
  return {
    ...t,
    font: design?.font ?? t.font,
    size: { name: round(t.size.name), heading: round(t.size.heading), body: round(t.size.body), meta: round(t.size.meta) },
    heading: { ...t.heading, rule: design?.dividers ?? t.heading.rule },
    colors: accent
      ? {
          ...t.colors,
          accent,
          // Coloured rules follow the accent; neutral grey rules stay grey
          rule: t.colors.rule.toLowerCase() === t.colors.accent.toLowerCase() ? accent : t.colors.rule,
        }
      : t.colors,
  };
}

/** Header colours: white text on the accent for a "band" header. */
export function headerColors(t: TemplateDef) {
  return t.header.style === "band"
    ? { background: t.colors.accent, name: "#ffffff", meta: "#f1f5f9", link: "#ffffff" }
    : { background: null, name: t.colors.text, meta: t.colors.muted, link: t.colors.accent };
}

/** Section headings are accent-coloured when decorated (rule or bar). */
export const headingColor = (t: TemplateDef) => (t.heading.rule || t.heading.bar ? t.colors.accent : t.colors.text);

/** Band padding / bar width, in pt (shared so all renderers match). */
export const HEADER_BAND_PAD = 14;
export const ACCENT_BAR = 3;

/** Whether a design uses Pro-only settings (custom colour or font). */
export const usesProDesign = (design?: ResumeContent["design"]) => Boolean(design?.accent || design?.font);

/** Heading for a section: the user's rename, a custom section's title, or the default. */
export function sectionTitle(content: ResumeContent, key: string): string {
  if (key.startsWith("custom:")) {
    const s = content.customSections?.find((c) => `custom:${c.id}` === key);
    return s?.title.trim() || "Custom section";
  }
  return content.design?.sectionTitles?.[key]?.trim() || SECTION_TITLES[key] || key;
}

/** Whether a section has anything to print (empty ones are skipped). */
export function sectionHasContent(content: ResumeContent, key: string): boolean {
  if (key.startsWith("custom:")) {
    const s = content.customSections?.find((c) => `custom:${c.id}` === key);
    return Boolean(s && stripRich(s.body).trim());
  }
  switch (key) {
    case "personal": {
      const p = content.personalDetails;
      return filled(p?.name) || contactParts(p).length > 0 || Boolean(p?.links?.some((l) => filled(l.url)));
    }
    case "summary":
      return filled(stripRich(content.professionalSummary));
    case "skills":
      return groupSkills(content.skills).length > 0;
    case "experience":
      return Boolean(content.experiences?.some((e) => filled(e.role) || filled(e.company)));
    case "projects":
      return Boolean(content.projects?.some((p) => filled(p.title)));
    case "education":
      return Boolean(content.educations?.some((e) => filled(e.schoolName) || filled(e.course)));
    case "certificates":
      return Boolean(content.certificates?.some((c) => filled(c.title)));
    default:
      return false;
  }
}

/** Sections to render, in the user's order, skipping empty ones. */
export function visibleSections(content: ResumeContent): string[] {
  return (content.sectionOrder ?? []).filter((key) => sectionHasContent(content, key));
}

/** Bullets with something in them. */
export const bulletsOf = (list: string[] | undefined) => (list ?? []).filter((b) => stripRich(b).trim());

/** Links with a URL; label falls back to the URL without the protocol. */
export function linksOf(list: { label: string; url: string }[] | undefined) {
  return (list ?? [])
    .filter((l) => filled(l.url))
    .map((l) => ({ url: l.url.trim(), label: l.label?.trim() || l.url.trim().replace(/^https?:\/\//, "") }));
}

// ── Sample content for template thumbnails ──────────────────────────────────

export const SAMPLE_CONTENT: ResumeContent = {
  personalDetails: {
    name: "John Carlo Misa",
    phone: "+1 555 0142",
    email: "johncarlo.misa@example.com",
    address: "Austin, TX",
    links: [{ label: "linkedin.com/in/johncarlomisa", url: "https://linkedin.com/in/johncarlomisa" }],
  },
  professionalSummary:
    "Product-minded software engineer with 6 years building web platforms used by 2M+ people. Led migrations that cut page load times by 40%.",
  skills: [
    { id: "s1", category: "Languages", value: "TypeScript" },
    { id: "s2", category: "Languages", value: "Python" },
    { id: "s3", category: "Frameworks", value: "React" },
    { id: "s4", category: "Frameworks", value: "Next.js" },
    { id: "s5", category: "Tools", value: "PostgreSQL" },
  ],
  experiences: [
    {
      id: "e1",
      company: "Northwind Labs",
      role: "Senior Software Engineer",
      duration: "2022 - Present",
      bullets: [
        "Led checkout rebuild in Next.js, lifting conversion by 12%.",
        "Mentored 4 engineers and introduced code review guidelines.",
      ],
    },
    {
      id: "e2",
      company: "Contoso",
      role: "Software Engineer",
      duration: "2019 - 2022",
      bullets: ["Built internal analytics dashboards used by 300 staff."],
    },
  ],
  projects: [],
  educations: [
    { id: "ed1", schoolName: "University of Texas", course: "B.S. Computer Science", duration: "2015 - 2019" },
  ],
  certificates: [],
  sectionOrder: ["personal", "summary", "skills", "experience", "projects", "education", "certificates"],
};

// Resume templates: ONE definition per template, read by both renderers
// (on-screen page: components/resume-templates/ResumeDocument.tsx, and PDF:
// ResumePdfDocument.tsx), so the editor preview and the download match.
// Pure (no React), unit-tested in tests/resume-templates.test.ts.
//
// All sizes are in points (1pt = 1/72in). The page is A4 (595 x 842pt); the
// HTML renderer uses CSS pt units so both renderers lay out the same.

import type { ResumeContent } from "./resume-sanitize";

export const TEMPLATE_IDS = ["classic", "modern", "compact"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];
export const DEFAULT_TEMPLATE: TemplateId = "classic";

export const PAGE = { width: 595, height: 842 } as const; // A4 in pt

export type TemplateDef = {
  id: TemplateId;
  name: string;
  tagline: string;
  /** Free templates for everyone; "pro" ones arrive with #33 */
  tier: "free" | "pro";
  /** Single column, real text, standard headings: parses cleanly in ATS */
  atsSafe: boolean;
  font: "sans" | "serif";
  size: { name: number; heading: number; body: number; meta: number };
  /** Page margin, gap between sections, gap between entries */
  spacing: { page: number; section: number; item: number };
  header: { align: "center" | "left"; nameUpper: boolean; separator: string };
  heading: { upper: boolean; rule: boolean; letterSpacing: number };
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
    header: { align: "center", nameUpper: true, separator: "|" },
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
    header: { align: "left", nameUpper: false, separator: "•" },
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
    header: { align: "center", nameUpper: false, separator: "·" },
    heading: { upper: true, rule: true, letterSpacing: 1 },
    colors: { text: "#1c1917", muted: "#44403c", accent: "#1c1917", rule: "#a8a29e" },
    lineHeight: 1.3,
  },
};

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

/** Whether a section has anything to print (empty ones are skipped). */
export function sectionHasContent(content: ResumeContent, key: string): boolean {
  switch (key) {
    case "personal": {
      const p = content.personalDetails;
      return filled(p?.name) || contactParts(p).length > 0 || Boolean(p?.links?.some((l) => filled(l.url)));
    }
    case "summary":
      return filled(content.professionalSummary);
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
export const bulletsOf = (list: string[] | undefined) => (list ?? []).map((b) => b.trim()).filter(Boolean);

/** Links with a URL; label falls back to the URL without the protocol. */
export function linksOf(list: { label: string; url: string }[] | undefined) {
  return (list ?? [])
    .filter((l) => filled(l.url))
    .map((l) => ({ url: l.url.trim(), label: l.label?.trim() || l.url.trim().replace(/^https?:\/\//, "") }));
}

/** Only http(s) and mailto links are made clickable. */
export function safeLinkUrl(url: string): string | null {
  const u = url.trim();
  if (/^mailto:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u)) return `https://${u}`;
  return null;
}

// ── Sample content for template thumbnails ──────────────────────────────────

export const SAMPLE_CONTENT: ResumeContent = {
  personalDetails: {
    name: "Alex Rivera",
    phone: "+1 555 0142",
    email: "alex.rivera@example.com",
    address: "Austin, TX",
    links: [{ label: "linkedin.com/in/alexrivera", url: "https://linkedin.com/in/alexrivera" }],
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

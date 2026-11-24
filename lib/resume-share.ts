// Pure rules for resume sharing and exports (unit-tested in
// tests/resume-share.test.ts). The public page is /r/<shareCode>.

import type { ResumeContent } from "./resume-sanitize";
import { contactParts, groupSkills, linksOf, sectionTitle, visibleSections } from "./resume-templates";
import { stripRich } from "./rich-text";

export const SHARE_CODE_LENGTH = 10;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // no 0/O, 1/l/I

export const isShareCode = (value: unknown): value is string =>
  typeof value === "string" && new RegExp(`^[${ALPHABET}]{${SHARE_CODE_LENGTH}}$`).test(value);

/** Random bytes -> share code (unbiased enough for 57 symbols from 256 via rejection). */
export function codeFromBytes(bytes: Uint8Array): string {
  let out = "";
  const limit = 256 - (256 % ALPHABET.length);
  for (const b of bytes) {
    if (b >= limit) continue;
    out += ALPHABET[b % ALPHABET.length];
    if (out.length === SHARE_CODE_LENGTH) break;
  }
  return out;
}

/** What the public page may show: phone and address removed when hidden. */
export function publicContent(content: ResumeContent, { hideContact }: { hideContact: boolean }): ResumeContent {
  if (!hideContact) return content;
  return { ...content, personalDetails: { ...content.personalDetails, phone: "", address: "" } };
}

/** One line for link previews and page titles: latest role, or the summary's first sentence. */
export function headline(content: ResumeContent): string {
  const job = content.experiences?.find((e) => e.role?.trim());
  if (job) return [job.role.trim(), job.company?.trim()].filter(Boolean).join(" at ");
  const summary = stripRich(content.professionalSummary).replace(/\s+/g, " ").trim();
  const first = summary.split(/(?<=[.!?])\s/)[0] ?? "";
  return first.length > 140 ? `${first.slice(0, 137)}…` : first;
}

/** Share intents (no third-party scripts: plain links each network supports). */
export function shareTargets(url: string, title: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    email: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n${url}`)}`,
  };
}

export function fileSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "resume";
}

/**
 * Plain-text resume (for pasting into application forms). Same sections and
 * order as the template, no formatting.
 */
export function resumeToPlainText(content: ResumeContent): string {
  const lines: string[] = [];
  const p = content.personalDetails;
  if (p?.name?.trim()) lines.push(p.name.trim().toUpperCase());
  const contact = contactParts(p);
  if (contact.length) lines.push(contact.join(" | "));
  const links = linksOf(p?.links);
  if (links.length) lines.push(links.map((l) => l.url).join(" | "));

  const bullet = (s: string) => `- ${stripRich(s).trim()}`;
  const head = (title: string, date?: string) => [title, date?.trim()].filter(Boolean).join(" | ");

  for (const key of visibleSections(content)) {
    if (key === "personal") continue;
    const block: string[] = [];
    if (key.startsWith("custom:")) {
      const c = content.customSections?.find((x) => `custom:${x.id}` === key);
      if (c) block.push(stripRich(c.body).replace(/^• /gm, "- ").trim());
    } else if (key === "summary") {
      block.push(stripRich(content.professionalSummary).trim());
    } else if (key === "skills") {
      for (const g of groupSkills(content.skills)) block.push(`${g.category}: ${g.values.join(", ")}`);
    } else if (key === "experience") {
      for (const e of content.experiences ?? []) {
        if (!e.role?.trim() && !e.company?.trim()) continue;
        block.push(head([e.role, e.company].filter((v) => v?.trim()).join(", "), e.duration));
        for (const b of e.bullets ?? []) if (stripRich(b).trim()) block.push(bullet(b));
      }
    } else if (key === "projects") {
      for (const pr of content.projects ?? []) {
        if (!pr.title?.trim()) continue;
        block.push(head(pr.title, pr.duration));
        for (const b of pr.description ?? []) if (stripRich(b).trim()) block.push(bullet(b));
        for (const l of linksOf(pr.links)) block.push(l.url);
      }
    } else if (key === "education") {
      for (const ed of content.educations ?? []) {
        if (!ed.schoolName?.trim() && !ed.course?.trim()) continue;
        block.push(head(ed.schoolName || ed.course, ed.duration));
        const detail = [ed.schoolName?.trim() ? ed.course : "", ed.major, ed.gwa ? `GWA: ${ed.gwa}` : ""].filter((v) => v?.trim()).join(", ");
        if (detail) block.push(detail);
      }
    } else if (key === "certificates") {
      for (const c of content.certificates ?? []) {
        if (!c.title?.trim()) continue;
        block.push(head(c.title, [c.issuedDate, c.expirationDate].filter((v) => v?.trim()).join(" - ")));
        if (stripRich(c.description).trim()) block.push(stripRich(c.description).trim());
      }
    }
    if (block.length) lines.push("", sectionTitle(content, key).toUpperCase(), ...block);
  }
  return lines.join("\n").trim() + "\n";
}

/** Link-preview fetchers and crawlers: don't count them as views. */
const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|slack|discord|whatsapp|telegram|linkedin|embedly|skype|headless|lighthouse/i;
export const isLikelyBot = (userAgent: string | null | undefined) => !userAgent || BOT_UA.test(userAgent);

import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
  type ParagraphChild,
} from "docx";
import type { ResumeContent } from "@/lib/resume-sanitize";
import {
  PAGE,
  bulletsOf,
  contactParts,
  effectiveTemplate,
  groupSkills,
  linksOf,
  safeLinkUrl,
  sectionTitle,
  visibleSections,
  type TemplateDef,
} from "@/lib/resume-templates";
import { nonEmptyBlocks, parseBlocks, parseInline, stripRich, type Span } from "@/lib/rich-text";

// Word (.docx) export built from the same TemplateDef as the screen and PDF
// renderers: real headings, bullets, tab-aligned dates and live links, so the
// file stays editable and ATS-readable. Uses fonts every Word install has.

const FONT = { sans: "Arial", serif: "Times New Roman" } as const;
const twip = (pt: number) => Math.round(pt * 20); // 1pt = 20 twips
const half = (pt: number) => Math.round(pt * 2); // font sizes are half-points
const hex = (c: string) => c.replace("#", "");

export async function buildResumeDocx(content: ResumeContent, template: TemplateDef, title: string): Promise<Buffer> {
  const t = effectiveTemplate(template, content.design);
  const { colors, size, spacing } = t;
  const margin = twip(spacing.page);
  const contentWidth = twip(PAGE.width) - margin * 2;
  const lineSpacing = Math.round(240 * t.lineHeight); // "auto" line rule: 240 = single

  const runs = (spans: Span[], base: { size?: number; color?: string; bold?: boolean } = {}): ParagraphChild[] =>
    spans.map((s) => {
      const run = new TextRun({
        text: s.text,
        bold: base.bold || s.bold,
        italics: s.italic,
        underline: s.underline || s.href ? {} : undefined,
        size: base.size,
        color: s.href ? hex(colors.accent) : s.bold ? hex(colors.text) : base.color,
      });
      const href = s.href ? safeLinkUrl(s.href) : null;
      return href ? new ExternalHyperlink({ link: href, children: [run] }) : run;
    });

  const para = (children: ParagraphChild[], opts: { after?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bullet?: boolean; keepNext?: boolean } = {}) =>
    new Paragraph({
      children,
      alignment: opts.align,
      keepNext: opts.keepNext,
      spacing: { after: twip(opts.after ?? 0), line: lineSpacing },
      numbering: opts.bullet ? { reference: "bullets", level: 0 } : undefined,
    });

  const headerAlign = t.header.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const sep = ` ${t.header.separator} `;

  const linkRuns = (list: { label: string; url: string }[] | undefined): ParagraphChild[] => {
    const out: ParagraphChild[] = [];
    linksOf(list).forEach((l, i) => {
      if (i > 0) out.push(new TextRun({ text: sep, size: half(size.meta) }));
      const href = safeLinkUrl(l.url);
      const run = new TextRun({ text: l.label, size: half(size.meta), color: hex(colors.accent), underline: {} });
      out.push(href ? new ExternalHyperlink({ link: href, children: [run] }) : run);
    });
    return out;
  };

  const heading = (text: string) =>
    new Paragraph({
      keepNext: true,
      spacing: { before: twip(spacing.section), after: twip(4) },
      border: t.heading.rule ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(colors.rule), space: 2 } } : undefined,
      children: [
        new TextRun({
          text: t.heading.upper ? text.toUpperCase() : text,
          bold: true,
          size: half(size.heading),
          color: hex(t.heading.rule ? colors.accent : colors.text),
          characterSpacing: Math.round(t.heading.letterSpacing * 20),
        }),
      ],
    });

  // Title (bold) <tab> date, then an optional muted subtitle line
  const entryHead = (title: string, date?: string, subtitle?: string): Paragraph[] => {
    const out = [
      new Paragraph({
        keepNext: true,
        spacing: { before: twip(spacing.item / 2), line: lineSpacing },
        tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
        children: [
          new TextRun({ text: title, bold: true, color: hex(colors.text) }),
          ...(date?.trim() ? [new TextRun({ text: `\t${date}`, size: half(size.meta), color: hex(colors.muted) })] : []),
        ],
      }),
    ];
    if (subtitle?.trim()) out.push(para([new TextRun({ text: subtitle, size: half(size.meta), color: hex(colors.muted) })], { keepNext: true }));
    return out;
  };

  const bullets = (items: string[]) => items.map((b) => para(runs(parseInline(b), { color: hex(colors.muted) }), { bullet: true }));

  const children: Paragraph[] = [];
  const p = content.personalDetails;
  if (p?.name?.trim()) {
    children.push(
      para(
        [
          new TextRun({
            text: t.header.nameUpper ? p.name.trim().toUpperCase() : p.name.trim(),
            bold: true,
            size: half(size.name),
            color: hex(colors.text),
          }),
        ],
        { align: headerAlign },
      ),
    );
  }
  const contacts = contactParts(p);
  if (contacts.length) children.push(para([new TextRun({ text: contacts.join(sep), size: half(size.meta) })], { align: headerAlign }));
  const headerLinks = linkRuns(p?.links);
  if (headerLinks.length) children.push(para(headerLinks, { align: headerAlign }));

  for (const key of visibleSections(content)) {
    if (key === "personal") continue;
    children.push(heading(sectionTitle(content, key)));
    if (key.startsWith("custom:")) {
      const c = content.customSections?.find((x) => `custom:${x.id}` === key);
      for (const b of nonEmptyBlocks(parseBlocks(c?.body ?? "", { lists: true }))) {
        children.push(para(runs(b.spans, { color: hex(colors.muted) }), { bullet: b.type === "bullet" }));
      }
    } else if (key === "summary") {
      for (const b of nonEmptyBlocks(parseBlocks(content.professionalSummary ?? ""))) children.push(para(runs(b.spans, { color: hex(colors.muted) })));
    } else if (key === "skills") {
      for (const g of groupSkills(content.skills)) {
        children.push(para([new TextRun({ text: `${g.category}: `, bold: true, color: hex(colors.text) }), new TextRun({ text: g.values.join(", ") })]));
      }
    } else if (key === "experience") {
      for (const e of content.experiences ?? []) {
        if (!e.role?.trim() && !e.company?.trim()) continue;
        children.push(...entryHead(e.role?.trim() || e.company, e.duration, e.role?.trim() ? e.company : undefined), ...bullets(bulletsOf(e.bullets)));
      }
    } else if (key === "projects") {
      for (const pr of content.projects ?? []) {
        if (!pr.title?.trim()) continue;
        children.push(...entryHead(pr.title, pr.duration), ...bullets(bulletsOf(pr.description)));
        const links = linkRuns(pr.links);
        if (links.length) children.push(para(links));
      }
    } else if (key === "education") {
      for (const ed of content.educations ?? []) {
        if (!ed.schoolName?.trim() && !ed.course?.trim()) continue;
        const detail = [ed.course, ed.major, ed.gwa?.trim() ? `GWA: ${ed.gwa}` : ""].filter((v) => v?.trim()).join(" · ");
        children.push(...entryHead(ed.schoolName?.trim() || ed.course, ed.duration, ed.schoolName?.trim() ? detail : undefined));
      }
    } else if (key === "certificates") {
      for (const c of content.certificates ?? []) {
        if (!c.title?.trim()) continue;
        children.push(...entryHead(c.title, [c.issuedDate, c.expirationDate].filter((v) => v?.trim()).join(" - ")));
        if (stripRich(c.description).trim()) children.push(para(runs(parseInline(c.description!), { color: hex(colors.muted) })));
        const links = linkRuns(c.links);
        if (links.length) children.push(para(links));
      }
    }
  }

  const doc = new Document({
    creator: "ResuMe",
    title,
    styles: {
      default: {
        document: { run: { font: FONT[t.font], size: half(size.body), color: hex(colors.muted) } },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 220 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: twip(PAGE.width), height: twip(PAGE.height) },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

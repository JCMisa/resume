import React from "react";
import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "@/lib/resume-sanitize";
import {
  ACCENT_BAR,
  HEADER_BAND_PAD,
  bulletsOf,
  contactParts,
  effectiveTemplate,
  headerColors,
  headingColor,
  groupSkills,
  linksOf,
  safeLinkUrl,
  sectionTitle,
  visibleSections,
  type TemplateDef,
} from "@/lib/resume-templates";
import { nonEmptyBlocks, parseBlocks, parseInline, stripRich, type Span } from "@/lib/rich-text";

// PDF renderer for a resume template (@react-pdf/renderer). Mirrors
// ResumeDocument.tsx: same TemplateDef (+ design settings), same pt sizes.
// Uses the PDF standard fonts (Helvetica / Times, with their bold and italic
// variants), so nothing is downloaded and the text stays real, selectable
// text that ATS can parse.

const FONTS = {
  sans: { regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique", boldItalic: "Helvetica-BoldOblique" },
  serif: { regular: "Times-Roman", bold: "Times-Bold", italic: "Times-Italic", boldItalic: "Times-BoldItalic" },
} as const;

export default function ResumePdfDocument({
  content,
  template,
  title,
}: {
  content: ResumeContent;
  template: TemplateDef;
  title?: string;
}) {
  const t = effectiveTemplate(template, content.design);
  const { colors, size, spacing } = t;
  const font = FONTS[t.font];
  const hc = headerColors(t);
  const s = StyleSheet.create({
    page: {
      padding: spacing.page,
      fontFamily: font.regular,
      fontSize: size.body,
      lineHeight: t.lineHeight,
      color: colors.muted,
      backgroundColor: "#ffffff",
    },
    bold: { fontFamily: font.bold, color: colors.text },
    meta: { fontSize: size.meta, color: colors.muted },
    section: { marginBottom: spacing.section },
    heading: {
      fontFamily: font.bold,
      fontSize: size.heading,
      textTransform: t.heading.upper ? "uppercase" : "none",
      letterSpacing: t.heading.letterSpacing,
      color: headingColor(t),
      borderBottomWidth: t.heading.rule ? 0.75 : 0,
      borderBottomColor: colors.rule,
      ...(t.heading.bar ? { borderLeftWidth: ACCENT_BAR, borderLeftColor: colors.accent, paddingLeft: 6 } : {}),
      paddingBottom: 2,
      marginBottom: 4,
    },
    entry: { marginBottom: spacing.item },
    entryHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    bulletRow: { flexDirection: "row", marginTop: 1, paddingLeft: 4 },
    bulletDot: { width: 8 },
    bulletText: { flex: 1 },
    link: { color: colors.accent, textDecoration: "underline" },
    headerLink: { color: hc.link, textDecoration: "underline" },
  });

  // Inline markup -> nested <Text> runs with the right font variant
  const spans = (list: Span[]) =>
    list.map((sp, i) => {
      const family = sp.bold && sp.italic ? font.boldItalic : sp.bold ? font.bold : sp.italic ? font.italic : undefined;
      const style = {
        ...(family ? { fontFamily: family } : {}),
        ...(sp.bold ? { color: colors.text } : {}),
        ...(sp.underline ? { textDecoration: "underline" as const } : {}),
      };
      const href = sp.href ? safeLinkUrl(sp.href) : null;
      return href ? (
        <Link key={i} src={href} style={[s.link, style]}>
          {sp.text}
        </Link>
      ) : (
        <Text key={i} style={style}>
          {sp.text}
        </Text>
      );
    });

  const richBlocks = (value: string, lists: boolean) =>
    nonEmptyBlocks(parseBlocks(value, { lists })).map((b, i) =>
      b.type === "bullet" ? (
        <View key={i} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{spans(b.spans)}</Text>
        </View>
      ) : (
        <Text key={i}>{spans(b.spans)}</Text>
      ),
    );

  const entryHead = (title: string, date?: string, subtitle?: string) => (
    <>
      <View style={s.entryHead}>
        <Text style={[s.bold, { flex: 1, paddingRight: 8 }]}>{title}</Text>
        {date?.trim() ? <Text style={s.meta}>{date}</Text> : null}
      </View>
      {subtitle?.trim() ? <Text style={s.meta}>{subtitle}</Text> : null}
    </>
  );

  const bullets = (items: string[]) =>
    items.map((b, i) => (
      <View key={i} style={s.bulletRow} wrap={false}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>{spans(parseInline(b))}</Text>
      </View>
    ));

  const linkRow = (list: { label: string; url: string }[] | undefined, align: "left" | "center" = "left", inHeader = false) => {
    const items = linksOf(list);
    if (!items.length) return null;
    return (
      <Text style={[s.meta, { marginTop: 2, textAlign: align }, inHeader ? { color: hc.meta } : {}]}>
        {items.map((l, i) => {
          const href = safeLinkUrl(l.url);
          return (
            <React.Fragment key={i}>
              {i > 0 ? ` ${t.header.separator} ` : ""}
              {href ? (
                <Link src={href} style={inHeader ? s.headerLink : s.link}>
                  {l.label}
                </Link>
              ) : (
                l.label
              )}
            </React.Fragment>
          );
        })}
      </Text>
    );
  };

  const renderSection = (key: string) => {
    if (key.startsWith("custom:")) {
      const c = content.customSections?.find((x) => `custom:${x.id}` === key);
      return c ? richBlocks(c.body, true) : null;
    }
    switch (key) {
      case "summary":
        return richBlocks(content.professionalSummary ?? "", false);
      case "skills":
        return groupSkills(content.skills).map((g) => (
          <Text key={g.category} style={{ marginBottom: 1 }}>
            <Text style={s.bold}>{g.category}: </Text>
            {g.values.join(", ")}
          </Text>
        ));
      case "experience":
        return (content.experiences ?? [])
          .filter((e) => e.role?.trim() || e.company?.trim())
          .map((e) => (
            <View key={e.id} style={s.entry}>
              {entryHead(e.role?.trim() || e.company, e.duration, e.role?.trim() ? e.company : undefined)}
              {bullets(bulletsOf(e.bullets))}
            </View>
          ));
      case "projects":
        return (content.projects ?? [])
          .filter((p) => p.title?.trim())
          .map((p) => (
            <View key={p.id} style={s.entry}>
              {entryHead(p.title, p.duration)}
              {bullets(bulletsOf(p.description))}
              {linkRow(p.links)}
            </View>
          ));
      case "education":
        return (content.educations ?? [])
          .filter((e) => e.schoolName?.trim() || e.course?.trim())
          .map((e) => {
            const detail = [e.course, e.major, e.gwa?.trim() ? `GWA: ${e.gwa}` : ""].filter((v) => v?.trim()).join(" · ");
            return (
              <View key={e.id} style={s.entry} wrap={false}>
                {entryHead(e.schoolName?.trim() || e.course, e.duration, e.schoolName?.trim() ? detail : undefined)}
              </View>
            );
          });
      case "certificates":
        return (content.certificates ?? [])
          .filter((c) => c.title?.trim())
          .map((c) => (
            <View key={c.id} style={s.entry} wrap={false}>
              {entryHead(c.title, [c.issuedDate, c.expirationDate].filter((v) => v?.trim()).join(" - "))}
              {stripRich(c.description).trim() ? (
                <Text style={{ marginTop: 1 }}>{spans(parseInline(c.description!))}</Text>
              ) : null}
              {linkRow(c.links)}
            </View>
          ));
      default:
        return null;
    }
  };

  const personal = content.personalDetails;
  const name = personal?.name?.trim();
  const contacts = contactParts(personal);
  const left = t.header.align === "left";

  return (
    <Document title={title || name || "Resume"} author={name || undefined} creator="ResuMe" producer="ResuMe">
      <Page size="A4" style={s.page}>
        {(name || contacts.length > 0) && (
          <View
            style={{
              marginBottom: spacing.section,
              ...(t.header.style === "bar" ? { borderLeftWidth: ACCENT_BAR, borderLeftColor: colors.accent, paddingLeft: 8 } : {}),
              ...(hc.background ? { backgroundColor: hc.background, padding: HEADER_BAND_PAD, borderRadius: 4 } : {}),
            }}
          >
            {name ? (
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: size.name,
                  color: hc.name,
                  textAlign: t.header.align,
                  textTransform: t.header.nameUpper ? "uppercase" : "none",
                  letterSpacing: t.header.nameUpper ? 0.5 : 0,
                  lineHeight: 1.15,
                }}
              >
                {name}
              </Text>
            ) : null}
            {contacts.length > 0 ? (
              <Text style={[s.meta, { marginTop: 3, textAlign: t.header.align, color: hc.meta }]}>
                {contacts.join(` ${t.header.separator} `)}
              </Text>
            ) : null}
            {linkRow(personal?.links, left ? "left" : "center", true)}
          </View>
        )}

        {visibleSections(content)
          .filter((key) => key !== "personal")
          .map((key) => (
            <View key={key} style={s.section}>
              <Text style={s.heading} minPresenceAhead={24}>
                {sectionTitle(content, key)}
              </Text>
              {renderSection(key)}
            </View>
          ))}
      </Page>
    </Document>
  );
}

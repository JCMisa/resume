import type { CSSProperties } from "react";
import { ACCENT_BAR, HEADER_BAND_PAD, PAGE, headerColors, headingColor, type TemplateDef } from "@/lib/resume-templates";

// Shared on-screen styles for a template (read-only ResumeDocument and the
// editable document mode). Sizes in pt to match the PDF renderer.

export const FONT_STACK = {
  sans: 'Helvetica, Arial, "Liberation Sans", sans-serif',
  serif: '"Times New Roman", Times, "Liberation Serif", serif',
} as const;

export const pt = (n: number) => `${n}pt`;
export const PLACEHOLDER = "#a8a29e";

export function docStyles(t: TemplateDef) {
  const { colors, size, spacing } = t;
  const hc = headerColors(t);
  const s = {
    page: {
      width: pt(PAGE.width),
      minHeight: pt(PAGE.height),
      padding: pt(spacing.page),
      boxSizing: "border-box",
      background: "#ffffff",
      color: colors.muted,
      fontFamily: FONT_STACK[t.font],
      fontSize: pt(size.body),
      lineHeight: t.lineHeight,
      textAlign: "left",
      overflowWrap: "anywhere",
    },
    header: {
      textAlign: t.header.align,
      marginBottom: pt(spacing.section),
      color: hc.meta,
      ...(t.header.style === "bar" ? { borderLeft: `${pt(ACCENT_BAR)} solid ${colors.accent}`, paddingLeft: pt(8) } : {}),
      ...(t.header.style === "band"
        ? { background: hc.background!, padding: pt(HEADER_BAND_PAD), borderRadius: pt(4) }
        : {}),
    },
    name: {
      fontSize: pt(size.name),
      fontWeight: 700,
      color: hc.name,
      textTransform: t.header.nameUpper ? "uppercase" : "none",
      letterSpacing: t.header.nameUpper ? pt(0.5) : undefined,
      lineHeight: 1.15,
    },
    contactRow: { fontSize: pt(size.meta), marginTop: pt(3) },
    linkRow: { fontSize: pt(size.meta), marginTop: pt(2) },
    section: { marginBottom: pt(spacing.section) },
    heading: {
      fontSize: pt(size.heading),
      fontWeight: 700,
      textTransform: t.heading.upper ? "uppercase" : "none",
      letterSpacing: pt(t.heading.letterSpacing),
      color: headingColor(t),
      borderBottom: t.heading.rule ? `0.75pt solid ${colors.rule}` : "none",
      ...(t.heading.bar ? { borderLeft: `${pt(ACCENT_BAR)} solid ${colors.accent}`, paddingLeft: pt(6) } : {}),
      paddingBottom: pt(2),
      marginBottom: pt(4),
    },
    entry: { marginBottom: pt(spacing.item) },
    entryHead: { display: "flex", justifyContent: "space-between", gap: pt(8), alignItems: "baseline" },
    entryTitle: { fontWeight: 700, color: colors.text },
    date: { fontSize: pt(size.meta), color: colors.muted, whiteSpace: "nowrap" },
    subtitle: { fontSize: pt(size.meta), color: colors.muted },
    bulletList: { margin: `${pt(2)} 0 0`, paddingLeft: pt(12), listStyleType: "disc" },
    bullet: { marginBottom: pt(1) },
    paragraph: { margin: 0 },
    link: { color: colors.accent, textDecoration: "underline" },
    headerLink: { color: hc.link, textDecoration: "underline" },
    strong: { fontWeight: 700, color: colors.text },
  } satisfies Record<string, CSSProperties>;
  return s;
}

import React from "react";
import type { ResumeContent } from "@/lib/resume-sanitize";
import {
  PAGE,
  SECTION_TITLES,
  bulletsOf,
  contactParts,
  groupSkills,
  linksOf,
  safeLinkUrl,
  visibleSections,
  type TemplateDef,
} from "@/lib/resume-templates";

// On-screen renderer for a resume template (editor preview, thumbnails,
// later the public share page). Mirrors ResumePdfDocument.tsx: both read the
// same TemplateDef, and sizes are in pt so the layouts match.
// Always a white "paper" page, regardless of the app's dark mode.

const FONT_STACK = {
  sans: 'Helvetica, Arial, "Liberation Sans", sans-serif',
  serif: '"Times New Roman", Times, "Liberation Serif", serif',
} as const;

const pt = (n: number) => `${n}pt`;

function Link({ url, children, color }: { url: string; children: React.ReactNode; color: string }) {
  const href = safeLinkUrl(url);
  if (!href) return <span>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" style={{ color, textDecoration: "underline" }}>
      {children}
    </a>
  );
}

export default function ResumeDocument({
  content,
  template: t,
  placeholders = false,
}: {
  content: ResumeContent;
  template: TemplateDef;
  /** Editor only: show "Your Name" etc. while the resume is empty */
  placeholders?: boolean;
}) {
  const { colors, size, spacing } = t;
  const sections = visibleSections(content);
  const personal = content.personalDetails;
  const name = personal?.name?.trim();

  const heading = (key: string) => (
    <div
      style={{
        fontSize: pt(size.heading),
        fontWeight: 700,
        textTransform: t.heading.upper ? "uppercase" : "none",
        letterSpacing: pt(t.heading.letterSpacing),
        color: t.heading.rule ? colors.accent : colors.text,
        borderBottom: t.heading.rule ? `0.75pt solid ${colors.rule}` : "none",
        paddingBottom: pt(2),
        marginBottom: pt(4),
      }}
    >
      {SECTION_TITLES[key]}
    </div>
  );

  // Title (bold) + right-aligned date row used by every timeline entry
  const entryHead = (title: React.ReactNode, date?: string, subtitle?: React.ReactNode) => (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: pt(8), alignItems: "baseline" }}>
        <div style={{ fontWeight: 700, color: colors.text }}>{title}</div>
        {date?.trim() && (
          <div style={{ fontSize: pt(size.meta), color: colors.muted, whiteSpace: "nowrap" }}>{date}</div>
        )}
      </div>
      {subtitle && <div style={{ fontSize: pt(size.meta), color: colors.muted }}>{subtitle}</div>}
    </>
  );

  const bulletList = (items: string[]) =>
    items.length > 0 && (
      <ul style={{ margin: `${pt(2)} 0 0`, paddingLeft: pt(12), listStyleType: "disc" }}>
        {items.map((b, i) => (
          <li key={i} style={{ marginBottom: pt(1) }}>
            {b}
          </li>
        ))}
      </ul>
    );

  const linkRow = (list: { label: string; url: string }[] | undefined) => {
    const items = linksOf(list);
    if (!items.length) return null;
    return (
      <div style={{ fontSize: pt(size.meta), marginTop: pt(2) }}>
        {items.map((l, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: colors.muted }}> {t.header.separator} </span>}
            <Link url={l.url} color={colors.accent}>
              {l.label}
            </Link>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderSection = (key: string) => {
    switch (key) {
      case "personal":
        return null; // rendered as the header
      case "summary":
        return <p style={{ margin: 0, whiteSpace: "pre-line" }}>{content.professionalSummary}</p>;
      case "skills":
        return (
          <div>
            {groupSkills(content.skills).map((g) => (
              <div key={g.category} style={{ marginBottom: pt(1) }}>
                <span style={{ fontWeight: 700, color: colors.text }}>{g.category}: </span>
                {g.values.join(", ")}
              </div>
            ))}
          </div>
        );
      case "experience":
        return (content.experiences ?? [])
          .filter((e) => e.role?.trim() || e.company?.trim())
          .map((e) => (
            <div key={e.id} style={{ marginBottom: pt(spacing.item) }}>
              {entryHead(e.role?.trim() || e.company, e.duration, e.role?.trim() ? e.company : undefined)}
              {bulletList(bulletsOf(e.bullets))}
            </div>
          ));
      case "projects":
        return (content.projects ?? [])
          .filter((p) => p.title?.trim())
          .map((p) => (
            <div key={p.id} style={{ marginBottom: pt(spacing.item) }}>
              {entryHead(p.title, p.duration)}
              {bulletList(bulletsOf(p.description))}
              {linkRow(p.links)}
            </div>
          ));
      case "education":
        return (content.educations ?? [])
          .filter((e) => e.schoolName?.trim() || e.course?.trim())
          .map((e) => {
            const detail = [e.course, e.major, e.gwa?.trim() ? `GWA: ${e.gwa}` : ""].filter((v) => v?.trim()).join(" · ");
            return (
              <div key={e.id} style={{ marginBottom: pt(spacing.item) }}>
                {entryHead(e.schoolName?.trim() || e.course, e.duration, e.schoolName?.trim() ? detail : undefined)}
              </div>
            );
          });
      case "certificates":
        return (content.certificates ?? [])
          .filter((c) => c.title?.trim())
          .map((c) => {
            const date = [c.issuedDate, c.expirationDate].filter((v) => v?.trim()).join(" - ");
            return (
              <div key={c.id} style={{ marginBottom: pt(spacing.item) }}>
                {entryHead(c.title, date)}
                {c.description?.trim() && <div style={{ marginTop: pt(1) }}>{c.description}</div>}
                {linkRow(c.links)}
              </div>
            );
          });
      default:
        return null;
    }
  };

  const contacts = contactParts(personal);
  const showHeader = Boolean(name) || contacts.length > 0 || linksOf(personal?.links).length > 0 || placeholders;

  return (
    <div
      style={{
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
      }}
    >
      {showHeader && (
        <header
          style={{
            textAlign: t.header.align,
            marginBottom: pt(spacing.section),
            ...(t.header.align === "left" ? { borderLeft: `3pt solid ${colors.accent}`, paddingLeft: pt(8) } : {}),
          }}
        >
          <div
            style={{
              fontSize: pt(size.name),
              fontWeight: 700,
              color: name ? colors.text : "#a8a29e",
              textTransform: t.header.nameUpper ? "uppercase" : "none",
              letterSpacing: t.header.nameUpper ? pt(0.5) : undefined,
              lineHeight: 1.15,
            }}
          >
            {name || "Your Name"}
          </div>
          {(contacts.length > 0 || placeholders) && (
            <div style={{ fontSize: pt(size.meta), marginTop: pt(3) }}>
              {contacts.length > 0 ? (
                contacts.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span> {t.header.separator} </span>}
                    <span>{c}</span>
                  </React.Fragment>
                ))
              ) : (
                <span style={{ color: "#a8a29e" }}>Phone {t.header.separator} Email {t.header.separator} City</span>
              )}
            </div>
          )}
          {linkRow(personal?.links)}
        </header>
      )}

      {sections
        .filter((key) => key !== "personal")
        .map((key) => (
          <section key={key} style={{ marginBottom: pt(spacing.section) }}>
            {heading(key)}
            {renderSection(key)}
          </section>
        ))}

      {placeholders && sections.filter((k) => k !== "personal").length === 0 && (
        <p style={{ color: "#a8a29e", fontSize: pt(size.body), marginTop: pt(12) }}>
          Your summary, experience, skills and education will appear here as you fill them in.
        </p>
      )}
    </div>
  );
}

import React from "react";
import type { ResumeContent } from "@/lib/resume-sanitize";
import {
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
import { stripRich } from "@/lib/rich-text";
import { docStyles, PLACEHOLDER } from "./doc-styles";
import { RichBlocks, RichInline } from "./RichText";

// Read-only on-screen renderer for a resume template (editor preview,
// thumbnails, later the public share page). Mirrors ResumePdfDocument.tsx:
// both read the same TemplateDef (+ the resume's design settings), in pt.
// Always a white "paper" page, regardless of the app's dark mode.

export default function ResumeDocument({
  content,
  template,
  placeholders = false,
}: {
  content: ResumeContent;
  template: TemplateDef;
  /** Editor only: show "Your Name" etc. while the resume is empty */
  placeholders?: boolean;
}) {
  const t = effectiveTemplate(template, content.design);
  const s = docStyles(t);
  const sections = visibleSections(content).filter((key) => key !== "personal");
  const personal = content.personalDetails;
  const name = personal?.name?.trim();

  const entryHead = (title: React.ReactNode, date?: string, subtitle?: React.ReactNode) => (
    <>
      <div style={s.entryHead}>
        <div style={s.entryTitle}>{title}</div>
        {date?.trim() && <div style={s.date}>{date}</div>}
      </div>
      {subtitle && <div style={s.subtitle}>{subtitle}</div>}
    </>
  );

  const bulletList = (items: string[]) =>
    items.length > 0 && (
      <ul style={s.bulletList}>
        {items.map((b, i) => (
          <li key={i} style={s.bullet}>
            <RichInline value={b} linkStyle={s.link} />
          </li>
        ))}
      </ul>
    );

  const linkRow = (list: { label: string; url: string }[] | undefined) => {
    const items = linksOf(list);
    if (!items.length) return null;
    return (
      <div style={s.linkRow}>
        {items.map((l, i) => {
          const href = safeLinkUrl(l.url);
          return (
            <React.Fragment key={i}>
              {i > 0 && <span> {t.header.separator} </span>}
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer nofollow" style={s.link}>
                  {l.label}
                </a>
              ) : (
                <span>{l.label}</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderSection = (key: string) => {
    if (key.startsWith("custom:")) {
      const c = content.customSections?.find((x) => `custom:${x.id}` === key);
      return c ? (
        <RichBlocks value={c.body} lists paragraphStyle={s.paragraph} listStyle={s.bulletList} itemStyle={s.bullet} linkStyle={s.link} />
      ) : null;
    }
    switch (key) {
      case "summary":
        return <RichBlocks value={content.professionalSummary ?? ""} paragraphStyle={s.paragraph} linkStyle={s.link} />;
      case "skills":
        return (
          <div>
            {groupSkills(content.skills).map((g) => (
              <div key={g.category} style={{ marginBottom: "1pt" }}>
                <span style={s.strong}>{g.category}: </span>
                {g.values.join(", ")}
              </div>
            ))}
          </div>
        );
      case "experience":
        return (content.experiences ?? [])
          .filter((e) => e.role?.trim() || e.company?.trim())
          .map((e) => (
            <div key={e.id} style={s.entry}>
              {entryHead(e.role?.trim() || e.company, e.duration, e.role?.trim() ? e.company : undefined)}
              {bulletList(bulletsOf(e.bullets))}
            </div>
          ));
      case "projects":
        return (content.projects ?? [])
          .filter((p) => p.title?.trim())
          .map((p) => (
            <div key={p.id} style={s.entry}>
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
              <div key={e.id} style={s.entry}>
                {entryHead(e.schoolName?.trim() || e.course, e.duration, e.schoolName?.trim() ? detail : undefined)}
              </div>
            );
          });
      case "certificates":
        return (content.certificates ?? [])
          .filter((c) => c.title?.trim())
          .map((c) => (
            <div key={c.id} style={s.entry}>
              {entryHead(c.title, [c.issuedDate, c.expirationDate].filter((v) => v?.trim()).join(" - "))}
              {stripRich(c.description).trim() && (
                <div style={{ marginTop: "1pt" }}>
                  <RichInline value={c.description!} linkStyle={s.link} />
                </div>
              )}
              {linkRow(c.links)}
            </div>
          ));
      default:
        return null;
    }
  };

  const contacts = contactParts(personal);
  const showHeader = Boolean(name) || contacts.length > 0 || linksOf(personal?.links).length > 0 || placeholders;

  return (
    <div style={s.page}>
      {showHeader && (
        <header style={s.header}>
          <div style={{ ...s.name, color: name ? s.name.color : PLACEHOLDER }}>{name || "Your Name"}</div>
          {(contacts.length > 0 || placeholders) && (
            <div style={s.contactRow}>
              {contacts.length > 0 ? (
                contacts.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span> {t.header.separator} </span>}
                    <span>{c}</span>
                  </React.Fragment>
                ))
              ) : (
                <span style={{ color: PLACEHOLDER }}>
                  Phone {t.header.separator} Email {t.header.separator} City
                </span>
              )}
            </div>
          )}
          {linkRow(personal?.links)}
        </header>
      )}

      {sections.map((key) => (
        <section key={key} style={s.section}>
          <div style={s.heading}>{sectionTitle(content, key)}</div>
          {renderSection(key)}
        </section>
      ))}

      {placeholders && sections.length === 0 && (
        <p style={{ color: PLACEHOLDER, marginTop: "12pt" }}>
          Your summary, experience, skills and education will appear here as you fill them in.
        </p>
      )}
    </div>
  );
}

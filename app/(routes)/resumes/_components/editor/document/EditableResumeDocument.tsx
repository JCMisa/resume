"use client";

import React, { useState } from "react";
import { ArrowDown, ArrowUp, Link2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ResumeContent } from "@/lib/resume-sanitize";
import { effectiveTemplate, safeLinkUrl, sectionTitle, type TemplateDef } from "@/lib/resume-templates";
import {
  addEntry,
  groupsToSkills,
  moveEntry,
  removeCustomSection,
  removeEntry,
  skillsToGroups,
  type EntrySection,
} from "@/lib/resume-editor";
import { stripRich } from "@/lib/rich-text";
import { docStyles, PLACEHOLDER } from "@/components/resume-templates/doc-styles";
import InlineText from "./InlineText";
import RichField from "../rich/RichField";

type Link = { label: string; url: string };
type Update = (fn: (c: ResumeContent) => ResumeContent) => void;
/** Like update, but offers "Undo" (used for deletions) */
type Destructive = (fn: (c: ResumeContent) => ResumeContent, message: string) => void;

const ADD_LABEL: Record<EntrySection, string> = {
  experience: "Add job",
  projects: "Add project",
  education: "Add school",
  certificates: "Add certification",
};

/** Hover controls for one entry (move / delete), drawn over the page. */
function EntryControls({ onUp, onDown, onDelete, label }: { onUp?: () => void; onDown?: () => void; onDelete: () => void; label: string }) {
  const btn = "size-6 rounded-md flex items-center justify-center bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30";
  return (
    <div
      className="absolute -top-3 right-0 z-10 hidden group-hover/entry:flex group-focus-within/entry:flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5 shadow-sm"
      style={{ fontSize: 12 }}
    >
      <button type="button" className={btn} onClick={onUp} disabled={!onUp} aria-label={`Move ${label} up`}>
        <ArrowUp className="size-3.5" />
      </button>
      <button type="button" className={btn} onClick={onDown} disabled={!onDown} aria-label={`Move ${label} down`}>
        <ArrowDown className="size-3.5" />
      </button>
      <button type="button" className={`${btn} hover:!text-rose-600`} onClick={onDelete} aria-label={`Delete ${label}`}>
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 inline-flex items-center gap-1 rounded-md border border-dashed border-stone-300 px-2 py-0.5 text-stone-500 opacity-60 hover:opacity-100 hover:border-stone-500 hover:text-stone-800 focus:opacity-100"
      style={{ fontSize: 11, fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}
    >
      <Plus className="size-3" /> {children}
    </button>
  );
}

/** Editable list of links (label on the page; address in a small dialog). */
function LinkChips({
  links,
  onChange,
  separator,
  style,
  linkStyle,
}: {
  links: Link[];
  onChange: (links: Link[]) => void;
  separator: string;
  style: React.CSSProperties;
  linkStyle: React.CSSProperties;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Link>({ label: "", url: "" });
  const [error, setError] = useState<string | null>(null);

  const open = (i: number) => {
    setDraft(links[i] ?? { label: "", url: "" });
    setError(null);
    setEditing(i);
  };
  const save = () => {
    if (!safeLinkUrl(draft.url)) return setError("Enter a web address, like github.com/you or https://…");
    const next = [...links];
    next[editing!] = { label: draft.label.trim(), url: draft.url.trim() };
    onChange(next);
    setEditing(null);
  };

  return (
    <div style={style}>
      {links.map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span> {separator} </span>}
          <button type="button" onClick={() => open(i)} style={linkStyle} className="hover:bg-stone-100 rounded-[2px]" title={l.url}>
            {l.label || l.url.replace(/^https?:\/\//, "") || "link"}
          </button>
        </React.Fragment>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...links, { label: "", url: "" }]);
          open(links.length);
        }}
        className="ml-1 inline-flex items-center gap-0.5 rounded-md px-1 text-stone-400 opacity-60 hover:opacity-100 hover:text-stone-800 align-middle"
        style={{ fontSize: 10, fontFamily: "system-ui, sans-serif" }}
        aria-label="Add a link"
      >
        <Link2 className="size-3" /> link
      </button>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (o) return;
          // Closing a brand-new, empty link removes it
          if (editing !== null && !links[editing]?.url) onChange(links.filter((_, i) => i !== editing));
          setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
            <DialogDescription>Shown on your resume and clickable in the PDF.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <Input autoFocus placeholder="github.com/you" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} aria-label="Link address" />
            <Input placeholder="Text to show (optional)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} aria-label="Link text" />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  onChange(links.filter((_, i) => i !== editing));
                  setEditing(null);
                }}
              >
                Remove
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EditableResumeDocument({
  content,
  template,
  shown,
  update,
  destructive,
}: {
  content: ResumeContent;
  template: TemplateDef;
  /** Sections the user added this session (kept visible while still empty) */
  shown: Set<string>;
  update: Update;
  destructive: Destructive;
}) {
  const t = effectiveTemplate(template, content.design);
  const s = docStyles(t);
  const p = content.personalDetails ?? {};
  const setPersonal = (patch: Partial<NonNullable<ResumeContent["personalDetails"]>>) =>
    update((c) => ({ ...c, personalDetails: { ...c.personalDetails, ...patch } }));

  const setEntry = <F extends "experiences" | "projects" | "educations" | "certificates">(field: F, id: string, patch: Record<string, unknown>) =>
    update((c) => ({ ...c, [field]: ((c[field] ?? []) as { id: string }[]).map((e) => (e.id === id ? { ...e, ...patch } : e)) }));

  const isShown = (key: string): boolean => {
    if (key.startsWith("custom:")) return true;
    if (shown.has(key)) return true;
    switch (key) {
      case "summary":
        return Boolean(stripRich(content.professionalSummary).trim());
      case "skills":
        return (content.skills ?? []).length > 0;
      case "experience":
        return (content.experiences ?? []).length > 0;
      case "projects":
        return (content.projects ?? []).length > 0;
      case "education":
        return (content.educations ?? []).length > 0;
      case "certificates":
        return (content.certificates ?? []).length > 0;
      default:
        return false;
    }
  };

  const heading = (key: string) => {
    const custom = key.startsWith("custom:");
    return (
      <div style={s.heading} className="group/heading relative">
        <InlineText
          value={custom ? sectionTitle(content, key) : content.design?.sectionTitles?.[key] ?? sectionTitle(content, key)}
          ariaLabel="Section heading"
          placeholder="Section title"
          maxLength={60}
          onChange={(v) =>
            update((c) =>
              custom
                ? { ...c, customSections: (c.customSections ?? []).map((x) => (`custom:${x.id}` === key ? { ...x, title: v } : x)) }
                : { ...c, design: { ...c.design, sectionTitles: { ...c.design?.sectionTitles, [key]: v } } },
            )
          }
        />
        {custom && (
          <button
            type="button"
            className="absolute right-0 top-0 hidden group-hover/heading:flex size-5 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-rose-600"
            aria-label="Delete this section"
            onClick={() => destructive((c) => removeCustomSection(c, key.slice("custom:".length)), "Section deleted.")}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  };

  const entryHead = (title: React.ReactNode, date: React.ReactNode, subtitle?: React.ReactNode) => (
    <>
      <div style={s.entryHead}>
        <div style={{ ...s.entryTitle, flex: 1, minWidth: 0 }}>{title}</div>
        <div style={s.date}>{date}</div>
      </div>
      {subtitle && <div style={s.subtitle}>{subtitle}</div>}
    </>
  );

  const entryList = <E extends { id: string }>(section: EntrySection, list: E[], label: string, render: (e: E) => React.ReactNode) => (
    <>
      {list.map((e, i) => (
        <div key={e.id} style={s.entry} className="group/entry relative">
          <EntryControls
            label={label}
            onUp={i > 0 ? () => update((c) => moveEntry(c, section, e.id, -1)) : undefined}
            onDown={i < list.length - 1 ? () => update((c) => moveEntry(c, section, e.id, 1)) : undefined}
            onDelete={() => destructive((c) => removeEntry(c, section, e.id), `${label[0].toUpperCase()}${label.slice(1)} deleted.`)}
          />
          {render(e)}
        </div>
      ))}
      <AddButton onClick={() => update((c) => addEntry(c, section).content)}>{ADD_LABEL[section]}</AddButton>
    </>
  );

  const bullets = (value: string[], onChange: (v: string[]) => void, label: string) => (
    <RichField
      kind="bullets"
      appearance="bare"
      value={value}
      onChange={(v) => onChange(v as string[])}
      ariaLabel={label}
      placeholder="Describe what you did and the result (add numbers)…"
      style={{ marginTop: "2pt" }}
    />
  );

  const renderSection = (key: string) => {
    if (key.startsWith("custom:")) {
      const c = content.customSections?.find((x) => `custom:${x.id}` === key);
      if (!c) return null;
      return (
        <RichField
          kind="blocks"
          appearance="bare"
          value={c.body}
          ariaLabel={`${c.title || "Custom section"} text`}
          placeholder="Write anything: awards, languages, volunteering, interests…"
          onChange={(v) =>
            update((x) => ({ ...x, customSections: (x.customSections ?? []).map((cs) => (cs.id === c.id ? { ...cs, body: v as string } : cs)) }))
          }
        />
      );
    }
    switch (key) {
      case "summary":
        return (
          <RichField
            kind="paragraphs"
            appearance="bare"
            value={content.professionalSummary ?? ""}
            ariaLabel="Professional summary"
            placeholder="2-4 sentences: who you are, your strongest skills, and a result you're proud of."
            onChange={(v) => update((c) => ({ ...c, professionalSummary: v as string }))}
          />
        );
      case "skills": {
        const groups = skillsToGroups(content.skills);
        const setGroups = (next: typeof groups) => update((c) => ({ ...c, skills: groupsToSkills(next, c.skills) }));
        return (
          <div>
            {groups.map((g, i) => (
              <div key={i} style={{ marginBottom: "1pt" }} className="group/entry relative pr-6">
                <InlineText
                  value={g.category}
                  ariaLabel="Skill category"
                  placeholder="Category"
                  style={s.strong}
                  onChange={(v) => setGroups(groups.map((x, j) => (j === i ? { ...x, category: v } : x)))}
                />
                <span style={s.strong}>: </span>
                <InlineText
                  value={g.values}
                  ariaLabel={`${g.category || "Skill"} skills, separated by commas`}
                  placeholder="Skill, skill, skill"
                  maxLength={600}
                  onChange={(v) => setGroups(groups.map((x, j) => (j === i ? { ...x, values: v } : x)))}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 hidden group-hover/entry:flex size-5 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-rose-600"
                  aria-label="Delete this skill row"
                  onClick={() => setGroups(groups.filter((_, j) => j !== i))}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <AddButton onClick={() => setGroups([...groups, { category: groups.length ? "Other" : "Skills", values: "" }])}>Add skill row</AddButton>
          </div>
        );
      }
      case "experience":
        return entryList("experience", content.experiences ?? [], "job", (e) => (
          <>
            {entryHead(
              <InlineText value={e.role} ariaLabel="Job title" placeholder="Job title" onChange={(v) => setEntry("experiences", e.id, { role: v })} />,
              <InlineText value={e.duration} ariaLabel="Dates" placeholder="Jan 2023 - Present" onChange={(v) => setEntry("experiences", e.id, { duration: v })} />,
              <InlineText value={e.company} ariaLabel="Company" placeholder="Company" onChange={(v) => setEntry("experiences", e.id, { company: v })} />,
            )}
            {bullets(e.bullets ?? [], (v) => setEntry("experiences", e.id, { bullets: v }), `${e.role || "Job"} bullet points`)}
          </>
        ));
      case "projects":
        return entryList("projects", content.projects ?? [], "project", (pr) => (
          <>
            {entryHead(
              <InlineText value={pr.title} ariaLabel="Project name" placeholder="Project name" onChange={(v) => setEntry("projects", pr.id, { title: v })} />,
              <InlineText value={pr.duration} ariaLabel="Dates" placeholder="2024" onChange={(v) => setEntry("projects", pr.id, { duration: v })} />,
            )}
            {bullets(pr.description ?? [], (v) => setEntry("projects", pr.id, { description: v }), `${pr.title || "Project"} bullet points`)}
            <LinkChips
              links={pr.links ?? []}
              onChange={(links) => setEntry("projects", pr.id, { links })}
              separator={t.header.separator}
              style={s.linkRow}
              linkStyle={s.link}
            />
          </>
        ));
      case "education":
        return entryList("education", content.educations ?? [], "school", (ed) => (
          <>
            {entryHead(
              <InlineText value={ed.schoolName} ariaLabel="School" placeholder="School or university" onChange={(v) => setEntry("educations", ed.id, { schoolName: v })} />,
              <InlineText value={ed.duration} ariaLabel="Dates" placeholder="2019 - 2023" onChange={(v) => setEntry("educations", ed.id, { duration: v })} />,
              <>
                <InlineText value={ed.course} ariaLabel="Degree" placeholder="Degree" onChange={(v) => setEntry("educations", ed.id, { course: v })} />
                <span> · </span>
                <InlineText value={ed.major ?? ""} ariaLabel="Major" placeholder="Major (optional)" onChange={(v) => setEntry("educations", ed.id, { major: v || undefined })} />
                <span> · </span>
                <InlineText value={ed.gwa ?? ""} ariaLabel="Grade" placeholder="GWA/GPA (optional)" onChange={(v) => setEntry("educations", ed.id, { gwa: v || undefined })} />
              </>,
            )}
          </>
        ));
      case "certificates":
        return entryList("certificates", content.certificates ?? [], "certification", (ce) => (
          <>
            {entryHead(
              <InlineText value={ce.title} ariaLabel="Certification" placeholder="Certification name" onChange={(v) => setEntry("certificates", ce.id, { title: v })} />,
              <>
                <InlineText value={ce.issuedDate} ariaLabel="Issued" placeholder="Issued" onChange={(v) => setEntry("certificates", ce.id, { issuedDate: v })} />
                <span> - </span>
                <InlineText value={ce.expirationDate ?? ""} ariaLabel="Expires" placeholder="Expires (optional)" onChange={(v) => setEntry("certificates", ce.id, { expirationDate: v || undefined })} />
              </>,
            )}
            <RichField
              kind="inline"
              appearance="bare"
              value={ce.description ?? ""}
              ariaLabel="Certification details"
              placeholder="Details (optional)"
              onChange={(v) => setEntry("certificates", ce.id, { description: (v as string) || undefined })}
              style={{ marginTop: "1pt" }}
            />
            <LinkChips
              links={ce.links ?? []}
              onChange={(links) => setEntry("certificates", ce.id, { links })}
              separator={t.header.separator}
              style={s.linkRow}
              linkStyle={s.link}
            />
          </>
        ));
      default:
        return null;
    }
  };

  const contact = (field: "phone" | "email" | "address", placeholder: string) => (
    <InlineText value={p[field] ?? ""} ariaLabel={placeholder} placeholder={placeholder} onChange={(v) => setPersonal({ [field]: v })} />
  );

  return (
    <div style={s.page}>
      <header style={s.header}>
        <InlineText
          as="div"
          value={p.name ?? ""}
          ariaLabel="Your name"
          placeholder="Your Name"
          style={{ ...s.name, display: "inline-block" }}
          onChange={(v) => setPersonal({ name: v })}
        />
        <div style={s.contactRow}>
          {contact("phone", "Phone")}
          <span> {t.header.separator} </span>
          {contact("email", "Email")}
          <span> {t.header.separator} </span>
          {contact("address", "City, Country")}
        </div>
        <LinkChips
          links={p.links ?? []}
          onChange={(links) => setPersonal({ links })}
          separator={t.header.separator}
          style={s.linkRow}
          linkStyle={s.headerLink}
        />
      </header>

      {content.sectionOrder
        .filter((key) => key !== "personal" && isShown(key))
        .map((key) => (
          <section key={key} style={s.section}>
            {heading(key)}
            {renderSection(key)}
          </section>
        ))}

      {content.sectionOrder.filter((k) => k !== "personal" && isShown(k)).length === 0 && (
        <p style={{ color: PLACEHOLDER }}>Use “Add section” in the toolbar to start writing.</p>
      )}
    </div>
  );
}

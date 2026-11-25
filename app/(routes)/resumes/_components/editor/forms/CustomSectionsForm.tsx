"use client";

import { Plus, Shapes, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResumeContent } from "@/lib/resume-sanitize";
import { addCustomSection, EDITOR_LIMITS, removeCustomSection } from "@/lib/resume-editor";
import RichField from "../rich/RichField";

/** Assist-mode editor for free-form sections (awards, languages, volunteering…). */
export default function CustomSectionsForm({
  content,
  onChange,
  onDelete,
}: {
  content: ResumeContent;
  onChange: (content: ResumeContent) => void;
  /** Deleting offers Undo (handled by the editor) */
  onDelete: (next: ResumeContent) => void;
}) {
  const sections = content.customSections ?? [];
  const full = sections.length >= EDITOR_LIMITS.customSections;
  const patch = (id: string, change: Partial<{ title: string; body: string }>) =>
    onChange({ ...content, customSections: sections.map((s) => (s.id === id ? { ...s, ...change } : s)) });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom sections</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={full}
          onClick={() => onChange(addCustomSection(content).content)}
          className="rounded-lg font-bold gap-1"
        >
          <Plus className="h-3 w-3" /> Add section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="border border-dashed rounded-xl p-8 text-center text-xs text-muted-foreground bg-muted/10 space-y-1">
          <Shapes className="size-5 mx-auto" />
          <p>Add anything the standard sections don&apos;t cover: awards, languages, volunteering, publications, interests.</p>
        </div>
      ) : (
        sections.map((s) => (
          <div key={s.id} className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Input
                value={s.title}
                maxLength={80}
                onChange={(e) => patch(s.id, { title: e.target.value })}
                placeholder="Section title (e.g. Languages)"
                aria-label="Section title"
                className="rounded-xl h-9 font-bold"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${s.title || "section"}`}
                onClick={() => onDelete(removeCustomSection(content, s.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <RichField
              kind="blocks"
              toolbar="inline"
              value={s.body}
              onChange={(v) => patch(s.id, { body: v as string })}
              ariaLabel={`${s.title || "Custom section"} text`}
              placeholder="Write freely. Use the list button for bullet points."
            />
          </div>
        ))
      )}
      {full && <p className="text-[11px] text-muted-foreground">You can have up to {EDITOR_LIMITS.customSections} custom sections.</p>}
    </div>
  );
}

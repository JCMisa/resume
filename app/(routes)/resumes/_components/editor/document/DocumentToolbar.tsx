"use client";

import { Minus, Plus, SeparatorHorizontal, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/resume-sanitize";
import { EDITOR_LIMITS } from "@/lib/resume-editor";
import { SECTION_TITLES, type TemplateDef } from "@/lib/resume-templates";
import FormatButtons from "../rich/FormatButtons";
import { useActiveEditor } from "../rich/RichField";

const SCALES = ["sm", "md", "lg"] as const;

/** Document mode toolbar: formatting for the focused text + page-level controls. */
export default function DocumentToolbar({
  content,
  template,
  hiddenSections,
  onDesign,
  onAddSection,
}: {
  content: ResumeContent;
  template: TemplateDef;
  /** Standard sections not on the page yet */
  hiddenSections: string[];
  onDesign: (patch: NonNullable<ResumeContent["design"]>) => void;
  onAddSection: (key: string | "custom") => void;
}) {
  const editor = useActiveEditor();
  const scale = content.design?.textScale ?? "md";
  const scaleIndex = SCALES.indexOf(scale);
  const dividers = content.design?.dividers ?? template.heading.rule;
  const customFull = (content.customSections ?? []).length >= EDITOR_LIMITS.customSections;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border bg-card px-2 py-1.5 shadow-sm">
      <FormatButtons editor={editor} lists history />
      <span className="mx-1 h-5 w-px bg-border hidden sm:block" aria-hidden />

      {/* Text size */}
      <div className="flex items-center gap-0.5" role="group" aria-label="Text size">
        <button
          type="button"
          className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
          disabled={scaleIndex === 0}
          onClick={() => onDesign({ textScale: SCALES[scaleIndex - 1] })}
          aria-label="Smaller text"
          title="Smaller text"
        >
          <Minus className="size-4" />
        </button>
        <span className="text-xs font-bold w-12 text-center tabular-nums" aria-live="polite">
          {scale === "sm" ? "Small" : scale === "lg" ? "Large" : "Normal"}
        </span>
        <button
          type="button"
          className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30"
          disabled={scaleIndex === SCALES.length - 1}
          onClick={() => onDesign({ textScale: SCALES[scaleIndex + 1] })}
          aria-label="Larger text"
          title="Larger text"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <button
        type="button"
        aria-pressed={dividers}
        onClick={() => onDesign({ dividers: !dividers })}
        className={cn(
          "h-8 rounded-md px-2 flex items-center gap-1.5 text-xs font-bold transition-colors",
          dividers ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted",
        )}
        title="Divider lines under section headings"
      >
        <SeparatorHorizontal className="size-4" /> <span className="hidden sm:inline">Dividers</span>
      </button>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-lg gap-1.5">
              <SquarePlus className="size-4" /> Add section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {hiddenSections.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs">Standard sections</DropdownMenuLabel>
                {hiddenSections.map((key) => (
                  <DropdownMenuItem key={key} onSelect={() => onAddSection(key)}>
                    {content.design?.sectionTitles?.[key] || SECTION_TITLES[key]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem disabled={customFull} onSelect={() => onAddSection("custom")}>
              Custom section{customFull ? ` (max ${EDITOR_LIMITS.customSections})` : ""}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

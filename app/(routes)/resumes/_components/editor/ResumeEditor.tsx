"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  Eye,
  FileEdit,
  FileText,
  LayoutTemplate,
  ListChecks,
  ListOrdered,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ResumeDocument from "@/components/resume-templates/ResumeDocument";
import ScaledPage from "@/components/resume-templates/ScaledPage";
import TemplateGallery from "@/components/resume-templates/TemplateGallery";
import { saveResumeDraftAction } from "@/lib/actions/resume-editor";
import { addCustomSection, addEntry, groupsToSkills, normalizeResumeTitle, skillsToGroups, TITLE_MAX, type EntrySection } from "@/lib/resume-editor";
import { resolveTemplate, sectionHasContent, sectionTitle, TEMPLATES, type TemplateId } from "@/lib/resume-templates";
import type { ResumeContent } from "@/lib/resume-sanitize";
import { useAutosave, type SaveStatus } from "./useAutosave";
import SectionOrderList from "./SectionOrderList";
import { ActiveEditorProvider } from "./rich/RichField";
import EditableResumeDocument from "./document/EditableResumeDocument";
import DocumentToolbar from "./document/DocumentToolbar";
import PersonalForm from "./forms/PersonalForm";
import SummaryForm from "./forms/SummaryForm";
import SkillsForm from "./forms/SkillsForm";
import ExperienceForm from "./forms/ExperienceForm";
import ProjectsForm from "./forms/ProjectsForm";
import EducationForm from "./forms/EducationForm";
import CertificatesForm from "./forms/CertificatesForm";
import CustomSectionsForm from "./forms/CustomSectionsForm";

type Mode = "assist" | "document";
type StepKey = "personal" | "summary" | "skills" | "experience" | "projects" | "education" | "certificates" | "custom" | "arrange";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "summary", label: "Summary" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "education", label: "Education" },
  { key: "certificates", label: "Certifications" },
  { key: "custom", label: "Custom" },
  { key: "arrange", label: "Arrange" },
];

const MODE_KEY = "resume:editor-mode";
const ENTRY_SECTIONS: EntrySection[] = ["experience", "projects", "education", "certificates"];

type Doc = { title: string; templateId: TemplateId; content: ResumeContent };

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "error") {
    return (
      <button type="button" onClick={onRetry} className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:underline">
        <AlertCircle className="size-3.5" /> Couldn&apos;t save · Retry
      </button>
    );
  }
  const map = {
    saved: { icon: Check, text: "Saved" },
    dirty: { icon: CloudUpload, text: "Unsaved changes" },
    saving: { icon: Loader2, text: "Saving…" },
  } as const;
  const { icon: Icon, text } = map[status];
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-muted-foreground" aria-live="polite">
      <Icon className={cn("size-3.5", status === "saving" && "animate-spin")} /> {text}
    </span>
  );
}

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "resume";
}

export default function ResumeEditor({ resumeId, initial }: { resumeId: string; initial: Doc }) {
  const [doc, setDoc] = useState<Doc>(initial);
  const [mode, setMode] = useState<Mode>("assist");
  const [step, setStep] = useState<StepKey>("personal");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Sections added in document mode this session, kept on the page while empty
  const [shown, setShown] = useState<Set<string>>(() => new Set());

  // Remember the preferred mode on this device (convenience only)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved === "assist" || saved === "document") setMode(saved);
      } catch {
        // storage unavailable: default mode
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const switchMode = (next: Mode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // ignore
    }
  };

  const { status, saveNow } = useAutosave(doc, async (changes) => {
    const res = await saveResumeDraftAction(resumeId, changes);
    if (!res.success) {
      if (res.error !== "Couldn't save. Check your connection; we'll keep trying.") toast.error(res.error, { id: "save-error" });
      return false;
    }
    return true;
  });

  const template = resolveTemplate(doc.templateId);
  const content = doc.content;
  const update = (fn: (c: ResumeContent) => ResumeContent) => setDoc((d) => ({ ...d, content: fn(d.content) }));
  const setContent = <K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) => update((c) => ({ ...c, [key]: value }));

  /** Deletions: apply, and offer Undo for a few seconds. */
  const destructive = (fn: (c: ResumeContent) => ResumeContent, message: string) => {
    const before = doc.content;
    update(fn);
    toast(message, { action: { label: "Undo", onClick: () => setDoc((d) => ({ ...d, content: before })) } });
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const filled = (key: string) => sectionHasContent(content, key);
  const stepDone = (key: StepKey) =>
    key === "custom" ? (content.customSections ?? []).some((c) => filled(`custom:${c.id}`)) : key !== "arrange" && filled(key);

  // Document mode: standard sections that aren't on the page yet
  const onPage = (key: string) => {
    if (shown.has(key)) return true;
    if (key === "summary") return filled("summary");
    if (key === "skills") return (content.skills ?? []).length > 0;
    const field = { experience: "experiences", projects: "projects", education: "educations", certificates: "certificates" }[key as EntrySection];
    return field ? ((content[field as keyof ResumeContent] as unknown[] | undefined) ?? []).length > 0 : true;
  };
  const hiddenSections = content.sectionOrder.filter((k) => k !== "personal" && !k.startsWith("custom:") && !onPage(k));

  function addSection(key: string) {
    if (key === "custom") {
      update((c) => addCustomSection(c).content);
      return;
    }
    setShown((s) => new Set(s).add(key));
    if (ENTRY_SECTIONS.includes(key as EntrySection)) update((c) => addEntry(c, key as EntrySection).content);
    if (key === "skills") update((c) => ({ ...c, skills: groupsToSkills([...skillsToGroups(c.skills), { category: "Skills", values: "" }], c.skills) }));
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      // Loaded on demand: the PDF engine is large
      const [{ pdf }, { default: ResumePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/resume-templates/ResumePdfDocument"),
      ]);
      const blob = await pdf(<ResumePdfDocument content={content} template={template} title={doc.title} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(doc.title)}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Couldn't create the PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  const form = (() => {
    switch (step) {
      case "personal":
        return (
          <PersonalForm
            data={{ ...content.personalDetails, links: content.personalDetails?.links ?? [] }}
            onChange={(v) => setContent("personalDetails", v)}
          />
        );
      case "summary":
        return <SummaryForm data={content.professionalSummary ?? ""} onChange={(v) => setContent("professionalSummary", v)} />;
      case "skills":
        return <SkillsForm data={content.skills ?? []} onChange={(v) => setContent("skills", v)} />;
      case "experience":
        return <ExperienceForm data={content.experiences ?? []} onChange={(v) => setContent("experiences", v)} />;
      case "projects":
        return <ProjectsForm data={content.projects ?? []} onChange={(v) => setContent("projects", v)} />;
      case "education":
        return <EducationForm data={content.educations ?? []} onChange={(v) => setContent("educations", v)} />;
      case "certificates":
        return <CertificatesForm data={content.certificates ?? []} onChange={(v) => setContent("certificates", v)} />;
      case "custom":
        return (
          <CustomSectionsForm
            content={content}
            onChange={(next) => update(() => next)}
            onDelete={(next) => destructive(() => next, "Section deleted.")}
          />
        );
      case "arrange":
        return (
          <SectionOrderList
            order={content.sectionOrder}
            filled={filled}
            titleOf={(key) => sectionTitle(content, key)}
            onChange={(order) => setContent("sectionOrder", order)}
          />
        );
    }
  })();

  const editPanel = (
    <div className="rounded-3xl border bg-card shadow-sm flex flex-col min-w-0 lg:h-full lg:min-h-0">
      <nav aria-label="Resume sections" className="border-b p-2 overflow-x-auto custom-scrollbar">
        <ol className="flex gap-1 min-w-max">
          {STEPS.map((s, i) => {
            const active = s.key === step;
            const done = stepDone(s.key);
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setStep(s.key)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {s.key === "arrange" ? (
                    <ListOrdered className="size-3.5" />
                  ) : (
                    <span
                      className={cn(
                        "size-4 rounded-full text-[9px] flex items-center justify-center",
                        active ? "bg-primary-foreground/20" : done ? "bg-brand/20 text-brand-strong dark:text-brand" : "bg-muted",
                      )}
                    >
                      {done ? <Check className="size-2.5" /> : i + 1}
                    </span>
                  )}
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6">{form}</div>

      <div className="border-t p-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="rounded-lg gap-1" disabled={stepIndex === 0} onClick={() => setStep(STEPS[stepIndex - 1].key)}>
          <ChevronLeft className="size-4" /> Back
        </Button>
        {stepIndex < STEPS.length - 1 ? (
          <Button size="sm" className="rounded-lg gap-1 font-bold" onClick={() => setStep(STEPS[stepIndex + 1].key)}>
            Next: {STEPS[stepIndex + 1].label} <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="rounded-lg gap-1.5 font-bold" onClick={() => void downloadPdf()} disabled={downloading}>
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download PDF
          </Button>
        )}
      </div>
    </div>
  );

  const previewPanel = (
    <div className="rounded-3xl border bg-stone-100 dark:bg-stone-900/60 p-3 sm:p-6 min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-205">
        <ScaledPage pageBreaks>
          <ResumeDocument content={content} template={template} placeholders />
        </ScaledPage>
      </div>
    </div>
  );

  const documentView = (
    <div className="flex flex-col gap-3 min-w-0 lg:flex-1 lg:min-h-0">
      <DocumentToolbar
        content={content}
        template={template}
        hiddenSections={hiddenSections}
        onDesign={(patch) => update((c) => ({ ...c, design: { ...c.design, ...patch } }))}
        onAddSection={addSection}
      />
      <div className="rounded-3xl border bg-stone-100 dark:bg-stone-900/60 p-2 sm:p-6 min-w-0 lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
        <div className="mx-auto max-w-205">
          {/* Never smaller than 60%: on phones the page scrolls sideways instead */}
          <ScaledPage pageBreaks minScale={0.6}>
            <EditableResumeDocument content={content} template={template} shown={shown} update={update} destructive={destructive} />
          </ScaledPage>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground lg:hidden">
          Tip: Assist mode is easier on small screens.
        </p>
      </div>
    </div>
  );

  return (
    <ActiveEditorProvider>
      <div className="w-full flex flex-col gap-4 lg:h-full lg:min-h-0">
        {/* Top bar: back, title (like Google Docs), save state, mode, actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/resumes"
            aria-label="Back to resumes"
            className="size-9 shrink-0 rounded-xl border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1 basis-48">
            <input
              value={doc.title}
              maxLength={TITLE_MAX}
              onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
              onBlur={() => setDoc((d) => ({ ...d, title: normalizeResumeTitle(d.title) }))}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              aria-label="Resume name"
              className="w-full max-w-md truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-black tracking-tight hover:border-border focus:border-primary focus:outline-none"
            />
            <div className="px-2 flex items-center gap-2">
              <SaveIndicator status={status} onRetry={() => void saveNow()} />
              <span className="hidden sm:inline text-[11px] text-muted-foreground">· {template.name} template</span>
            </div>
          </div>

          {/* Mode switch */}
          <div role="radiogroup" aria-label="Editing mode" className="flex rounded-xl border p-1 bg-muted/30 order-last sm:order-0 w-full sm:w-auto">
            {(
              [
                { id: "assist", label: "Assist", icon: ListChecks, hint: "Fill in guided forms" },
                { id: "document", label: "Document", icon: FileText, hint: "Type directly on the page" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                title={m.hint}
                onClick={() => switchMode(m.id)}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                  mode === m.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="size-3.5" /> {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => setTemplatesOpen(true)}>
              <LayoutTemplate className="size-4" /> <span className="hidden sm:inline">Template</span>
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => void saveNow()} disabled={status === "saving"} title="Save (Ctrl+S)">
              <Save className="size-4" /> <span className="hidden sm:inline">Save</span>
            </Button>
            <Button size="sm" className="rounded-lg gap-1.5 font-bold" onClick={() => void downloadPdf()} disabled={downloading}>
              {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {mode === "document" ? (
          documentView
        ) : (
          <>
            {/* Phones / tablets: Edit and Preview tabs */}
            <Tabs defaultValue="edit" className="lg:hidden w-full gap-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit" className="gap-1.5">
                  <FileEdit className="size-4" /> Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="size-4" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit">{editPanel}</TabsContent>
              <TabsContent value="preview">{previewPanel}</TabsContent>
            </Tabs>

            {/* Desktop: side by side, each column scrolls on its own */}
            <div className="hidden lg:grid lg:grid-cols-[minmax(360px,460px)_minmax(0,1fr)] gap-4 flex-1 min-h-0">
              {editPanel}
              {previewPanel}
            </div>
          </>
        )}

        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle>Change template</DialogTitle>
              <DialogDescription>Your content stays the same; only the look changes.</DialogDescription>
            </DialogHeader>
            <TemplateGallery
              value={doc.templateId}
              content={content}
              onChange={(id) => {
                setDoc((d) => ({ ...d, templateId: id }));
                setTemplatesOpen(false);
                toast.success(`Switched to ${TEMPLATES[id].name}.`);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ActiveEditorProvider>
  );
}

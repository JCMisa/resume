"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  KeyRound,
  ListChecks,
  Loader2,
  PenLine,
  RefreshCw,
  ScanSearch,
  ChevronDown,
  Eye,
  Target,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";
import type { ExtractInfo, ProcessStage } from "../page";

const BUSY: ProcessStage[] = [
  "reading",
  "extracting",
  "ai_processing",
  "uploading_to_cloud",
];

const COVERS = [
  {
    icon: Target,
    title: "ATS score",
    text: "A 1–100 score for how well your resume reads to applicant tracking systems.",
  },
  {
    icon: KeyRound,
    title: "Keywords",
    text: "The industry terms the AI found, so you can see what recruiters will match on.",
  },
  {
    icon: ListChecks,
    title: "Strengths & gaps",
    text: "What already works, what's weak, and anything missing from your history.",
  },
  {
    icon: Wand2,
    title: "Rewrite suggestions",
    text: "Before/after rewrites for specific lines, each with the reason behind it.",
  },
];

interface UploadSectionProps {
  stage: ProcessStage;
  file: File | null;
  info: ExtractInfo | null;
  /** The text sent to the AI, shown in the "What the AI read" preview */
  extractedText: string;
  errorKind: "scanned" | "unreadable" | null;
  statusMessage: string;
  progress: number;
  onFile: (file: File) => void;
  onProceed: () => void;
  onReset: () => void;
}

export default function UploadSection({
  stage,
  file,
  info,
  extractedText,
  errorKind,
  statusMessage,
  progress,
  onFile,
  onProceed,
  onReset,
}: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = BUSY.includes(stage);
  const ready = stage === "success";
  const failed = stage === "error";

  const browse = () => {
    if (!busy) inputRef.current?.click();
  };

  return (
    <motion.div
      key="upload-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      <input
        type="file"
        ref={inputRef}
        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // allow picking the same file again
          if (f) onFile(f);
        }}
      />

      {/* Dropzone: idle / dragging / working / ready / error */}
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        onClick={() => !ready && !failed && browse()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !ready && !failed) {
            e.preventDefault();
            browse();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(e) => {
          // Ignore leaves into child elements (prevents flicker)
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f && !busy) onFile(f);
        }}
        className={cn(
          "relative rounded-3xl border-2 border-dashed p-8 sm:p-10 min-h-[320px] flex flex-col items-center justify-center text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          dragging
            ? "border-brand bg-brand/5 scale-[0.995]"
            : failed
              ? "border-destructive/40 bg-destructive/5"
              : ready
                ? "border-brand/50 bg-brand/5"
                : busy
                  ? "border-muted-foreground/20 cursor-progress"
                  : "border-muted-foreground/20 hover:border-brand/50 hover:bg-muted/30 cursor-pointer",
        )}
      >
        {dragging ? (
          <>
            <UploadCloud className="size-12 text-brand-strong dark:text-brand mb-4 animate-bounce" />
            <p className="text-lg font-bold">Drop your resume to start</p>
          </>
        ) : busy ? (
          <div className="w-full max-w-md space-y-5">
            <div className="mx-auto size-16 rounded-2xl bg-brand/10 flex items-center justify-center">
              <Loader2 className="size-8 text-brand-strong dark:text-brand animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {stage === "ai_processing"
                  ? "AI is reviewing your resume…"
                  : stage === "uploading_to_cloud"
                    ? "Saving your PDF…"
                    : "Reading your file…"}
              </p>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
            <div className="space-y-1.5">
              <Progress value={progress} className="h-2.5" />
              <p className="text-xs font-bold text-muted-foreground tabular-nums text-right">
                {progress}%
              </p>
            </div>
            {stage === "ai_processing" && (
              <p className="text-[11px] text-muted-foreground">
                This usually takes 10–30 seconds. Keep this tab open.
              </p>
            )}
          </div>
        ) : failed ? (
          <div className="max-w-md space-y-4">
            <div className="mx-auto size-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              {errorKind === "scanned" ? (
                <ScanSearch className="size-8 text-destructive" />
              ) : (
                <AlertCircle className="size-8 text-destructive" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold">
                {errorKind === "scanned"
                  ? "This PDF looks scanned"
                  : "We couldn't read this PDF"}
              </p>
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                  browse();
                }}
                className="rounded-xl font-bold gap-1.5"
              >
                <RefreshCw className="size-4" /> Try another file
              </Button>
              {errorKind === "scanned" && (
                <Link
                  href="/resumes/create"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-xl font-bold gap-1.5",
                  )}
                >
                  <PenLine className="size-4" /> Build it in the editor
                </Link>
              )}
            </div>
          </div>
        ) : ready && file ? (
          <div className="w-full max-w-md space-y-5">
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-left">
              <div className="p-3 rounded-xl bg-brand/10 text-brand-strong dark:text-brand shrink-0">
                <FileText className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    formatBytes(file.size),
                    info &&
                      (info.docx
                        ? "Word document"
                        : `${info.pages} page${info.pages === 1 ? "" : "s"}`),
                    info &&
                      (info.scanned
                        ? "scanned"
                        : `${info.words.toLocaleString()} words`),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            {info?.scanned && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-left">
                <ScanSearch className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">This PDF is a scan or image.</span>{" "}
                  The AI will read the page images instead of a text layer. It takes a bit longer,
                  and blurry scans may miss details. Note: many applicant tracking systems can&apos;t
                  read scanned resumes, so also export a text PDF for applications.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onProceed();
                }}
                className="rounded-xl font-black gap-2"
              >
                {info?.scanned ? "Analyze scanned resume" : "Analyze resume"}{" "}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                  browse();
                }}
                className="rounded-xl font-bold"
              >
                Choose another file
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 p-5 rounded-2xl bg-brand/10 text-brand-strong dark:text-brand">
              <UploadCloud className="size-10" />
            </div>
            <p className="text-lg font-bold">
              Drop your resume here or{" "}
              <span className="text-brand-strong dark:text-brand underline underline-offset-4">
                browse files
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF or Word (.docx), up to 10 MB
            </p>
          </>
        )}
      </div>

      {/* What the AI read: lets users catch missing or jumbled text before spending an analysis */}
      {extractedText && (ready || stage === "ai_processing") && (
        <ExtractedTextPreview text={extractedText} />
      )}

      {/* What the analysis covers */}
      <section className="rounded-3xl border bg-card shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-black tracking-tight">
          What the analysis covers
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COVERS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <div className="size-9 shrink-0 rounded-xl border bg-muted/30 flex items-center justify-center">
                <Icon className="size-4 text-brand-strong dark:text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground border-t pt-4">
          Text is extracted in your browser and reviewed by Google Gemini (scanned
          PDFs are read by Gemini directly). After a successful analysis, PDFs are
          saved to your account (Word files aren&apos;t stored) so you can
          open them later.
        </p>
      </section>
    </motion.div>
  );
}

function ExtractedTextPreview({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const lines = text.split(/\n/).length;
  return (
    <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="extracted-text"
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-brand/10 text-brand-strong dark:text-brand border border-brand/15 shrink-0">
            <Eye className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black tracking-tight">What the AI read</span>
            <span className="block text-[11px] text-muted-foreground truncate">
              {lines.toLocaleString()} lines · {text.length.toLocaleString()} characters · check that nothing is missing or out of order
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div id="extracted-text" className="border-t">
          <pre className="max-h-80 overflow-auto custom-scrollbar px-5 py-4 text-xs leading-relaxed font-mono whitespace-pre-wrap break-words text-foreground/90">
            {text}
          </pre>
          <p className="border-t px-5 py-3 text-[11px] text-muted-foreground">
            Applicant tracking systems also read your PDF&apos;s text layer. If a section is missing
            or out of order here, fix it in your source document (avoid text in images, tables or
            text boxes) and export the PDF again.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FileText,
  FileUp,
  Loader2,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-extract";
import { extractDocxText } from "@/lib/docx-extract";
import { resumeFileKind } from "@/lib/docx-text";
import { countWords, looksScanned } from "@/lib/resume-text";

interface SetupProps {
  // The interview session itself is created when the call starts (see Agent.tsx),
  // so a session is only counted once the user actually clicks Start.
  onSetupComplete: (text: string, role: string, desc: string) => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type ResumeState =
  | { status: "empty" }
  | { status: "reading"; name: string }
  | {
      status: "ready";
      name: string;
      size: number;
      pages: number;
      words: number;
      text: string;
    }
  | { status: "error"; name?: string; message: string };

export default function InterviewSetupForm({ onSetupComplete }: SetupProps) {
  const [role, setRole] = useState("");
  const [desc, setDesc] = useState("");
  const [resume, setResume] = useState<ResumeState>({ status: "empty" });

  const ready = resume.status === "ready";

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) {
      toast.error("Add the role you're interviewing for.");
      return;
    }
    if (resume.status !== "ready") {
      toast.error("Upload your resume (PDF or Word) first.");
      return;
    }
    onSetupComplete(resume.text, role.trim(), desc);
  };

  return (
    <form
      onSubmit={handleInitialize}
      className="w-full bg-card border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Role + job description */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="interview-role"
              className="text-xs font-black uppercase tracking-wider text-brand-strong dark:text-brand flex items-center gap-1.5"
            >
              <Briefcase className="h-4 w-4" /> Target role
            </label>
            <Input
              id="interview-role"
              placeholder="e.g., Junior Fullstack AI Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="interview-desc"
              className="text-xs font-black uppercase tracking-wider text-muted-foreground"
            >
              Job description{" "}
              <span className="normal-case font-semibold tracking-normal">
                (optional, makes questions more specific)
              </span>
            </label>
            <Textarea
              id="interview-desc"
              placeholder="Paste the job posting, required skills, or anything you want the interviewer to focus on..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="min-h-40 lg:min-h-48"
            />
          </div>
        </div>

        {/* Resume */}
        <div className="space-y-2 flex flex-col">
          <p className="text-xs font-black uppercase tracking-wider text-brand-strong dark:text-brand flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Your resume
          </p>
          <ResumeDropzone state={resume} onChange={setResume} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!ready || !role.trim()}
        className="w-full font-bold h-11 rounded-lg"
      >
        <Play className="h-4 w-4 mr-2" />
        Continue to interview
      </Button>
    </form>
  );
}

function ResumeDropzone({
  state,
  onChange,
}: {
  state: ResumeState;
  onChange: (next: ResumeState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const kind = resumeFileKind(file);
    if (kind === "doc") {
      onChange({ status: "error", name: file.name, message: "Old Word (.doc) files aren't supported. Save it as .docx or PDF." });
      return;
    }
    if (kind === "other") {
      onChange({ status: "error", name: file.name, message: "Only PDF or Word (.docx) files are supported." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      onChange({ status: "error", name: file.name, message: "Files must be 10 MB or smaller." });
      return;
    }

    onChange({ status: "reading", name: file.name });
    try {
      // Same extraction as the analyze page (lib/pdf-extract.ts, lib/docx-extract.ts)
      const data = await file.arrayBuffer();
      const { text, pages } =
        kind === "docx"
          ? { ...(await extractDocxText(data)), pages: 0 }
          : await extractPdfText(data);
      if (looksScanned(text)) {
        onChange({
          status: "error",
          name: file.name,
          message:
            kind === "docx"
              ? "We couldn't find text in this Word file. If it's an image inside Word, export a text PDF instead."
              : "We couldn't find any text. This PDF may be a scanned image; try a text-based export.",
        });
        return;
      }
      onChange({
        status: "ready",
        name: file.name,
        size: file.size,
        pages,
        words: countWords(text),
        text,
      });
    } catch (err) {
      console.error("Resume file parse failed:", err);
      onChange({
        status: "error",
        name: file.name,
        message: "We couldn't read this file. It may be damaged or password-protected.",
      });
    }
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload your resume (PDF or Word)"
      onClick={() => state.status !== "reading" && openPicker()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && state.status !== "reading") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (state.status !== "reading") handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative flex-1 min-h-56 rounded-2xl border-2 border-dashed transition-colors cursor-pointer",
        "flex flex-col items-center justify-center text-center p-6 outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand/50",
        dragging
          ? "border-brand bg-brand/10"
          : state.status === "ready"
            ? "border-brand/40 bg-brand/5"
            : state.status === "error"
              ? "border-destructive/40 bg-destructive/5"
              : "border-border hover:border-brand/50 hover:bg-muted/30",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {dragging ? (
        <>
          <FileUp className="size-9 text-brand mb-3" />
          <p className="text-sm font-bold">Drop your resume here</p>
        </>
      ) : state.status === "reading" ? (
        <>
          <Loader2 className="size-9 text-brand animate-spin mb-3" />
          <p className="text-sm font-bold">Reading your resume...</p>
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
            {state.name}
          </p>
        </>
      ) : state.status === "ready" ? (
        <>
          <CheckCircle2 className="size-9 text-brand mb-3" />
          <p className="text-sm font-bold truncate max-w-full">{state.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatBytes(state.size)} ·{" "}
            {state.pages
              ? `${state.pages} ${state.pages === 1 ? "page" : "pages"}`
              : "Word document"}{" "}
            · {state.words.toLocaleString()} words
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
            >
              <RefreshCw className="size-3.5" /> Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-lg gap-1.5 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ status: "empty" });
              }}
            >
              <X className="size-3.5" /> Remove
            </Button>
          </div>
        </>
      ) : state.status === "error" ? (
        <>
          <AlertCircle className="size-9 text-destructive mb-3" />
          <p className="text-sm font-bold">{state.message}</p>
          {state.name && (
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
              {state.name}
            </p>
          )}
          <p className="text-xs font-semibold text-brand-strong dark:text-brand mt-3">
            Click or drop another file
          </p>
        </>
      ) : (
        <>
          <div className="size-12 rounded-2xl bg-brand/10 border border-brand/15 flex items-center justify-center mb-3">
            <FileUp className="size-5 text-brand-strong dark:text-brand" />
          </div>
          <p className="text-sm font-bold">
            Drag & drop your resume, or{" "}
            <span className="text-brand-strong dark:text-brand underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF or Word (.docx), up to 10 MB. Only its text is used; the file isn&apos;t stored.
          </p>
        </>
      )}
    </div>
  );
}

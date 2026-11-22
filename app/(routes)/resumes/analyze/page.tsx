"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { FileSearch } from "lucide-react";
import { toast } from "sonner";
import UploadSection from "./_components/UploadSection";
import AIAnalysisSection from "./_components/AIAnalysisSection";
import StepIndicator from "./_components/StepIndicator";
import AnalysisUsageCard, {
  type AnalyzeUsage,
} from "./_components/AnalysisUsageCard";
import RecentAnalysesList, {
  useRecentAnalyses,
} from "./_components/RecentAnalysesList";
import {
  analyzeAndStoreResumeAction,
  analyzeScannedResumeAction,
  updateResumeFileUrlAction,
} from "@/lib/actions/resume";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { getUserBillingStatus } from "@/lib/actions/billing";
import UpgradeModal from "@/components/custom/UpgradeModal";
import type { Resume } from "@/config/schema";
import { describeFreeLimit, isLimitReached } from "@/lib/plans";
import {
  SCANNED_PDF_MAX_BYTES,
  countWords,
  looksScanned,
} from "@/lib/resume-text";
import { extractPdfText } from "@/lib/pdf-extract";
import { extractDocxText } from "@/lib/docx-extract";
import { resumeFileKind } from "@/lib/docx-text";

export type ProcessStage =
  | "idle"
  | "reading"
  | "extracting"
  | "uploading_to_cloud"
  | "ai_processing"
  | "success" // text extracted, ready to analyze
  | "error";
export type ViewStep = "upload" | "analysis";
export type ExtractInfo = {
  pages: number;
  words: number;
  /** No text layer: the PDF itself will be read by the AI */
  scanned?: boolean;
  /** Word upload: text comes from the .docx; the file itself isn't archived */
  docx?: boolean;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

async function loadUsage(): Promise<AnalyzeUsage & { allowed: boolean }> {
  const billing = await getUserBillingStatus();
  return {
    isPro: Boolean(billing?.isPro),
    used: billing?.limits?.analyses ?? 0,
    allowed: Boolean(billing?.allowed?.analyze),
  };
}

const AnalyzeResumePage = () => {
  const [currentView, setCurrentView] = useState<ViewStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<ProcessStage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [info, setInfo] = useState<ExtractInfo | null>(null);
  const [errorKind, setErrorKind] = useState<"scanned" | "unreadable" | null>(
    null,
  );
  const [analysisResult, setAnalysisResult] = useState<Resume | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [usage, setUsage] = useState<
    (AnalyzeUsage & { allowed: boolean }) | null
  >(null);

  const recent = useRecentAnalyses();
  const { uploadDocument, progress: uploadProgress } = useCloudinaryUpload();

  useEffect(() => {
    let cancelled = false;
    loadUsage().then((u) => !cancelled && setUsage(u));
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUsage = () => {
    loadUsage().then(setUsage);
  };

  const reset = () => {
    setStage("idle");
    setFile(null);
    setExtractedText("");
    setInfo(null);
    setErrorKind(null);
    setProgress(0);
    setStatusMessage("");
  };

  const fail = (kind: "scanned" | "unreadable", message: string) => {
    setStage("error");
    setErrorKind(kind);
    setStatusMessage(message);
  };

  // Validate, check the plan allowance, then extract text in the browser
  const handleFile = async (targetFile: File) => {
    const kind = resumeFileKind(targetFile);
    if (kind === "doc") {
      toast.warning("Old Word (.doc) files aren't supported.", {
        description:
          "In Word, choose File → Save As → Word Document (.docx) or PDF.",
      });
      return;
    }
    if (kind === "other") {
      toast.warning("Please upload a PDF or Word (.docx) file.");
      return;
    }
    if (targetFile.size > MAX_FILE_BYTES) {
      toast.warning("That file is over 10 MB. Try a smaller file.");
      return;
    }

    const current = await loadUsage();
    setUsage(current);
    if (!current.allowed) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setFile(targetFile);
    setErrorKind(null);
    setInfo(null);
    setExtractedText("");
    setStage("reading");
    setProgress(15);
    setStatusMessage("Opening your file…");

    try {
      const arrayBuffer = await targetFile.arrayBuffer();

      // Word: mammoth keeps headings, bullets and tables (lib/docx-text.ts)
      if (kind === "docx") {
        setProgress(40);
        setStage("extracting");
        setStatusMessage("Reading your Word document…");
        const { text } = await extractDocxText(arrayBuffer);
        if (looksScanned(text)) {
          fail(
            "unreadable",
            "We couldn't find text in this Word file. If your resume is an image inside Word, export it as a PDF instead.",
          );
          return;
        }
        setExtractedText(text);
        setInfo({ pages: 0, words: countWords(text), docx: true });
        setProgress(90);
        setStage("success");
        setStatusMessage("Text extracted. Ready to analyze.");
        return;
      }

      setProgress(35);
      setStatusMessage("Loading the PDF reader…");

      // Layout-aware extraction: keeps lines, bullets and column order
      const { text: clean, pages: totalPages } = await extractPdfText(
        arrayBuffer,
        (page, total) => {
          setStage("extracting");
          setStatusMessage(`Reading page ${page} of ${total}…`);
          setProgress(Math.floor(55 + (page / total) * 35));
        },
      );
      if (looksScanned(clean)) {
        // No text layer: the AI can read the PDF itself if it's small enough
        if (targetFile.size > SCANNED_PDF_MAX_BYTES) {
          fail(
            "scanned",
            `This looks like a scan, and it's too large for the AI to read (over ${Math.round((SCANNED_PDF_MAX_BYTES / 1024 / 1024) * 10) / 10} MB). Re-save it at a lower quality, export it as a text PDF from Word or Google Docs, or build your resume in the editor.`,
          );
          return;
        }
        setExtractedText("");
        setInfo({ pages: totalPages, words: 0, scanned: true });
        setProgress(90);
        setStage("success");
        setStatusMessage("Scanned PDF: the AI will read the page images.");
        return;
      }

      setExtractedText(clean);
      setInfo({
        pages: totalPages,
        words: countWords(clean),
      });
      setProgress(90);
      setStage("success");
      setStatusMessage("Text extracted. Ready to analyze.");
    } catch (error) {
      console.error("PDF Client Parsing Failure:", error);
      fail(
        "unreadable",
        kind === "docx"
          ? "The Word file may be corrupted or password-protected. Try saving it again, or export it as a PDF."
          : "The file may be corrupted or password-protected. Try re-exporting it as a PDF.",
      );
    }
  };

  // AI analysis first, then archive the PDF (so rejected/failed runs leave no files)
  const handleAnalyze = async () => {
    const scanned = Boolean(info?.scanned);
    if (!file || (!extractedText && !scanned)) return;

    const current = await loadUsage();
    setUsage(current);
    if (!current.allowed) {
      setIsUpgradeModalOpen(true);
      return;
    }

    try {
      setStage("ai_processing");
      setProgress(92);
      setStatusMessage(
        scanned
          ? "Reading the scanned pages, then checking structure and impact…"
          : "Checking structure, keywords and impact…",
      );

      const response = scanned
        ? await analyzeScannedResumeAction(
            (() => {
              const fd = new FormData();
              fd.append("file", file);
              return fd;
            })(),
          )
        : await analyzeAndStoreResumeAction(extractedText, file.name);

      if (!response.success) {
        setStage("success"); // keep the file/text so they can retry
        setStatusMessage(
          scanned
            ? "Scanned PDF: the AI will read the page images."
            : "Text extracted. Ready to analyze.",
        );
        if (isLimitReached(response)) {
          refreshUsage();
          setIsUpgradeModalOpen(true);
        } else {
          toast.error(
            response.error || "The analysis failed. Please try again.",
          );
        }
        return;
      }

      // Archive the original PDF. Non-fatal: the analysis is already saved.
      // Word files aren't archived (the resume viewer shows PDFs; a PDF can be
      // attached later from the resume's page).
      let savedResume: Resume = response.data;
      if (!info?.docx)
        try {
          setStage("uploading_to_cloud");
          setStatusMessage("Saving the original PDF to your account…");
          const cloudUpload = await uploadDocument(file);
          const attached = await updateResumeFileUrlAction(
            savedResume.id,
            cloudUpload.secure_url,
          );
          if (!attached.success) throw new Error(attached.error);
          // Merge only the file fields (the analysis stays the plan-gated one)
          if (attached.data) savedResume = { ...savedResume, ...attached.data };
        } catch (uploadError) {
          console.error("PDF archive failed:", uploadError);
          toast.warning("Analysis saved, but the PDF couldn't be archived.", {
            description:
              "You can attach the file later from the resume's page.",
          });
        }

      setProgress(100);
      setAnalysisResult(savedResume);
      toast.success("Resume analyzed and saved!");
      setCurrentView("analysis");
      refreshUsage();
      recent.reload();
    } catch (error) {
      console.error("Analysis pipeline crash:", error);
      setStage("success");
      setStatusMessage("Text extracted. Ready to analyze.");
      toast.error("Something went wrong. Please try again.");
    }
  };

  // The upload runs after the AI step: map its 0-100% into the last stretch
  const currentProgress =
    stage === "uploading_to_cloud"
      ? 92 + Math.round(uploadProgress * 0.08)
      : progress;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
            <FileSearch className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              AI Resume Analyzer
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Get an ATS score, keyword check and line-by-line rewrite
              suggestions for your resume.
            </p>
          </div>
        </div>
        <StepIndicator currentStep={currentView} />
      </header>

      <AnimatePresence mode="wait">
        {currentView === "upload" ? (
          <div
            key="upload"
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] items-start"
          >
            <div className="min-w-0">
              <UploadSection
                stage={stage}
                file={file}
                info={info}
                extractedText={extractedText}
                errorKind={errorKind}
                statusMessage={statusMessage}
                progress={currentProgress}
                onFile={handleFile}
                onProceed={handleAnalyze}
                onReset={reset}
              />
            </div>
            <aside className="space-y-6 min-w-0">
              <AnalysisUsageCard usage={usage} />
              <RecentAnalysesList items={recent.items} failed={recent.failed} />
            </aside>
          </div>
        ) : (
          <AIAnalysisSection
            key="analysis"
            data={analysisResult}
            onBack={() => {
              setCurrentView("upload");
              setAnalysisResult(null);
              reset();
            }}
          />
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="AI Analysis Limit Reached"
        description={`Free plans include ${describeFreeLimit("analyze")}. Upgrade to Pro for unlimited resume analyses.`}
      />
    </div>
  );
};

export default AnalyzeResumePage;

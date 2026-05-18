/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { showConfetti } from "@/lib/utils";
import { ThemeToggler } from "@/components/custom/ThemeToggler";
import { toast } from "sonner";
import UploadSection from "./_components/UploadSection";
import AIAnalysisSection from "./_components/AIAnalysisSection";
import StepIndicator from "./_components/StepIndicator";

export type ProcessStage =
  | "idle"
  | "reading"
  | "extracting"
  | "success"
  | "error";
export type ViewStep = "upload" | "analysis";

const AnalyzeResumePage = () => {
  const [currentView, setCurrentView] = useState<ViewStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [stage, setStage] = useState<ProcessStage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      processPDFFile(droppedFile);
    } else {
      toast.warning("Please upload a PDF file only.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processPDFFile(selectedFile);
  };

  const processPDFFile = async (targetFile: File) => {
    setFile(targetFile);
    setStage("reading");
    setProgress(15);
    setStatusMessage("Reading your file safely...");

    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      setProgress(35);
      setStatusMessage("Warming up the parsing engine...");

      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      setProgress(55);
      setStatusMessage("Analyzing document layout and columns...");

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      setStage("extracting");
      setProgress(70);

      let extractedText = "";
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        setStatusMessage(`Reading text from page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str);
        extractedText += pageStrings.join(" ") + "\n";

        setProgress(Math.floor(70 + (i / totalPages) * 25));
      }

      setProgress(95);
      setStatusMessage("Formatting data for AI review...");

      console.log("=== RESUME EXTRACTION PAYLOAD ===");
      console.log({
        metadata: {
          fileName: targetFile.name,
          fileSize: `${(targetFile.size / 1024 / 1024).toFixed(2)} MB`,
          detectedPages: totalPages,
        },
        payload: {
          rawTextContent: extractedText.trim(),
        },
      });

      setTimeout(() => {
        setProgress(100);
        setStage("success");
        setStatusMessage("Awesome! Your resume text is ready.");
        showConfetti();
      }, 600);
    } catch (error) {
      console.error("PDF Client Parsing Failure:", error);
      setStage("error");
      setStatusMessage(
        "Oops! We couldn't read this PDF. Please check if the file is corrupted.",
      );
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    return parseFloat((bytes / k).toFixed(2)) + " KB";
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 overflow-x-hidden">
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">ResuMe</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <ThemeToggler />
          </motion.div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-12 lg:py-24 space-y-16">
        <StepIndicator currentStep={currentView} />

        <AnimatePresence mode="wait">
          {currentView === "upload" ? (
            <UploadSection
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              stage={stage}
              file={file}
              formatBytes={formatBytes}
              statusMessage={statusMessage}
              progress={progress}
              onProceed={() => setCurrentView("analysis")}
            />
          ) : (
            <AIAnalysisSection onBack={() => setCurrentView("upload")} />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default AnalyzeResumePage;

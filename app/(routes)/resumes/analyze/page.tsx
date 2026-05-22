/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import UploadSection from "./_components/UploadSection";
import AIAnalysisSection from "./_components/AIAnalysisSection";
import StepIndicator from "./_components/StepIndicator";
import { analyzeAndStoreResumeAction } from "@/lib/actions/resume";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

export type ProcessStage =
  | "idle"
  | "reading"
  | "extracting"
  | "uploading_to_cloud" // ☁️ Added stage to track active Cloudinary pushes
  | "ai_processing"
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
  const [extractedText, setExtractedText] = useState("");

  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Initialize Cloudinary custom client-side hook
  const { uploadDocument, progress: uploadProgress } = useCloudinaryUpload();

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

      let textBuffer = "";
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        setStatusMessage(`Reading text from page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items.map((item: any) => item.str);
        textBuffer += pageStrings.join(" ") + "\n";

        setProgress(Math.floor(70 + (i / totalPages) * 20));
      }

      setExtractedText(textBuffer.trim());
      setProgress(90);
      setStage("success");
      setStatusMessage("Awesome! Your resume text is ready. Let's analyze it.");
    } catch (error) {
      console.error("PDF Client Parsing Failure:", error);
      setStage("error");
      setStatusMessage(
        "Oops! We couldn't read this PDF. Please check if the file is corrupted.",
      );
    }
  };

  // Orchestrates dual cloud storage upload and Gemini text evaluation
  const handleAIAnalysisInference = async () => {
    // Debug log checks to find exactly what state is missing
    console.log("Analyzing validation:", {
      hasText: !!extractedText,
      textLength: extractedText?.length,
      hasFile: !!file,
    });

    if (!extractedText || !file) {
      toast.error(
        "Text extraction failed. This PDF might be print-optimized or image-based.",
        {
          description:
            "Try scanning a standard text-based PDF, or click 'Start Creating Your Resume' to input details directly!",
          duration: 6000,
        },
      );
      setStage("error");
      setStatusMessage("Parsing failed: No readable text characters found.");
      return;
    }

    let secureFileUrl = "";

    try {
      setStage("uploading_to_cloud");
      setStatusMessage(
        "Archiving resume document securely in cloud storage...",
      );

      console.log("Initiating Cloudinary upload...");
      const cloudUpload = await uploadDocument(file);
      secureFileUrl = cloudUpload.secure_url;
      console.log("Cloudinary upload successful! URL:", secureFileUrl);

      setStage("ai_processing");
      setProgress(95);
      setStatusMessage("AI is reviewing layout structure and keywords...");

      console.log("Invoking Gemini server analysis action pipeline...");
      const response = await analyzeAndStoreResumeAction(
        extractedText,
        file.name,
        secureFileUrl,
      );

      if (response.success && response.data) {
        setProgress(100);
        setAnalysisResult(response.data);
        toast.success("Resume processed and saved successfully!");
        setCurrentView("analysis");
      } else {
        toast.error(response.error || "Generation pipeline error.");
      }
    } catch (error: any) {
      console.error("CRITICAL PIPELINE CRASH:", error);
      setStage("error");
      setStatusMessage(error.message || "AI could not finalize the check.");
      toast.error(error.message || "Processing error execution failure.");
    }
  };

  // Track if progress reflects local text mapping or remote cloud file uploading percentages
  const currentProgress =
    stage === "uploading_to_cloud" ? uploadProgress : progress;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 overflow-x-hidden overflow-y-auto no-scrollbar w-full">
      <section className="w-full px-6 py-8 lg:py-16 space-y-16">
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
              statusMessage={statusMessage}
              progress={currentProgress} // Bind the combined progress variable
              onProceed={handleAIAnalysisInference}
            />
          ) : (
            <AIAnalysisSection
              data={analysisResult}
              onBack={() => {
                setCurrentView("upload");
                setStage("idle");
                setFile(null);
                setExtractedText("");
                setAnalysisResult(null);
              }}
            />
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default AnalyzeResumePage;

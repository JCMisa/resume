"use client";

import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layout,
  Briefcase,
  ArrowRightIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProcessStage } from "../page";

interface UploadSectionProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stage: ProcessStage;
  file: File | null;
  statusMessage: string;
  progress: number;
  onProceed: () => void;
}

const UploadSection = ({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  handleFileChange,
  stage,
  file,
  statusMessage,
  progress,
  onProceed,
}: UploadSectionProps) => {
  return (
    <motion.div
      key="upload-view"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="space-y-16"
    >
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 dark:from-foreground dark:to-foreground/40 leading-tight">
            Analyze Your Resume <br className="hidden md:block" /> with AI
            Precision
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Instantly extract and structure your career history safely right
          inside your browser. No server uploads, total privacy.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-7 space-y-6"
        >
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] overflow-hidden",
              isDragging
                ? "border-primary bg-primary/5 shadow-[0_0_40px_-10px_rgba(var(--primary),0.2)] scale-[0.99]"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
            )}
          >
            <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />

            <div
              className={cn(
                "relative mb-6 p-6 bg-primary/10 rounded-2xl text-primary transition-transform duration-500 group-hover:scale-110",
                stage === "extracting" && "animate-bounce",
              )}
            >
              <UploadCloud className="h-10 w-10" />
            </div>

            <div className="space-y-2 relative z-10">
              <p className="text-xl font-semibold">
                {stage === "idle" ? (
                  <>
                    Drop your resume or{" "}
                    <span className="text-primary underline underline-offset-4 decoration-primary/30 group-hover:decoration-primary">
                      browse files
                    </span>
                  </>
                ) : stage === "success" ? (
                  "Scan another resume"
                ) : (
                  "Reading your file..."
                )}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Supports standard PDF formats up to 10MB
              </p>
            </div>

            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/20 rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/20 rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/20 rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/20 rounded-br-lg" />
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                {stage === "success" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </motion.div>
                )}
                {stage === "error" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {stage !== "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl space-y-4 overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={cn(
                        "h-4 w-4 text-primary",
                        (stage === "reading" || stage === "extracting") &&
                          "animate-spin",
                      )}
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                      {statusMessage}
                    </span>
                  </div>
                  <span className="text-sm font-black text-primary transition-all tabular-nums">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-3 bg-primary/10" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 flex flex-col items-center justify-center h-full"
        >
          <div className="w-full aspect-[1/1.414] max-w-[360px] border border-border/40 rounded-3xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center p-8">
            <div
              className={cn(
                "w-full space-y-6 transition-all duration-1000",
                stage === "reading" || stage === "extracting"
                  ? "blur-md opacity-20 grayscale scale-95"
                  : "blur-none opacity-100",
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-200 dark:bg-stone-800 shrink-0 shadow-inner" />
                <div className="space-y-3 w-full">
                  <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-full w-3/4" />
                  <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-1/2" />
                </div>
              </div>
              <div className="h-px bg-stone-900 my-4" />
              <div className="space-y-3">
                <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-full" />
                <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-11/12" />
                <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-10/12" />
              </div>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-full w-1/2" />
                  <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-full w-1/2" />
                  <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-full" />
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-full w-1/3" />
                <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-full" />
                <div className="h-3 bg-stone-100 dark:bg-stone-900 rounded-full w-full" />
              </div>
            </div>

            <AnimatePresence>
              {stage === "idle" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-muted-foreground gap-4"
                >
                  <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200 dark:border-stone-800">
                    <Layout className="h-10 w-10 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-bold tracking-wider uppercase">
                    Live Resume Preview
                  </p>
                </motion.div>
              )}

              {(stage === "reading" ||
                stage === "extracting" ||
                stage === "uploading_to_cloud" ||
                stage === "ai_processing") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20 pointer-events-none" />
                  <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_#6366F1] animate-scan z-20" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 bg-white/80 dark:bg-black/80 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl backdrop-blur-lg">
                      <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                      <div className="text-center">
                        <p className="text-xs font-black text-primary tracking-widest uppercase mb-1">
                          {stage === "uploading_to_cloud"
                            ? "Archiving Document..."
                            : "AI is Reading..."}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {stage === "uploading_to_cloud"
                            ? "Saving original binary layout to cloud storage..."
                            : "Finding work history, skills, and education..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {stage === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 z-30"
                >
                  <div className="p-6 bg-primary/20 rounded-full border border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.3)]">
                    <Briefcase className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black drop-shadow-md">
                      Scan Complete!
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Your data is ready for AI suggestions
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onProceed}
                      className="rounded-2xl px-8 py-6 font-bold shadow-2xl transition-all"
                      size={"lg"}
                    >
                      Analyze Resume
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UploadSection;

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { createInterviewSessionAction } from "@/lib/actions/interview";

interface SetupProps {
  onSetupComplete: (
    sessionId: string,
    text: string,
    role: string,
    desc: string,
  ) => void;
}

export default function InterviewSetupForm({ onSetupComplete }: SetupProps) {
  const [role, setRole] = useState("");
  const [desc, setDesc] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF resume file.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Extracting resume text layout contents...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let textBuffer = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textBuffer +=
          textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setExtractedText(textBuffer.trim());
      toast.success("Resume text extraction successful!", { id: toastId });
    } catch (err) {
      console.log("Error on file parsing: ", err);
      toast.error("Failed to parse file structural content strings.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !extractedText) {
      toast.error(
        "Job Role position title and Resume text profile are required properties.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await createInterviewSessionAction({
        jobRole: role,
        jobDescription: desc,
        resumeText: extractedText,
      });

      if (res.success && res.id) {
        onSetupComplete(res.id, extractedText, role, desc);
        toast.success("Interview session initialized successfully!");
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Initialization failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleInitialize}
      className="max-w-xl mx-auto bg-card border p-8 rounded-3xl shadow-xl space-y-6"
    >
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Briefcase className="h-4 w-4" /> Target Professional Position Role
        </label>
        <Input
          placeholder="e.g., Junior Fullstack AI Engineer"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
          Job Description / Core Criteria Requirements (Optional)
        </label>
        <Textarea
          placeholder="Paste job descriptions, specialized framework expectations, or specific project notes here..."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Upload Interview Evaluation Resume
          Target
        </label>
        <Input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !extractedText}
        className="w-full font-bold h-11 rounded-xl"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        Initialize Interview Session Environment
      </Button>
    </form>
  );
}

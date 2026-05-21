/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2 } from "lucide-react";
import { analyzeExistingResumeAction } from "@/lib/actions/resume";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AnalyzeButtonProps {
  resumeId: string;
}

export default function AnalyzeResumeButton({ resumeId }: AnalyzeButtonProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInPlaceAnalysis = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    const toastId = toast.loading(
      "Invoking AI engine to build audit data grids...",
    );

    try {
      const response = await analyzeExistingResumeAction(resumeId);

      if (response.success) {
        toast.success("AI Analysis compiled successfully!", { id: toastId });

        // Tells Next.js to re-run the server query context and re-render page fields with fresh data
        router.refresh();
      } else {
        throw new Error(response.error || "Internal evaluation error.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Pipeline execution failed.", {
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Button
      onClick={handleInPlaceAnalysis}
      disabled={isAnalyzing}
      className="w-full mt-2 py-4 font-bold rounded-lg"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary-foreground" />
          Processing Portfolio Metrics...
        </>
      ) : (
        <>
          <SparklesIcon className="h-4 w-4 mr-2 text-primary-foreground" />
          Analyze your Resume
        </>
      )}
    </Button>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Loader2 } from "lucide-react";
import { analyzeExistingResumeAction } from "@/lib/actions/resume";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getUserBillingStatus } from "@/lib/actions/billing";
import UpgradeModal from "@/components/custom/UpgradeModal";
import { describeFreeLimit, isLimitReached } from "@/lib/plans";

interface AnalyzeButtonProps {
  resumeId: string;
  /** Compact variant for cards (default: full-width detail-page button) */
  compact?: boolean;
  className?: string;
}

export default function AnalyzeResumeButton({
  resumeId,
  compact = false,
  className,
}: AnalyzeButtonProps) {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 🚀 Local state to trigger the global plan upgrade modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleInPlaceAnalysis = async () => {
    if (isAnalyzing) return;

    // 🚀 TIER CHECK LAYER: Verify AI token limits are valid before executing the compilation pipeline
    const billing = await getUserBillingStatus();
    if (!billing || !billing.allowed || !billing.allowed.analyze) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await analyzeExistingResumeAction(resumeId);

      if (response.success) {
        toast.success("AI Analysis compiled successfully!");

        // Tells Next.js to re-run the server query context and re-render page fields with fresh data
        router.refresh();
      } else if (isLimitReached(response)) {
        setIsUpgradeModalOpen(true);
      } else {
        toast.error(response.error || "Internal evaluation error.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Pipeline execution failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleInPlaceAnalysis}
        disabled={isAnalyzing}
        size={compact ? "sm" : "default"}
        className={cn(
          compact ? "rounded-lg font-bold gap-1.5" : "w-full mt-2 py-4 font-bold rounded-lg",
          className,
        )}
      >
        {compact ? (
          <>
            {isAnalyzing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <SparklesIcon className="size-3.5" />
            )}
            {isAnalyzing ? "Analyzing…" : "Analyze"}
          </>
        ) : isAnalyzing ? (
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

      {/* 🚀 FIXED: Gated prompt overlay blocks free-tier spammers instantly */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="AI Evaluation Quota Exhausted"
        description={`Free plans include ${describeFreeLimit("analyze")}. Upgrade to Pro to unlock unlimited resume analyses and ATS auditing!`}
      />
    </>
  );
}

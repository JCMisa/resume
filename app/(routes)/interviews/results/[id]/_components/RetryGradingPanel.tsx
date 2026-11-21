"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { retryInterviewGradingAction } from "@/lib/actions/interview";

// Shown on the results page when there's no report yet: either grading failed
// after the transcript was saved (retryable), or there's nothing to grade.
export default function RetryGradingPanel({
  sessionId,
  canRetry,
}: {
  sessionId: string;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    const res = await retryInterviewGradingAction(sessionId);
    if (res.success) {
      toast.success("Your interview has been graded!");
      router.refresh(); // re-render the server page with the new report
    } else {
      toast.error(res.error);
      setRetrying(false);
    }
  }

  if (!canRetry) {
    return (
      <div className="border border-dashed p-12 text-center rounded-3xl bg-muted/10 space-y-3">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-bold text-foreground">
          No report for this session
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          This interview ended before any answers were saved, so there&apos;s
          nothing to grade.
        </p>
        <Link
          href="/interviews"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-xl font-bold mt-2",
          })}
        >
          Start a new interview
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-dashed p-12 text-center rounded-3xl bg-muted/10 space-y-3">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
      <p className="text-sm font-bold text-foreground">
        Grading didn&apos;t finish
      </p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Your answers were saved, but the AI couldn&apos;t produce your report.
        Retrying won&apos;t count as a new interview.
      </p>
      <Button
        onClick={handleRetry}
        disabled={retrying}
        className="rounded-lg px-8 font-bold gap-1.5 mt-2"
      >
        {retrying ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RotateCcw className="size-4" />
        )}
        {retrying ? "Grading your answers..." : "Retry grading"}
      </Button>
    </div>
  );
}

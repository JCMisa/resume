"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Resume } from "@/config/schema";
import AnalysisReport from "../../_components/report/AnalysisReport";

// Results step of the analyze flow: the shared report + where to go next.
const AIAnalysisSection = ({
  data,
  onBack,
}: {
  data: Resume | null;
  onBack: () => void;
}) => {
  return (
    <motion.div
      key="analysis-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Report for
          </p>
          <p className="text-base font-bold truncate">{data?.title ?? "Your resume"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack} className="rounded-lg font-bold gap-1.5">
            <ArrowLeft className="size-4" /> Analyze another
          </Button>
          {data && (
            <Link
              href={`/resumes/${data.id}`}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-lg font-bold gap-1.5")}
            >
              <FileText className="size-4" /> Open resume
            </Link>
          )}
          <Link href="/resumes" className={cn(buttonVariants(), "rounded-lg font-bold gap-1.5")}>
            All resumes <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {data?.analysis ? (
        <AnalysisReport analysis={data.analysis} resumeId={data.id} />
      ) : (
        <div className="rounded-3xl border bg-card p-6 sm:p-10 text-center text-sm text-muted-foreground">
          The analysis couldn&apos;t be loaded. Open the resume to try again.
        </div>
      )}
    </motion.div>
  );
};

export default AIAnalysisSection;

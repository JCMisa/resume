/* eslint-disable @typescript-eslint/no-explicit-any */
import { getInterviewResultDetailsAction } from "@/lib/actions/interview";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  FileText,
  Briefcase,
  AlertTriangle,
  Loader2Icon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewResultPage({ params }: PageProps) {
  const { id } = await params;
  const response = await getInterviewResultDetailsAction(id);

  if (!response.success || !response.data) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-black tracking-tight">
          Report Retrieval Failure
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mt-1">
          {response.error ||
            "The requested evaluation metrics could not be loaded from the server registries."}
        </p>
        <Link
          href="/interviews"
          className={buttonVariants({
            variant: "outline",
            className: "mt-5 rounded-xl font-bold",
          })}
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  const { session, result } = response.data;

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER META ROW */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Interview Performance Audit
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {session.jobRole}
            </p>
          </div>
        </div>
        <Link
          href="/interviews"
          className={buttonVariants({
            variant: "outline",
            className: "rounded-xl font-bold text-xs",
          })}
        >
          Simulate Another Role
        </Link>
      </header>

      {/* CORE EVALUATION SECTION BLOCK */}
      {result ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT AREA: GENERAL SCORING CARD MATRICES */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-card border p-6 rounded-3xl shadow-md text-center space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Overall Performance Score
              </p>
              <div className="relative flex items-center justify-center mx-auto size-28 rounded-full border-4 border-primary/20 bg-primary/5">
                <span className="text-3xl font-black tracking-tighter text-primary">
                  {result.overallScore || 0}
                  <span className="text-xs font-normal text-muted-foreground">
                    /100
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed pt-1">
                Parsed and evaluated natively via the Gemini AI platform.
              </p>
            </div>

            {/* RADAR METRIC SCORES LISTING */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-card border p-5 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Dimension Breakdowns
                </h3>
                <div className="space-y-3">
                  {result.suggestions.map((sug: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-muted-foreground">
                          {sug.category}
                        </span>
                        <span className="text-primary">{sug.score}%</span>
                      </div>
                      <Progress value={sug.score} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT AREA: GRANULAR TIPS, STRENGTHS & WEAKNESSES LISTS */}
          <div className="lg:col-span-8 space-y-6">
            {/* AUDIT SUMMARY SUMMARY FEEDBACK */}
            <div className="bg-card border p-6 rounded-3xl shadow-sm space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Recruiter Feedback Evaluation
              </h3>
              <p className="text-sm text-foreground leading-relaxed text-justify whitespace-pre-wrap">
                {result.feedback}
              </p>
            </div>

            {/* STRENGTHS AND WEAKNESSES GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* STRENGTHS BOX CONTAINER */}
              <div className="bg-card border p-5 rounded-3xl shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Core Key Strengths
                </h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {result.strengths && result.strengths.length > 0 ? (
                    result.strengths.map((str: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-emerald-500 mt-0.5">•</span> {str}
                      </li>
                    ))
                  ) : (
                    <li className="italic">
                      No prominent strength metrics cataloged.
                    </li>
                  )}
                </ul>
              </div>

              {/* WEAKNESSES BOX CONTAINER */}
              <div className="bg-card border p-5 rounded-3xl shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-destructive flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" /> Critical Weaknesses
                </h4>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {result.weaknesses && result.weaknesses.length > 0 ? (
                    result.weaknesses.map((wk: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-destructive mt-0.5">•</span> {wk}
                      </li>
                    ))
                  ) : (
                    <li className="italic">
                      No severe technical structural weaknesses detected.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* ACTIONABLE IMPROVEMENT RECOMMENDATIONS TIPS LIST */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-card border p-6 rounded-3xl shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 fill-primary/10" /> Strategic
                  Upgrades Recommendations
                </h3>
                <div className="divide-y border-t mt-2">
                  {result.suggestions.map((sug: any, i: number) => (
                    <div
                      key={i}
                      className="py-3 first:pt-2 last:pb-0 text-xs space-y-1"
                    >
                      <span className="font-extrabold text-foreground tracking-tight">
                        {sug.category} Optimization Rule
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        {sug.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOG ARCHIVE BOX LAYOUT */}
            <div className="bg-card border p-6 rounded-3xl shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Comprehensive Session
                Transcript Logs
              </h3>
              <div className="bg-muted/30 border rounded-2xl p-4 max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed text-stone-600 dark:text-stone-400 space-y-2 whitespace-pre-wrap">
                {session.transcript ||
                  "No raw conversational dialogue metadata compiled during this matrix tracking timeline loop."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PENDING BACKLOG PROCESSING ERROR UI FALLBACK EDGE CASE */
        <div className="border border-dashed p-12 text-center rounded-3xl bg-muted/10">
          <Loader2Icon className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-foreground">
            Parsing AI Performance Report Data Grids...
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Please wait a brief moment for the database transactions to settle.
          </p>
        </div>
      )}
    </div>
  );
}

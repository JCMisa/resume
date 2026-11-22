// Free vs Pro views of the AI reports (pure, unit-tested).
//
// Reports are generated and stored in full for every user. Before a report
// leaves the server for a Free user, the Pro-only parts are removed here and
// counted in `locked`, so the UI can show "N more with Pro" without the
// content ever reaching the browser. Upgrading unlocks reports already made.
import { FREE_REPORT } from "@/lib/plans";
import type { ResumeAnalysisData } from "@/lib/analysis-types";
import type { JobMatchData } from "@/lib/job-match";

export function gateAnalysis(
  analysis: ResumeAnalysisData | null | undefined,
  isPro: boolean,
): ResumeAnalysisData | null {
  if (!analysis) return null;
  if (isPro) return analysis;

  // Rewrites: keep the first N (weakest-first order from the model)
  let kept = 0;
  let lockedRewrites = 0;
  const bulletAudit = analysis.bulletAudit?.map((b) => {
    if (!b.rewrite) return b;
    if (kept < FREE_REPORT.bulletRewrites) {
      kept += 1;
      return b;
    }
    lockedRewrites += 1;
    return { ...b, rewrite: "" };
  });

  const improvements = analysis.improvements.slice(0, FREE_REPORT.improvements);
  const suggested = analysis.skills?.suggested ?? [];

  return {
    ...analysis,
    bulletAudit,
    improvements,
    skills: analysis.skills ? { ...analysis.skills, suggested: [] } : analysis.skills,
    locked: {
      bulletRewrites: lockedRewrites,
      improvements: analysis.improvements.length - improvements.length,
      suggestedSkills: suggested.length,
    },
  };
}

export function gateJobMatch(result: JobMatchData, isPro: boolean): JobMatchData {
  if (isPro) return result;
  const tailoredBullets = result.tailoredBullets.slice(0, FREE_REPORT.tailoredBullets);
  return {
    ...result,
    tailoredSummary: "",
    tailoredBullets,
    locked: {
      tailoredSummary: Boolean(result.tailoredSummary),
      tailoredBullets: result.tailoredBullets.length - tailoredBullets.length,
    },
  };
}

/** Apply gateAnalysis to a resume row (or anything with an `analysis`). */
export function gateResume<T extends { analysis: ResumeAnalysisData | null }>(row: T, isPro: boolean): T {
  return { ...row, analysis: gateAnalysis(row.analysis, isPro) };
}

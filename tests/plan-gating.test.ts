import { describe, expect, it } from "vitest";
import { gateAnalysis, gateJobMatch, gateResume } from "@/lib/plan-gating";
import { FREE_REPORT } from "@/lib/plans";
import type { ResumeAnalysisData } from "@/lib/analysis-types";
import type { JobMatchData } from "@/lib/job-match";

const bullet = (i: number, rewrite: string) => ({
  context: "Acme",
  text: `Bullet ${i}`,
  rating: (rewrite ? "weak" : "strong") as "weak" | "strong",
  issues: [],
  rewrite,
});

const analysis: ResumeAnalysisData = {
  overallScore: 70,
  readability: "Good",
  keyKeywords: ["React"],
  summary: "s",
  strengths: [],
  weaknesses: [],
  improvements: Array.from({ length: 7 }, (_, i) => ({ section: "x", current: "a", suggested: `s${i}`, reason: "r" })),
  gapsDetected: [],
  analysisVersion: 2,
  bulletAudit: [
    bullet(1, "R1"),
    bullet(2, ""), // strong: no rewrite, doesn't use up the free quota
    bullet(3, "R3"),
    bullet(4, "R4"),
    bullet(5, "R5"),
    bullet(6, "R6"),
  ],
  skills: { hard: ["TS"], soft: [], tools: [], suggested: ["GraphQL", "Jest"] },
};

describe("gateAnalysis", () => {
  it("returns Pro reports untouched", () => {
    expect(gateAnalysis(analysis, true)).toBe(analysis);
  });

  it("keeps every bullet rating for Free, but only the first N rewrites", () => {
    const g = gateAnalysis(analysis, false)!;
    expect(g.bulletAudit).toHaveLength(6); // all bullets still rated
    expect(g.bulletAudit!.map((b) => b.rewrite)).toEqual(["R1", "", "R3", "R4", "", ""]);
    expect(g.locked?.bulletRewrites).toBe(2);
    expect(FREE_REPORT.bulletRewrites).toBe(3);
  });

  it("trims rewrites and hides suggested skills, counting what was locked", () => {
    const g = gateAnalysis(analysis, false)!;
    expect(g.improvements).toHaveLength(FREE_REPORT.improvements);
    expect(g.skills?.suggested).toEqual([]);
    expect(g.skills?.hard).toEqual(["TS"]);
    expect(g.locked).toEqual({ bulletRewrites: 2, improvements: 4, suggestedSkills: 2 });
  });

  it("never leaks locked text anywhere in the payload", () => {
    const json = JSON.stringify(gateAnalysis(analysis, false));
    for (const secret of ["R5", "R6", "GraphQL", "Jest", "s3", "s6"]) {
      expect(json).not.toContain(`"${secret}"`);
    }
  });

  it("does not mutate the stored analysis", () => {
    gateAnalysis(analysis, false);
    expect(analysis.bulletAudit![4].rewrite).toBe("R5");
    expect(analysis.improvements).toHaveLength(7);
  });

  it("handles missing or v1 analyses", () => {
    expect(gateAnalysis(null, false)).toBeNull();
    const v1 = { ...analysis, bulletAudit: undefined, skills: undefined, analysisVersion: undefined };
    expect(gateAnalysis(v1, false)?.locked).toEqual({ bulletRewrites: 0, improvements: 4, suggestedSkills: 0 });
  });

  it("gateResume swaps the analysis on a row", () => {
    const row = { id: "r1", analysis };
    expect(gateResume(row, false).analysis?.improvements).toHaveLength(3);
    expect(gateResume(row, false).id).toBe("r1");
  });
});

describe("gateJobMatch", () => {
  const match = {
    tailoredSummary: "Secret summary",
    tailoredBullets: [
      { original: "a", rewrite: "B1", reason: "" },
      { original: "b", rewrite: "B2", reason: "" },
      { original: "c", rewrite: "B3", reason: "" },
    ],
  } as JobMatchData;

  it("hides the tailored summary and all but the first bullet for Free", () => {
    const g = gateJobMatch(match, false);
    expect(g.tailoredSummary).toBe("");
    expect(g.tailoredBullets.map((b) => b.rewrite)).toEqual(["B1"]);
    expect(g.locked).toEqual({ tailoredSummary: true, tailoredBullets: 2 });
    expect(JSON.stringify(g)).not.toContain("Secret summary");
  });

  it("returns Pro results untouched", () => {
    expect(gateJobMatch(match, true)).toBe(match);
  });
});

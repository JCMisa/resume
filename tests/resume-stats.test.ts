import { describe, expect, it } from "vitest";
import {
  computeStats,
  monthlyActivity,
  nextBestAction,
  scoreDistribution,
  scoreTrend,
  sectionCompleteness,
  toLibraryItem,
  topKeywords,
  type ResumeLibraryItem,
} from "@/lib/resume-stats";

type Row = Parameters<typeof toLibraryItem>[0];

const fullContent: Row["content"] = {
  personalDetails: { name: "Alex", email: "alex@example.com" },
  professionalSummary: "Engineer",
  skills: [{ id: "s", category: "Lang", value: "TS" }],
  experiences: [{ id: "e", company: "Acme", role: "Dev", duration: "2y", bullets: [] }],
  projects: [{ id: "p", title: "App", duration: "", description: [] }],
  educations: [{ id: "d", schoolName: "U", course: "CS", duration: "" }],
  sectionOrder: [],
};

const analysis = (overallScore: number, extra: Partial<NonNullable<Row["analysis"]>> = {}) => ({
  overallScore,
  readability: "Good",
  keyKeywords: [],
  summary: "",
  strengths: [],
  weaknesses: [],
  improvements: [],
  gapsDetected: [],
  ...extra,
});

const row = (o: Partial<Row> & { id: string }): Row => ({
  title: o.id,
  category: "General",
  status: "parsed",
  fileUrl: null,
  content: fullContent,
  analysis: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...o,
});

describe("sectionCompleteness", () => {
  it("is 100% when all six core sections have content", () => {
    expect(sectionCompleteness(fullContent)).toEqual({ completeness: 100, missingSections: [] });
  });

  it("lists missing sections and handles empty content", () => {
    const r = sectionCompleteness({ ...fullContent, projects: [], professionalSummary: " " });
    expect(r.completeness).toBe(67);
    expect(r.missingSections).toEqual(["Summary", "Projects"]);
    expect(sectionCompleteness(null).completeness).toBe(0);
  });
});

describe("toLibraryItem", () => {
  it("uses the usage-log date as analyzedAt, and none when not analyzed", () => {
    const logged = new Date("2026-03-05T10:00:00Z");
    expect(toLibraryItem(row({ id: "a", analysis: analysis(70) }), logged).analyzedAt).toBe(logged.toISOString());
    expect(toLibraryItem(row({ id: "b", analysis: analysis(70) })).analyzedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(toLibraryItem(row({ id: "c" }), logged).analyzedAt).toBeNull();
  });

  it("never exposes a non-numeric score", () => {
    const bad = row({ id: "x", analysis: { ...analysis(0), overallScore: "oops" as unknown as number } });
    expect(toLibraryItem(bad).score).toBeNull();
  });
});

describe("stats", () => {
  const items: ResumeLibraryItem[] = [
    toLibraryItem(row({ id: "old", analysis: analysis(55) }), new Date("2026-01-10T00:00:00Z")),
    toLibraryItem(row({ id: "new", analysis: analysis(85) }), new Date("2026-03-10T00:00:00Z")),
    toLibraryItem(row({ id: "built", status: "created", content: { ...fullContent, projects: [] } })),
  ];

  it("computes KPIs, with the delta from first to latest analysis", () => {
    expect(computeStats(items)).toEqual({
      total: 3,
      analyzed: 2,
      uploaded: 2,
      built: 1,
      notAnalyzed: 1,
      avgScore: 70,
      bestScore: 85,
      scoreDelta: 30,
      avgCompleteness: 94,
    });
  });

  it("has no delta with fewer than two analyses, and no averages when empty", () => {
    expect(computeStats(items.slice(0, 1)).scoreDelta).toBeNull();
    expect(computeStats([])).toMatchObject({ total: 0, avgScore: null, bestScore: null, avgCompleteness: 0 });
  });

  it("orders the trend by analysis date, not by input order", () => {
    expect(scoreTrend([...items].reverse()).map((p) => p.id)).toEqual(["old", "new"]);
  });

  it("buckets scores and always returns every bucket", () => {
    const d = scoreDistribution(items);
    expect(d).toHaveLength(6);
    expect(d.find((b) => b.bucket === "50s")?.count).toBe(1);
    expect(d.find((b) => b.bucket === "80s")?.count).toBe(1);
    expect(d.reduce((a, b) => a + b.count, 0)).toBe(2);
  });
});

describe("monthlyActivity", () => {
  it("returns the last N UTC months oldest-first and ignores older dates", () => {
    const now = new Date("2026-11-22T00:00:00Z");
    const out = monthlyActivity(
      [new Date("2026-11-01T00:00:00Z"), new Date("2026-11-20T00:00:00Z"), new Date("2026-04-30T00:00:00Z")],
      [new Date("2026-06-15T00:00:00Z")],
      6,
      now,
    );
    expect(out.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(out[5]).toMatchObject({ month: "Nov", analyses: 2, built: 0 });
    expect(out[0]).toMatchObject({ analyses: 0, built: 1 });
  });

  it("crosses the year boundary", () => {
    const out = monthlyActivity([], [], 3, new Date("2027-01-15T00:00:00Z"));
    expect(out.map((m) => m.key)).toEqual(["2026-11", "2026-12", "2027-01"]);
  });
});

describe("topKeywords", () => {
  it("counts each keyword once per resume, case-insensitively", () => {
    const k = topKeywords([
      { analysis: analysis(70, { keyKeywords: ["React", "react", "SQL"] }) },
      { analysis: analysis(70, { keyKeywords: ["REACT", " "] }) },
      { analysis: null },
    ]);
    expect(k).toEqual([
      { keyword: "React", count: 2 },
      { keyword: "SQL", count: 1 },
    ]);
  });
});

describe("nextBestAction", () => {
  it("asks new users to start", () => {
    expect(nextBestAction([], new Map())).toEqual({ kind: "start" });
  });

  it("prioritizes the weakest resume's top rewrite", () => {
    const tip = { section: "experience", current: "a", suggested: "Shipped X", reason: "impact" };
    const rows = [
      row({ id: "weak", analysis: analysis(52, { improvements: [tip] }) }),
      row({ id: "ok", analysis: analysis(75, { improvements: [tip] }) }),
      row({ id: "none" }),
    ];
    const items = rows.map((r) => toLibraryItem(r));
    const a = nextBestAction(items, new Map(rows.map((r) => [r.id, r.analysis])));
    expect(a).toMatchObject({ kind: "improve", id: "weak", score: 52, suggested: "Shipped X" });
  });

  it("then unanalyzed resumes, then incomplete ones, then nothing", () => {
    const strong = row({ id: "strong", analysis: analysis(90) });
    const unanalyzed = row({ id: "todo" });
    const incomplete = row({ id: "thin", analysis: analysis(92), content: { ...fullContent, skills: [] } });
    const map = (rs: Row[]) => new Map(rs.map((r) => [r.id, r.analysis]));

    expect(nextBestAction([strong, unanalyzed].map((r) => toLibraryItem(r)), map([strong, unanalyzed]))).toMatchObject({ kind: "analyze", id: "todo" });
    expect(nextBestAction([strong, incomplete].map((r) => toLibraryItem(r)), map([strong, incomplete]))).toMatchObject({ kind: "complete", id: "thin", missing: ["Skills"] });
    expect(nextBestAction([toLibraryItem(strong)], map([strong]))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  buildAnalysis,
  computeChecks,
  computeMetrics,
  computeSubScores,
  dateStyle,
  employmentGaps,
  hasPronoun,
  hasWeakPhrase,
  isQuantified,
  overallFromSubScores,
  parseabilityScore,
  yearsOfExperience,
} from "@/lib/resume-checks";
import { sanitizeAiAnalysis } from "@/lib/resume-sanitize";
import { ANALYSIS_VERSION, SUBSCORE_WEIGHTS, type Position } from "@/lib/analysis-types";
import type { Resume } from "@/config/schema";

type Content = Resume["content"];

const NOW = new Date("2026-11-22T00:00:00Z");

const strong: Content = {
  personalDetails: {
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: "+1 555 010 0100",
    links: [{ label: "LinkedIn", url: "https://linkedin.com/in/alex-example" }],
  },
  professionalSummary: "Frontend engineer with 4 years building React apps.",
  skills: [{ id: "s", category: "Languages", value: "TypeScript, JavaScript" }],
  experiences: [
    {
      id: "e1",
      company: "Acme",
      role: "Frontend Engineer",
      duration: "Jan 2022 – Present",
      bullets: ["Cut checkout load time 38% by rebuilding it in Next.js", "Led a TypeScript migration across 40k lines"],
    },
    {
      id: "e2",
      company: "Widgets",
      role: "Junior Developer",
      duration: "Jun 2020 – Dec 2021",
      bullets: ["Built 6 internal dashboards with React", "Shipped a design system used across the product"],
    },
  ],
  projects: [{ id: "p", title: "OpenNotes", duration: "2023", description: ["Grew to 2,000 users"] }],
  educations: [{ id: "d", schoolName: "State University", course: "BS CS", duration: "2016 – 2020" }],
  certificates: [],
  sectionOrder: [],
};

const positions: Position[] = [
  { company: "Acme", title: "Frontend Engineer", start: "2022-01", end: "present" },
  { company: "Widgets", title: "Junior Developer", start: "2020-06", end: "2021-12" },
];

const longText = "word ".repeat(500);

describe("bullet signals", () => {
  it("detects quantified bullets (numbers, %, currency, number words)", () => {
    expect(isQuantified("Cut costs 30%")).toBe(true);
    expect(isQuantified("Saved $2M")).toBe(true);
    expect(isQuantified("Mentored three engineers")).toBe(true);
    expect(isQuantified("Improved the onboarding experience")).toBe(false);
  });

  it("detects weak openers and first-person pronouns", () => {
    expect(hasWeakPhrase("Responsible for the API")).toBe(true);
    expect(hasWeakPhrase("• Helped the team ship")).toBe(true);
    expect(hasWeakPhrase("Designed the API")).toBe(false);
    expect(hasPronoun("I built the API")).toBe(true);
    expect(hasPronoun("Built our API")).toBe(true);
    expect(hasPronoun("Built the API")).toBe(false);
  });
});

describe("computeMetrics", () => {
  it("counts bullets from experiences and projects", () => {
    const m = computeMetrics(strong, longText);
    expect(m.bulletCount).toBe(5);
    expect(m.quantifiedBullets).toBe(4); // "Led a TypeScript migration across 40k lines" has 40
    expect(m.quantifiedRate).toBe(80);
    expect(m.wordCount).toBe(500);
  });

  it("falls back to the structured content's text when raw text is missing", () => {
    expect(computeMetrics(strong).wordCount).toBeGreaterThan(40);
  });
});

describe("career timeline", () => {
  it("computes years with overlapping roles counted once", () => {
    const overlapping: Position[] = [
      { company: "A", title: "x", start: "2020-01", end: "2020-12" },
      { company: "B", title: "y", start: "2020-07", end: "2021-06" },
    ];
    expect(yearsOfExperience(overlapping, NOW)).toBe(1.5);
    expect(yearsOfExperience([], NOW)).toBeNull();
  });

  it("finds gaps of 3+ months between roles, but not short ones", () => {
    const ps: Position[] = [
      { company: "A", title: "x", start: "2018-01", end: "2019-03" },
      { company: "B", title: "y", start: "2019-05", end: "2020-01" }, // 1-month gap: ignored
      { company: "C", title: "z", start: "2020-09", end: "present" }, // 7-month gap
    ];
    expect(employmentGaps(ps, NOW)).toEqual([{ from: "2020-02", to: "2020-08", months: 7 }]);
  });

  it("reports a current gap when the last role ended a while ago", () => {
    const ps: Position[] = [{ company: "A", title: "x", start: "2020-01", end: "2026-01" }];
    expect(employmentGaps(ps, NOW)).toEqual([{ from: "2026-02", to: "present", months: 9 }]);
  });

  it("ignores roles with unknown dates", () => {
    expect(employmentGaps([{ company: "A", title: "x", start: "", end: "" }], NOW)).toEqual([]);
  });

  it("classifies date styles", () => {
    expect(dateStyle("Jan 2022 – Present")).toBe("month-name");
    expect(dateStyle("01/2022 - 03/2023")).toBe("numeric");
    expect(dateStyle("2019 – 2021")).toBe("year");
    expect(dateStyle("")).toBeNull();
  });
});

describe("computeChecks", () => {
  it("passes a complete, well-formed resume", () => {
    const checks = computeChecks(strong, computeMetrics(strong, longText), positions);
    const failing = checks.filter((c) => c.status !== "pass").map((c) => c.id);
    expect(failing).toEqual([]);
    expect(parseabilityScore(checks)).toBe(100);
  });

  it("flags missing contact info, sections, mixed dates and weak bullets", () => {
    const weak: Content = {
      personalDetails: { name: "Sam", email: "not-an-email" },
      experiences: [
        { id: "1", company: "A", role: "Dev", duration: "Jan 2022 – Present", bullets: ["Responsible for I built things"] },
        { id: "2", company: "B", role: "Dev", duration: "01/2020 - 12/2021", bullets: ["Worked on stuff", "Helped the team"] },
      ],
      sectionOrder: [],
    };
    const checks = computeChecks(weak, computeMetrics(weak, "short text"), [
      { company: "A", title: "Dev", start: "2022-01", end: "present" },
      { company: "B", title: "Dev", start: "", end: "" },
    ]);
    const status = Object.fromEntries(checks.map((c) => [c.id, c.status]));
    expect(status).toMatchObject({
      email: "fail",
      phone: "warn",
      linkedin: "warn",
      sections: "warn", // education + skills missing (experience present)
      dates: "warn",
      date_format: "warn",
      length: "warn",
      quantified: "fail",
      action_verbs: "warn",
      pronouns: "warn",
      role_detail: "warn",
      summary: "warn",
    });
    expect(parseabilityScore(checks)).toBeLessThan(60);
  });

  it("fails the sections check when there's no experience at all", () => {
    const c = computeChecks({ sectionOrder: [] }, computeMetrics({ sectionOrder: [] }, longText), []);
    expect(c.find((x) => x.id === "sections")?.status).toBe("fail");
  });
});

describe("scores", () => {
  it("weights sum to 1", () => {
    const sum = Object.values(SUBSCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("blends AI judgment with computed signals", () => {
    const metrics = computeMetrics(strong, longText);
    const checks = computeChecks(strong, metrics, positions);
    const s = computeSubScores({ impact: 50, keywords: 70, clarity: 90 }, metrics, checks, strong);
    expect(s.atsParseability).toBe(100);
    expect(s.impact).toBe(70); // 50*0.6 + 100*0.4 (80% quantified caps at 100)
    expect(s.keywords).toBe(70);
    expect(s.clarity).toBe(90);
    expect(s.completeness).toBe(100);
    expect(overallFromSubScores(s)).toBe(Math.round(100 * 0.25 + 70 * 0.25 + 70 * 0.2 + 90 * 0.15 + 100 * 0.15));
  });

  it("keeps the overall score in 1-100", () => {
    expect(overallFromSubScores({ atsParseability: 0, impact: 0, keywords: 0, clarity: 0, completeness: 0 })).toBe(1);
  });
});

describe("buildAnalysis", () => {
  it("produces a v2 analysis with a computed overall score and the v1 fields", () => {
    const ai = sanitizeAiAnalysis({
      scores: { impact: 60, keywords: 70, clarity: 80 },
      readability: "Good",
      summary: "Solid.",
      positions,
      targetRole: "Frontend Engineer",
      seniority: "mid",
      firstImpression: "Credible mid-level frontend engineer.",
    });
    const a = buildAnalysis(ai, strong, longText, NOW);
    expect(a.analysisVersion).toBe(ANALYSIS_VERSION);
    expect(a.overallScore).toBe(overallFromSubScores(a.subScores!));
    expect(a.summary).toBe("Solid.");
    expect(a.careerProfile).toMatchObject({
      targetRole: "Frontend Engineer",
      seniority: "mid",
      yearsExperience: 6.5, // Jun 2020 – Nov 2026 continuous (roles back-to-back) = 78 months
      employmentGaps: [],
    });
    expect(a.checks?.length).toBeGreaterThan(5);
  });

  it("is deterministic for the same input", () => {
    const ai = sanitizeAiAnalysis({ scores: { impact: 55, keywords: 65, clarity: 75 }, positions });
    expect(buildAnalysis(ai, strong, longText, NOW)).toEqual(buildAnalysis(ai, strong, longText, NOW));
  });
});

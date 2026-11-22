import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECTION_ORDER,
  AI_LIMITS,
  sanitizeAiAnalysis,
  sanitizeContent,
  sanitizeParsedResume,
} from "@/lib/resume-sanitize";
import { countWords, looksScanned } from "@/lib/resume-text";

const scores = { impact: 60, keywords: 70, clarity: 80 };

describe("sanitizeAiAnalysis", () => {
  it("clamps and rounds the AI sub-scores to 0-100", () => {
    const a = sanitizeAiAnalysis({ scores: { impact: -5, keywords: 180, clarity: "64.4" } });
    expect(a.scores).toEqual({ impact: 0, keywords: 100, clarity: 64 });
  });

  it("throws when a sub-score is missing (so the call is retried, not saved)", () => {
    expect(() => sanitizeAiAnalysis({})).toThrow(/impact/);
    expect(() => sanitizeAiAnalysis(null)).toThrow();
    expect(() => sanitizeAiAnalysis({ scores: { impact: 1, keywords: 2 } })).toThrow(/clarity/);
  });

  it("normalizes enums, falling back to safe defaults", () => {
    const a = sanitizeAiAnalysis({ scores, readability: "fair", seniority: "SENIOR" });
    expect(a.readability).toBe("Fair");
    expect(a.seniority).toBe("senior");
    const b = sanitizeAiAnalysis({ scores, readability: "amazing", seniority: "wizard" });
    expect(b.readability).toBe("Good");
    expect(b.seniority).toBe("mid");
  });

  it("normalizes position dates to YYYY-MM / present / unknown", () => {
    const a = sanitizeAiAnalysis({
      scores,
      positions: [
        { company: "Acme", title: "Dev", start: "2021-3", end: "Present" },
        { company: "Beta", title: "Intern", start: "2019", end: "2020-13" },
        { company: "", title: "" },
      ],
    });
    expect(a.positions).toEqual([
      { company: "Acme", title: "Dev", start: "2021-03", end: "present" },
      { company: "Beta", title: "Intern", start: "2019-01", end: "" },
    ]);
  });

  it("cleans the bullet audit: no rewrite for strong bullets, unknown ratings become ok", () => {
    const a = sanitizeAiAnalysis({
      scores,
      bulletAudit: [
        { context: "Acme", text: "Cut costs 30%", rating: "strong", issues: [], rewrite: "should drop" },
        { context: "Acme", text: "Did stuff", rating: "meh", issues: ["Vague", 3], rewrite: "Shipped [X]" },
        { text: "" },
      ],
    });
    expect(a.bulletAudit).toEqual([
      { context: "Acme", text: "Cut costs 30%", rating: "strong", issues: [], rewrite: "" },
      { context: "Acme", text: "Did stuff", rating: "ok", issues: ["Vague"], rewrite: "Shipped [X]" },
    ]);
  });

  it("caps list sizes so stored reports stay bounded", () => {
    const many = Array.from({ length: 50 }, (_, i) => `k${i}`);
    const a = sanitizeAiAnalysis({ scores, keyKeywords: many, skills: { suggested: many } });
    expect(a.keyKeywords).toHaveLength(AI_LIMITS.keywords);
    expect(a.skills.suggested).toHaveLength(AI_LIMITS.suggestedSkills);
    expect(a.skills.hard).toEqual([]);
  });

  it("coerces lists and drops improvements without a suggestion", () => {
    const a = sanitizeAiAnalysis({
      scores,
      keyKeywords: [" React ", "", 42, "Next.js"],
      strengths: "not a list",
      improvements: [
        { section: "experience", current: "did stuff", suggested: "Shipped X", reason: "impact" },
        { section: "summary", current: "a", suggested: "", reason: "b" },
        "garbage",
      ],
    });
    expect(a.keyKeywords).toEqual(["React", "Next.js"]);
    expect(a.strengths).toEqual([]);
    expect(a.readability).toBe("Good"); // default
    expect(a.improvements).toHaveLength(1);
    expect(a.improvements[0].suggested).toBe("Shipped X");
  });
});

describe("sanitizeContent", () => {
  it("adds ids and the default section order the editor needs", () => {
    const c = sanitizeContent({
      skills: [{ category: "Languages", value: "TypeScript" }],
      experiences: [{ company: "Acme", role: "Engineer", bullets: ["Built it"] }],
    });
    expect(c.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
    expect(c.sectionOrder).not.toBe(DEFAULT_SECTION_ORDER); // a copy, not shared
    expect(typeof c.skills?.[0].id).toBe("string");
    expect(c.experiences?.[0].id).not.toBe(c.skills?.[0].id);
  });

  it("uses the singular section keys (experience/education), not field names", () => {
    expect(DEFAULT_SECTION_ORDER).toContain("experience");
    expect(DEFAULT_SECTION_ORDER).toContain("education");
    expect(DEFAULT_SECTION_ORDER).not.toContain("experiences");
  });

  it("drops empty entries and defaults a missing skill category", () => {
    const c = sanitizeContent({
      skills: [{ value: "Go" }, { category: "X", value: "  " }],
      experiences: [{ company: "", role: "" }, { role: "Dev" }],
      projects: [
        { title: "" },
        { title: "App", links: [{ url: "https://x.dev" }, { label: "no url" }] },
      ],
      educations: [{ schoolName: "State U" }],
      certificates: [{ title: "" }],
    });
    expect(c.skills).toEqual([{ id: expect.any(String), category: "Skills", value: "Go" }]);
    expect(c.experiences).toHaveLength(1);
    expect(c.projects).toHaveLength(1);
    expect(c.projects?.[0].links).toEqual([{ label: "https://x.dev", url: "https://x.dev" }]);
    expect(c.educations?.[0].major).toBeUndefined();
    expect(c.certificates).toEqual([]);
  });

  it("survives completely malformed input", () => {
    const c = sanitizeContent("nonsense");
    expect(c.personalDetails?.name).toBe("");
    expect(c.skills).toEqual([]);
    expect(c.sectionOrder).toHaveLength(DEFAULT_SECTION_ORDER.length);
  });

  it("sanitizes the combined parse + analysis response", () => {
    const r = sanitizeParsedResume({
      content: { personalDetails: { name: " Alex " } },
      analysis: { scores: { impact: 81, keywords: 70, clarity: 75 } },
    });
    expect(r.content.personalDetails?.name).toBe("Alex");
    expect(r.ai.scores.impact).toBe(81);
    expect(() => sanitizeParsedResume({ content: {} })).toThrow();
  });
});

describe("extracted PDF text", () => {
  it("flags image-only / scanned PDFs", () => {
    expect(looksScanned("")).toBe(true);
    expect(looksScanned("   \n  Page 1  \n ")).toBe(true);
    expect(looksScanned("Experienced engineer ".repeat(20))).toBe(false);
  });

  it("counts words across whitespace and newlines", () => {
    expect(countWords("  Alex Rivera\nFrontend   engineer ")).toBe(4);
    expect(countWords("")).toBe(0);
  });
});

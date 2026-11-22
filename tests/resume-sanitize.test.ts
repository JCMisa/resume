import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECTION_ORDER,
  sanitizeAnalysis,
  sanitizeContent,
  sanitizeParsedResume,
} from "@/lib/resume-sanitize";
import { countWords, looksScanned } from "@/lib/resume-text";

describe("sanitizeAnalysis", () => {
  it("clamps the score to 1-100 and rounds it", () => {
    expect(sanitizeAnalysis({ overallScore: -5 }).overallScore).toBe(1);
    expect(sanitizeAnalysis({ overallScore: 180 }).overallScore).toBe(100);
    expect(sanitizeAnalysis({ overallScore: "64.4" }).overallScore).toBe(64);
  });

  it("throws when the score is missing (so the call is retried, not saved)", () => {
    expect(() => sanitizeAnalysis({})).toThrow();
    expect(() => sanitizeAnalysis(null)).toThrow();
  });

  it("coerces lists and drops improvements without a suggestion", () => {
    const a = sanitizeAnalysis({
      overallScore: 70,
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
      analysis: { overallScore: 81 },
    });
    expect(r.content.personalDetails?.name).toBe("Alex");
    expect(r.analysis.overallScore).toBe(81);
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

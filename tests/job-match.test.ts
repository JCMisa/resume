import { describe, expect, it } from "vitest";
import {
  MATCH_WEIGHTS,
  buildJobMatch,
  containsTerm,
  experienceScore,
  requirementsScore,
  resolveStatus,
  sanitizeJobMatchAi,
  termVariants,
} from "@/lib/job-match";

const RESUME = `
Alex Rivera — Frontend Engineer
Built dashboards in React and TypeScript; APIs in Node.js with Postgres.
Set up CI/CD with GitHub Actions. Deployed on AWS. Wrote C++ tools and some Django apps.
Led a team of 4 engineers.`;

describe("containsTerm (exact keyword matching)", () => {
  it("matches whole terms case-insensitively", () => {
    expect(containsTerm(RESUME, "react")).toBe(true);
    expect(containsTerm(RESUME, "TYPESCRIPT")).toBe(true);
    expect(containsTerm(RESUME, "Vue")).toBe(false);
  });

  it("treats common aliases as the same skill", () => {
    expect(containsTerm(RESUME, "PostgreSQL")).toBe(true); // resume says Postgres
    expect(containsTerm(RESUME, "NodeJS")).toBe(true); // resume says Node.js
    expect(containsTerm(RESUME, "Amazon Web Services")).toBe(true); // resume says AWS
    expect(containsTerm(RESUME, "Continuous Integration")).toBe(true); // resume says CI/CD
  });

  it("doesn't match short terms inside longer words", () => {
    expect(containsTerm(RESUME, "Go")).toBe(false); // "Django" must not count as Go
    expect(containsTerm("Wrote emails to clients", "AI")).toBe(false);
    expect(containsTerm("Node.js services", "JS")).toBe(false); // the .js of Node.js isn't JavaScript
  });

  it("handles terms with symbols", () => {
    expect(containsTerm(RESUME, "C++")).toBe(true);
    expect(containsTerm(RESUME, "C#")).toBe(false);
    expect(containsTerm("Expert in C#, .NET", "C#")).toBe(true);
  });

  it("matches word forms of single-word terms (light stemming)", () => {
    expect(containsTerm("Mentored two junior developers", "Mentoring")).toBe(true);
    expect(containsTerm("Mentoring program lead", "Mentors")).toBe(true);
    expect(containsTerm("Tested the API", "Testing")).toBe(false); // stem "test" too short to stem safely
    expect(containsTerm("Mentorship program", "Mentoring")).toBe(false); // different word
  });

  it("lists aliases for known terms only", () => {
    expect(termVariants("K8s")).toContain("kubernetes");
    expect(termVariants("Figma")).toEqual(["figma"]);
  });
});

describe("resolveStatus", () => {
  it("exact term present wins, even if the AI said missing", () => {
    expect(resolveStatus(RESUME, "React", "missing")).toBe("found");
  });
  it("AI found it but the exact term is absent -> implied (add the keyword)", () => {
    expect(resolveStatus(RESUME, "Team leadership", "found")).toBe("implied");
  });
  it("stays missing when neither", () => {
    expect(resolveStatus(RESUME, "Kubernetes", "missing")).toBe("missing");
  });
});

describe("scores", () => {
  it("weights required x2 and counts implied as half", () => {
    expect(
      requirementsScore([
        { importance: "required", status: "found" }, // 2/2
        { importance: "required", status: "implied" }, // 1/2
        { importance: "preferred", status: "missing" }, // 0/1
      ]),
    ).toBe(60); // 3 / 5
    expect(requirementsScore([])).toBe(0);
  });

  it("experience: full marks when met or not required, scaled below", () => {
    expect(experienceScore(null, 2)).toBe(100);
    expect(experienceScore(5, 6)).toBe(100);
    expect(experienceScore(5, 2.5)).toBe(50);
    expect(experienceScore(5, null)).toBe(50);
  });

  it("weights sum to 1", () => {
    expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe("sanitizeJobMatchAi", () => {
  const base = {
    titleFit: 80,
    requirements: [{ term: "React", category: "tool", importance: "required", status: "found", evidence: "Dashboards" }],
  };

  it("requires a title fit score and at least one requirement (else retry)", () => {
    expect(() => sanitizeJobMatchAi({ ...base, titleFit: undefined })).toThrow(/title fit/);
    expect(() => sanitizeJobMatchAi({ ...base, requirements: [] })).toThrow(/requirements/);
  });

  it("dedupes requirements, normalizes enums and years", () => {
    const a = sanitizeJobMatchAi({
      ...base,
      requiredYears: 0,
      candidateYears: "4.25",
      requirements: [
        ...base.requirements,
        { term: "react", category: "tool", importance: "required", status: "found" },
        { term: "Kubernetes", category: "weird", importance: "must", status: "?" },
      ],
    });
    expect(a.requirements.map((r) => r.term)).toEqual(["React", "Kubernetes"]);
    expect(a.requirements[1]).toMatchObject({ category: "hard", importance: "preferred", aiStatus: "missing" });
    expect(a.requiredYears).toBeNull(); // 0 = not stated
    expect(a.candidateYears).toBe(4.3);
  });
});

describe("buildJobMatch", () => {
  const ai = sanitizeJobMatchAi({
    jobTitle: "Senior Frontend Engineer",
    company: "Globex",
    requiredYears: 5,
    candidateYears: 3,
    titleFit: 70,
    requirements: [
      { term: "React", category: "tool", importance: "required", status: "found", evidence: "" },
      { term: "TypeScript", category: "hard", importance: "required", status: "missing", evidence: "" },
      { term: "Kubernetes", category: "tool", importance: "required", status: "missing", evidence: "" },
      { term: "Mentoring", category: "soft", importance: "preferred", status: "implied", evidence: "Led a team" },
      { term: "GraphQL", category: "tool", importance: "preferred", status: "found", evidence: "" },
    ],
  });

  it("re-checks every requirement against the resume text and scores the match", () => {
    const m = buildJobMatch(ai, RESUME, 6);
    const status = Object.fromEntries(m.requirements.map((r) => [r.term, r.status]));
    expect(status).toEqual({
      React: "found",
      TypeScript: "found", // AI missed it; the exact term is there
      Kubernetes: "missing",
      Mentoring: "implied",
      GraphQL: "implied", // AI claimed found, but the term isn't in the resume
    });
    // requirements: (2 + 2 + 0 + 0.5 + 0.5) / 8 = 62.5 -> 63; experience: known 6 >= 5 -> 100; titleFit 70
    expect(m.breakdown).toEqual({ requirements: 63, experience: 100, titleFit: 70 });
    expect(m.matchScore).toBe(Math.round(63 * 0.6 + 100 * 0.2 + 70 * 0.2));
    expect(m.candidateYears).toBe(6); // code-computed years win over the AI's estimate
  });

  it("lists keywords to add: non-found skills/tools, required first, no soft skills", () => {
    expect(buildJobMatch(ai, RESUME).missingKeywords).toEqual(["Kubernetes", "GraphQL"]);
  });
});

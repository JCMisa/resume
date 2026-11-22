import { describe, expect, it } from "vitest";
import { hasCandidateAnswers, parseInterviewGrade } from "@/lib/interview";

describe("hasCandidateAnswers", () => {
  it("is true when the candidate said something", () => {
    expect(hasCandidateAnswers("[ASSISTANT]: Hi\n[USER]: I led the migration")).toBe(true);
  });

  it("is false for empty, assistant-only, or blank answers", () => {
    expect(hasCandidateAnswers(null)).toBe(false);
    expect(hasCandidateAnswers("")).toBe(false);
    expect(hasCandidateAnswers("[ASSISTANT]: Tell me about yourself")).toBe(false);
    expect(hasCandidateAnswers("[ASSISTANT]: Hi\n[USER]:   ")).toBe(false);
  });

  it("only counts [USER] at the start of a line", () => {
    expect(hasCandidateAnswers("[ASSISTANT]: say [USER]: hello")).toBe(false);
  });
});

describe("parseInterviewGrade", () => {
  const valid = {
    overallScore: 78,
    feedback: "Solid answers.",
    strengths: ["Clear", "  ", 3],
    weaknesses: ["Rambling"],
    suggestions: [
      { category: "Communication", score: 140, tip: "Be concise" },
      { category: "Depth", score: "abc", tip: "Add metrics" },
      { category: 5, score: 50, tip: "dropped" },
      null,
    ],
  };

  it("parses and cleans a typical response", () => {
    const g = parseInterviewGrade(JSON.stringify(valid));
    expect(g.overallScore).toBe(78);
    expect(g.strengths).toEqual(["Clear"]); // blanks and non-strings removed
    expect(g.suggestions).toEqual([
      { category: "Communication", score: 100, tip: "Be concise" }, // clamped
      { category: "Depth", score: 0, tip: "Add metrics" }, // NaN -> 0
    ]);
  });

  it("clamps and rounds the overall score to 1-100", () => {
    const score = (overallScore: unknown) =>
      parseInterviewGrade(JSON.stringify({ ...valid, overallScore })).overallScore;
    expect(score(0)).toBe(1);
    expect(score(250)).toBe(100);
    expect(score("72.6")).toBe(73);
  });

  it("defaults missing optional fields", () => {
    expect(parseInterviewGrade(JSON.stringify({ overallScore: 50 }))).toEqual({
      overallScore: 50,
      feedback: "",
      strengths: [],
      weaknesses: [],
      suggestions: [],
    });
  });

  it("throws on empty, invalid JSON, or a missing score (so grading can be retried)", () => {
    expect(() => parseInterviewGrade(undefined)).toThrow();
    expect(() => parseInterviewGrade("not json")).toThrow();
    expect(() => parseInterviewGrade(JSON.stringify({ feedback: "x" }))).toThrow(
      /overall score/,
    );
  });
});

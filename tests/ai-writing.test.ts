import { describe, expect, it } from "vitest";
import {
  addSkills,
  aiWriteBlocker,
  applyTailor,
  bulletAt,
  parseAiWriteTask,
  resumeForPrompt,
  sanitizeBullets,
  sanitizeSkillSuggestions,
  sanitizeSummaryOptions,
  sanitizeTailor,
} from "@/lib/ai-writing";
import { sanitizeEditorContent } from "@/lib/resume-editor";

const content = sanitizeEditorContent({
  personalDetails: { name: "Ada", email: "ada@example.com", phone: "+1 555 0100" },
  professionalSummary: "Engineer.",
  skills: [
    { id: "s1", category: "Languages", value: "TypeScript, Go" },
    { id: "s2", category: "Tools", value: "" },
  ],
  experiences: [
    { id: "e1", role: "Engineer", company: "Acme", duration: "2020 - Present", bullets: ["**Built** the API", "", "Led a team of 4"] },
  ],
  projects: [{ id: "p1", title: "CLI", duration: "", description: ["Wrote a CLI"] }],
});

describe("tasks", () => {
  it("accepts only known tasks", () => {
    expect(parseAiWriteTask({ kind: "summary" })).toEqual({ kind: "summary" });
    expect(parseAiWriteTask({ kind: "bullets", section: "projects", index: "2" })).toEqual({ kind: "bullets", section: "projects", index: 2 });
    expect(parseAiWriteTask({ kind: "bullets", section: "educations", index: 0 })).toBeNull();
    expect(parseAiWriteTask({ kind: "bullets", section: "experience", index: -1 })).toBeNull();
    expect(parseAiWriteTask("summary")).toBeNull();
  });

  it("blocks tasks with nothing to work from (before spending an action)", () => {
    const blank = sanitizeEditorContent({});
    expect(aiWriteBlocker(blank, { kind: "summary" })).toMatch(/Add some/);
    expect(aiWriteBlocker(blank, { kind: "bullets", section: "experience", index: 0 })).toMatch(/no longer exists/);
    const untitled = sanitizeEditorContent({ experiences: [{ id: "x", role: "", company: "", duration: "", bullets: [""] }] });
    expect(aiWriteBlocker(untitled, { kind: "bullets", section: "experience", index: 0 })).toMatch(/role title/);
    expect(aiWriteBlocker(content, { kind: "summary" })).toBeNull();
  });

  it("the prompt has plain text, no contact details, and stable bullet ids", () => {
    const text = resumeForPrompt(content, { bulletIds: true });
    expect(text).not.toContain("ada@example.com");
    expect(text).not.toContain("+1 555");
    expect(text).not.toContain("**");
    expect(text).toContain("[e0.b0] Built the API");
    expect(text).toContain("[e0.b1] Led a team of 4"); // the empty bullet is skipped
    expect(text).toContain("[p0.b0] Wrote a CLI");
  });
});

describe("sanitizing model output", () => {
  it("summaries: plain, unique, capped at 3", () => {
    const out = sanitizeSummaryOptions({
      options: ["**Senior** engineer who ships fast products.", "Senior engineer who ships fast products.", "- Builder of reliable APIs at scale.", "short", "Fourth option that is long enough.", "Fifth option that is long enough."],
    });
    expect(out).toEqual(["Senior engineer who ships fast products.", "Builder of reliable APIs at scale.", "Fourth option that is long enough."]);
    expect(() => sanitizeSummaryOptions({ options: [] })).toThrow();
  });

  it("bullets: strip bullet marks, drop junk", () => {
    expect(sanitizeBullets({ bullets: ["• Cut costs by [X%]", "1. Shipped v2", "ok", 5] })).toEqual(["Cut costs by [X%]", "Shipped v2"]);
  });

  it("skills: skip ones already listed (any case), default category", () => {
    expect(
      sanitizeSkillSuggestions({ skills: [{ category: "Languages", skill: "typescript" }, { category: "", skill: "Docker" }, { skill: "docker" }] }, content.skills),
    ).toEqual([{ category: "Skills", skill: "Docker" }]);
  });
});

describe("applying", () => {
  it("addSkills joins existing categories and fills empty rows", () => {
    let n = 0;
    const next = addSkills(content.skills, [
      { category: "languages", skill: "Rust" },
      { category: "Tools", skill: "Docker" },
      { category: "Cloud", skill: "AWS" },
      { category: "Languages", skill: "Go" },
    ], () => `new${++n}`);
    expect(next).toEqual([
      { id: "s1", category: "Languages", value: "TypeScript, Go" },
      { id: "s2", category: "Tools", value: "Docker" },
      { id: "new1", category: "Languages", value: "Rust" },
      { id: "new2", category: "Cloud", value: "AWS" },
    ]);
  });

  it("bullet ids skip empty bullets", () => {
    expect(bulletAt(content, "e0.b1")).toEqual({ section: "experience", entry: 0, bullet: 2, text: "Led a team of 4" });
    expect(bulletAt(content, "e0.b5")).toBeNull();
    expect(bulletAt(content, "x0.b0")).toBeNull();
  });

  it("tailor: originals come from the resume; unchanged or unknown ids are dropped", () => {
    const r = sanitizeTailor(
      {
        jobTitle: "Backend Engineer",
        summary: "Backend engineer focused on reliable APIs and team leadership.",
        bullets: [
          { id: "e0.b0", rewrite: "Built a REST API serving [N] clients", reason: "Uses 'REST'", original: "fake" },
          { id: "e0.b1", rewrite: "Led a team of 4", reason: "same" },
          { id: "e9.b0", rewrite: "Invented things", reason: "" },
        ],
        keywords: [{ category: "Tools", skill: "Kubernetes" }, { category: "Languages", skill: "Go" }],
      },
      content,
    );
    expect(r.bullets).toHaveLength(1);
    expect(r.bullets[0]).toMatchObject({ id: "e0.b0", original: "Built the API", bullet: 0 });
    expect(r.keywords).toEqual([{ category: "Tools", skill: "Kubernetes" }]);

    const out = applyTailor(content, r, { summary: true, bulletIds: ["e0.b0"], keywords: r.keywords });
    expect(out.applied).toBe(3);
    expect(out.content.professionalSummary).toBe(r.summary);
    expect(out.content.experiences![0].bullets).toEqual(["Built a REST API serving [N] clients", "", "Led a team of 4"]);
    expect(out.content.skills!.find((s) => s.category === "Tools")?.value).toBe("Kubernetes");

    // The user edited the bullet after asking: leave it alone
    const edited = { ...content, experiences: [{ ...content.experiences![0], bullets: ["Built the new API", "", "Led a team of 4"] }] };
    const skipped = applyTailor(edited, r, { summary: false, bulletIds: ["e0.b0"], keywords: [] });
    expect(skipped).toMatchObject({ applied: 0, skipped: 1 });
  });
});

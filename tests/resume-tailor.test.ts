import { describe, expect, it } from "vitest";
import {
  buildTailorChanges,
  compareScores,
  finalizeTailoredContent,
  hasPlaceholder,
  numbersIn,
  pickOfferedSkills,
  previewScore,
  sanitizeTailorAi,
  sanitizeTailoredFor,
  tailoredTitle,
  unsupportedTerms,
} from "@/lib/resume-tailor";
import { sanitizeEditorContent } from "@/lib/resume-editor";

const original = sanitizeEditorContent({
  personalDetails: { name: "Ada", email: "ada@example.com", phone: "+1 555 0100" },
  professionalSummary: "Engineer who builds web apps.",
  skills: [
    { id: "s1", category: "Languages", value: "TypeScript, Go" },
    { id: "s2", category: "Tools", value: "Docker" },
  ],
  experiences: [
    { id: "e1", role: "Engineer", company: "Acme", duration: "2020 - Present", bullets: ["**Built** the API", "Led a team of 4"] },
    { id: "e2", role: "Intern", company: "Initech", duration: "2019", bullets: [] },
  ],
  projects: [{ id: "p1", title: "CLI", duration: "", description: ["Wrote a CLI"], links: [] }],
  educations: [{ id: "ed1", schoolName: "MIT", course: "BS CS", major: "", duration: "2015 - 2019", gwa: "" }],
});

let n = 0;
const ids = () => `id${++n}`;

describe("fact guard", () => {
  const raw = {
    jobTitle: "Backend Engineer",
    company: "Globex",
    summary: "Backend engineer focused on Go APIs and team leadership.",
    summaryReason: "Leads with Go, the job's main language",
    experiences: [
      {
        index: 0,
        // The AI tries to change facts: ignored, only bullets are taken
        role: "Senior Staff Engineer",
        company: "Google",
        bullets: ["Built a REST API in Go for the platform", "Led a team of 4 engineers"],
        reason: "Uses the job's terms",
      },
      { index: 1, bullets: ["Invented a whole new bullet"], reason: "x" }, // had none: rejected
      { index: 9, bullets: ["Ghost role"], reason: "x" }, // doesn't exist
    ],
    projects: [{ index: 0, bullets: ["Wrote a CLI that saved [X] hours"], reason: "x" }], // placeholder: rejected
    skills: [
      { category: "Backend", skill: "Go" },
      { category: "Backend", skill: "Kubernetes" }, // not on the resume: never added here
      { category: "Languages", skill: "typescript" },
    ],
    sectionOrder: ["experience", "skills", "bogus", "summary"],
    keywords: [
      { term: "Go", importance: "required" },
      { term: "Kubernetes", importance: "required" },
      { term: "go", importance: "preferred" }, // duplicate
      { term: "Mentoring", importance: "preferred" },
    ],
    missingSkills: [{ category: "Cloud", skill: "Kubernetes" }, { category: "Languages", skill: "Go" }],
  };
  const draft = sanitizeTailorAi(raw, original, ids);

  it("keeps employers, titles, dates, education and contact details from the original", () => {
    expect(draft.content.experiences![0]).toMatchObject({ id: "e1", role: "Engineer", company: "Acme", duration: "2020 - Present" });
    expect(draft.content.experiences).toHaveLength(2);
    expect(draft.content.educations).toEqual(original.educations);
    expect(draft.content.personalDetails).toEqual(original.personalDetails);
    expect(draft.jobTitle).toBe("Backend Engineer");
  });

  it("takes rewritten summary and bullets, but never invents bullets or placeholders", () => {
    expect(draft.content.professionalSummary).toBe(raw.summary);
    expect(draft.content.experiences![0].bullets).toEqual(raw.experiences[0].bullets);
    expect(draft.content.experiences![1].bullets).toEqual([]); // no bullets before -> none invented
    expect(draft.content.projects![0].description).toEqual(["Wrote a CLI"]); // placeholder rewrite rejected
    expect(draft.reasons).toEqual({ summary: "Leads with Go, the job's main language", "experience:0": "Uses the job's terms" });
  });

  it("rejects bullet lists that drop or pad too much", () => {
    const tooFew = sanitizeTailorAi({ experiences: [{ index: 0, bullets: [] }] }, original, ids);
    expect(tooFew.content.experiences![0].bullets).toEqual(original.experiences![0].bullets);
    const tooMany = sanitizeTailorAi({ experiences: [{ index: 0, bullets: ["One long bullet", "Two long bullet", "Three long bullet", "Four long bullet"] }] }, original, ids);
    expect(tooMany.content.experiences![0].bullets).toEqual(original.experiences![0].bullets);
  });

  it("reorders skills using only the resume's own skills, and loses none", () => {
    expect(draft.content.skills!.map((s) => `${s.category}:${s.value}`)).toEqual(["Backend:Go", "Languages:TypeScript", "Tools:Docker"]);
  });

  it("section order: known keys, all kept, contact details first", () => {
    expect(draft.content.sectionOrder.slice(0, 4)).toEqual(["personal", "experience", "skills", "summary"]);
    expect(new Set(draft.content.sectionOrder)).toEqual(new Set(original.sectionOrder));
  });

  it("keywords deduped; suggested skills skip ones already listed", () => {
    expect(draft.keywords.map((k) => k.term)).toEqual(["Go", "Kubernetes", "Mentoring"]);
    expect(draft.suggestedSkills).toEqual([{ category: "Cloud", skill: "Kubernetes" }]);
  });

  it("an empty or broken answer leaves the resume as it was", () => {
    const same = sanitizeTailorAi("nonsense", original, ids);
    expect(same.content).toEqual(original);
    expect(same.keywords).toEqual([]);
  });

  it("a rewrite must keep every number and add none", () => {
    const dropped = sanitizeTailorAi({ experiences: [{ index: 0, bullets: ["Built the API", "Led a team"] }] }, original, ids);
    expect(dropped.content.experiences![0].bullets).toEqual(original.experiences![0].bullets);
    const added = sanitizeTailorAi({ experiences: [{ index: 0, bullets: ["Built the API for 300 users", "Led a team of 4"] }] }, original, ids);
    expect(added.content.experiences![0].bullets).toEqual(original.experiences![0].bullets);
    expect([...numbersIn("Cut costs 40% for 1,200 users, 500+ downloads")]).toEqual(["40", "1200", "500"]);
  });

  it("a rewrite can't claim a named tool the resume never mentions; general skills are fine", () => {
    const keywords = [
      { term: "Kubernetes", importance: "required" as const, kind: "tool" as const },
      { term: "mentoring", importance: "preferred" as const, kind: "skill" as const },
    ];
    const claim = sanitizeTailorAi(
      { keywords, experiences: [{ index: 0, bullets: ["Built the API on Kubernetes", "Led a team of 4"] }] },
      original,
      ids,
    );
    expect(claim.content.experiences![0].bullets).toEqual(original.experiences![0].bullets);
    const soft = sanitizeTailorAi(
      { keywords, experiences: [{ index: 0, bullets: ["Built the API", "Led and mentored a team of 4"] }] },
      original,
      ids,
    );
    expect(soft.content.experiences![0].bullets).toEqual(["Built the API", "Led and mentored a team of 4"]);
    expect(unsupportedTerms("Ran Kubernetes", "TypeScript, Go", keywords)).toEqual(["Kubernetes"]);
  });

  it("a summary can't add numbers or named tools the resume doesn't have", () => {
    const keywords = [{ term: "Kubernetes", importance: "required" as const, kind: "tool" as const }];
    expect(sanitizeTailorAi({ keywords, summary: "Engineer with 10 years of Go experience." }, original, ids).content.professionalSummary).toBe(
      original.professionalSummary,
    );
    expect(sanitizeTailorAi({ keywords, summary: "Go engineer running Kubernetes clusters." }, original, ids).content.professionalSummary).toBe(
      original.professionalSummary,
    );
    expect(sanitizeTailorAi({ keywords, summary: "Go engineer who led a team of 4." }, original, ids).content.professionalSummary).toBe(
      "Go engineer who led a team of 4.",
    );
  });

  it("spots placeholders", () => {
    expect(hasPlaceholder("Cut costs by [X%]")).toBe(true);
    expect(hasPlaceholder("Served XX users")).toBe(true);
    expect(hasPlaceholder("Cut costs by 30%")).toBe(false);
  });
});

describe("before/after score and changes", () => {
  const draft = sanitizeTailorAi(
    {
      summary: "Backend engineer focused on Go APIs and mentoring.",
      experiences: [{ index: 0, bullets: ["Built a REST API in Go", "Led a team of 4"], reason: "Go first" }],
      skills: [{ category: "Languages", skill: "Go" }],
      keywords: [
        { term: "Go", importance: "required", kind: "tool" },
        { term: "Kubernetes", importance: "required", kind: "tool" },
        { term: "Mentoring", importance: "preferred", kind: "skill" },
      ],
    },
    original,
    ids,
  );
  const finalContent = finalizeTailoredContent(draft.content, [{ category: "Cloud", skill: "Kubernetes" }]);

  it("scores exact terms before and after (required count double)", () => {
    const s = compareScores(original, finalContent, draft.keywords);
    // Before: Go found (2 of 5 points) -> 40; after: all three -> 100
    expect(s.score).toEqual({ before: 40, after: 100 });
    expect(s.keywords.find((k) => k.term === "Kubernetes")).toMatchObject({ before: false, after: true });
  });

  it("lists what changed and why", () => {
    const changes = buildTailorChanges(original, finalContent, draft.reasons, [{ category: "Cloud", skill: "Kubernetes" }]);
    expect(changes.map((c) => c.label)).toEqual(["Summary", "Engineer at Acme", "Skills order", "Added skills"]);
    expect(changes[1]).toMatchObject({ before: ["Built the API", "Led a team of 4"], reason: "Go first" });
    expect(changes[3].after).toEqual(["Kubernetes"]);
    expect(buildTailorChanges(original, original, {})).toEqual([]);
  });
});

describe("review step preview", () => {
  it("ticking a skill that matches a missing keyword raises the preview score", () => {
    const kw = [
      { term: "React", importance: "required" as const, after: true },
      { term: "Kubernetes", importance: "required" as const, after: false },
      { term: "Jest", importance: "preferred" as const, after: false },
    ];
    expect(previewScore(kw, [])).toBe(40); // 2 of 5 points
    expect(previewScore(kw, [{ category: "Cloud", skill: "Kubernetes" }])).toBe(80);
    expect(previewScore(kw, [{ category: "Cloud", skill: "Kubernetes" }, { category: "Testing", skill: "Jest" }])).toBe(100);
    expect(previewScore([], [])).toBe(0);
  });
});

describe("review step", () => {
  it("only skills that were offered can be confirmed", () => {
    const offered = [{ category: "Cloud", skill: "Kubernetes" }, { category: "Tools", skill: "Terraform" }];
    expect(
      pickOfferedSkills([{ skill: "kubernetes" }, { skill: "Rust" }, { skill: "Kubernetes" }, "junk"], offered),
    ).toEqual([{ category: "Cloud", skill: "Kubernetes" }]);
    expect(pickOfferedSkills(null, offered)).toEqual([]);
  });
});

describe("titles and the stored record", () => {
  it("names the tailored resume", () => {
    expect(tailoredTitle("Frontend Developer", "Acme")).toBe("Resume · Acme · Frontend Developer");
    expect(tailoredTitle("", "")).toBe("Tailored resume");
    expect(tailoredTitle("x".repeat(200), "Acme").length).toBeLessThanOrEqual(100);
  });

  it("reads stored records safely", () => {
    expect(sanitizeTailoredFor(null)).toBeNull();
    expect(sanitizeTailoredFor({ version: 2 })).toBeNull();
    const r = sanitizeTailoredFor({
      version: 1,
      jobTitle: "Dev",
      company: "Acme",
      jobDescription: "JD",
      source: "weird",
      score: { before: 41.6, after: 250 },
      keywords: [{ term: "Go", importance: "x", before: false, after: true }, { nope: 1 }],
      changes: [{ section: "bogus", label: "Summary", before: ["a", 5], after: ["b"], reason: "r" }],
    })!;
    expect(r.source).toBe("resume");
    expect(r.stage).toBe("done"); // anything but "review" is finished
    expect(r.suggestedSkills).toEqual([]);
    expect(r.score).toEqual({ before: 42, after: 100 });
    expect(r.keywords).toEqual([{ term: "Go", importance: "required", before: false, after: true }]);
    expect(r.changes[0]).toMatchObject({ section: "summary", before: ["a"] });
  });
});

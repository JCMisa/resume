import { describe, expect, it } from "vitest";
import {
  DEFAULT_TITLE,
  EDITOR_LIMITS,
  TITLE_MAX,
  blankContent,
  cloneContent,
  copyTitle,
  normalizeResumeTitle,
  normalizeSectionOrder,
  sanitizeEditorContent,
} from "@/lib/resume-editor";
import { DEFAULT_SECTION_ORDER } from "@/lib/resume-sanitize";
import {
  DEFAULT_TEMPLATE,
  SAMPLE_CONTENT,
  TEMPLATES,
  TEMPLATE_IDS,
  contactParts,
  groupSkills,
  isTemplateId,
  linksOf,
  resolveTemplate,
  safeLinkUrl,
  sectionHasContent,
  visibleSections,
} from "@/lib/resume-templates";

describe("sanitizeEditorContent", () => {
  it("fills every field for junk input", () => {
    const c = sanitizeEditorContent("nope");
    expect(c.personalDetails).toEqual({ name: "", phone: "", email: "", address: "", links: [] });
    expect(c.experiences).toEqual([]);
    expect(c.sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
  });

  it("keeps half-filled entries and the user's ids (unlike the AI sanitizer)", () => {
    const c = sanitizeEditorContent({
      experiences: [{ id: "abc-1", company: "", role: "", duration: "", bullets: [""] }],
    });
    expect(c.experiences).toEqual([{ id: "abc-1", company: "", role: "", duration: "", bullets: [""] }]);
  });

  it("caps lengths and counts, strips control characters, keeps spaces", () => {
    const c = sanitizeEditorContent({
      personalDetails: { name: "Ada \u0007Lovelace ", phone: 123 },
      professionalSummary: "x".repeat(10_000),
      experiences: Array.from({ length: 50 }, () => ({ bullets: Array.from({ length: 40 }, () => "b") })),
    });
    expect(c.personalDetails!.name).toBe("Ada Lovelace ");
    expect(c.personalDetails!.phone).toBe("");
    expect(c.professionalSummary).toHaveLength(EDITOR_LIMITS.long);
    expect(c.experiences).toHaveLength(EDITOR_LIMITS.items);
    expect(c.experiences![0].bullets).toHaveLength(EDITOR_LIMITS.bullets);
  });

  it("replaces unsafe ids", () => {
    const c = sanitizeEditorContent({ skills: [{ id: "<script>", category: "A", value: "B" }] });
    expect(c.skills![0].id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("normalizeSectionOrder", () => {
  it("keeps known keys once and appends missing ones", () => {
    expect(normalizeSectionOrder(["skills", "skills", "bogus", "personal"])).toEqual([
      "skills",
      "personal",
      "summary",
      "experience",
      "projects",
      "education",
      "certificates",
    ]);
    expect(normalizeSectionOrder(null)).toEqual(DEFAULT_SECTION_ORDER);
  });
});

describe("blank / clone / titles", () => {
  it("prefills name and email", () => {
    const c = blankContent({ name: "Ada", email: "ada@example.com" });
    expect(c.personalDetails).toMatchObject({ name: "Ada", email: "ada@example.com" });
  });

  it("clones with new ids and the same content", () => {
    const copy = cloneContent(SAMPLE_CONTENT);
    expect(copy.experiences![0].id).not.toBe(SAMPLE_CONTENT.experiences![0].id);
    expect(copy.experiences![0].role).toBe(SAMPLE_CONTENT.experiences![0].role);
  });

  it("normalizes titles", () => {
    expect(normalizeResumeTitle("  My   CV \n")).toBe("My CV");
    expect(normalizeResumeTitle("   ")).toBe(DEFAULT_TITLE);
    expect(normalizeResumeTitle("x".repeat(500))).toHaveLength(TITLE_MAX);
  });

  it("copy titles drop our suffixes and don't stack", () => {
    expect(copyTitle("Jane Resume (AI Analyzed)")).toBe("Copy of Jane Resume");
    expect(copyTitle("Copy of Jane Resume")).toBe("Copy of Jane Resume");
  });
});

describe("templates", () => {
  it("every id resolves, unknown ones fall back to the default", () => {
    for (const id of TEMPLATE_IDS) expect(TEMPLATES[id].id).toBe(id);
    expect(resolveTemplate("nope").id).toBe(DEFAULT_TEMPLATE);
    expect(resolveTemplate(null).id).toBe(DEFAULT_TEMPLATE);
    expect(isTemplateId("modern")).toBe(true);
    expect(isTemplateId("designer")).toBe(false);
  });

  it("all free templates are ATS-safe", () => {
    for (const id of TEMPLATE_IDS) {
      if (TEMPLATES[id].tier === "free") expect(TEMPLATES[id].atsSafe).toBe(true);
    }
  });

  it("groups skills by category in first-seen order", () => {
    expect(
      groupSkills([
        { id: "1", category: "Tools", value: "Git" },
        { id: "2", category: "Languages", value: "TS" },
        { id: "3", category: "Tools", value: "Docker" },
        { id: "4", category: "", value: "Leadership" },
        { id: "5", category: "Tools", value: "  " },
      ]),
    ).toEqual([
      { category: "Tools", values: ["Git", "Docker"] },
      { category: "Languages", values: ["TS"] },
      { category: "Skills", values: ["Leadership"] },
    ]);
  });

  it("only prints sections with content, in the user's order", () => {
    const c = sanitizeEditorContent({
      personalDetails: { name: "Ada" },
      experiences: [{ role: "", company: "" }],
      educations: [{ schoolName: "MIT" }],
      sectionOrder: ["education", "experience", "personal"],
    });
    expect(sectionHasContent(c, "experience")).toBe(false);
    expect(visibleSections(c)).toEqual(["education", "personal"]);
  });

  it("contact parts and links skip blanks", () => {
    expect(contactParts({ name: "A", phone: " ", email: "a@b.co", address: "Manila" })).toEqual(["a@b.co", "Manila"]);
    expect(linksOf([{ label: "", url: "https://github.com/ada" }, { label: "x", url: "" }])).toEqual([
      { label: "github.com/ada", url: "https://github.com/ada" },
    ]);
  });

  it("only makes safe links clickable", () => {
    expect(safeLinkUrl("https://ok.com")).toBe("https://ok.com");
    expect(safeLinkUrl("linkedin.com/in/ada")).toBe("https://linkedin.com/in/ada");
    expect(safeLinkUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeLinkUrl("javascript:alert(1)")).toBeNull();
    expect(safeLinkUrl("data:text/html,hi")).toBeNull();
  });
});

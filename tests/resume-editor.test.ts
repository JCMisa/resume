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

import {
  addCustomSection,
  addEntry,
  groupsToSkills,
  moveEntry,
  removeCustomSection,
  removeEntry,
  skillsToGroups,
} from "@/lib/resume-editor";
import { effectiveTemplate, sectionTitle } from "@/lib/resume-templates";

describe("document-mode operations", () => {
  const base = () => sanitizeEditorContent({ experiences: [{ id: "a", role: "A" }, { id: "b", role: "B" }] });

  it("adds, moves and removes entries without touching the original", () => {
    const c = base();
    const added = addEntry(c, "experience");
    expect(added.content.experiences).toHaveLength(3);
    expect(c.experiences).toHaveLength(2);
    expect(moveEntry(c, "experience", "b", -1).experiences!.map((e) => e.id)).toEqual(["b", "a"]);
    expect(moveEntry(c, "experience", "a", -1)).toBe(c); // already first: unchanged
    expect(removeEntry(c, "experience", "a").experiences!.map((e) => e.id)).toEqual(["b"]);
  });

  it("custom sections join and leave the section order", () => {
    const { content, id } = addCustomSection(base(), "Languages");
    expect(content.customSections).toEqual([{ id, title: "Languages", body: "" }]);
    expect(content.sectionOrder.at(-1)).toBe(`custom:${id}`);
    expect(sectionTitle(content, `custom:${id}`)).toBe("Languages");
    const removed = removeCustomSection(content, id!);
    expect(removed.customSections).toEqual([]);
    expect(removed.sectionOrder).not.toContain(`custom:${id}`);
  });

  it("caps custom sections", () => {
    let c = base();
    for (let i = 0; i < EDITOR_LIMITS.customSections; i++) c = addCustomSection(c).content;
    expect(addCustomSection(c).id).toBeNull();
  });

  it("sanitizer keeps custom keys only for sections that exist", () => {
    const c = sanitizeEditorContent({
      customSections: [{ id: "x1", title: "Awards", body: "**Best**" }],
      sectionOrder: ["custom:x1", "custom:gone", "summary"],
    });
    expect(c.sectionOrder[0]).toBe("custom:x1");
    expect(c.sectionOrder).not.toContain("custom:gone");
    expect(c.sectionOrder).toContain("experience");
  });

  it("skills rows round-trip, keep ids and empty rows", () => {
    const skills = [
      { id: "1", category: "Tools", value: "Git" },
      { id: "2", category: "Tools", value: "Docker" },
    ];
    const groups = skillsToGroups(skills);
    expect(groups).toEqual([{ category: "Tools", values: "Git, Docker" }]);
    const back = groupsToSkills([...groups, { category: "Languages", values: "" }], skills);
    expect(back.map((s) => [s.id, s.category, s.value])).toEqual([
      ["1", "Tools", "Git"],
      ["2", "Tools", "Docker"],
      [back[2].id, "Languages", ""],
    ]);
  });

  it("design: renamed headings, text size and dividers", () => {
    const c = sanitizeEditorContent({
      design: { textScale: "lg", dividers: false, sectionTitles: { experience: "Work History", bogus: "x" }, junk: 1 },
    });
    expect(c.design).toEqual({ textScale: "lg", dividers: false, sectionTitles: { experience: "Work History" } });
    expect(sectionTitle(c, "experience")).toBe("Work History");
    expect(sectionTitle(c, "education")).toBe("Education");
    const t = effectiveTemplate(TEMPLATES.classic, c.design);
    expect(t.size.body).toBeGreaterThan(TEMPLATES.classic.size.body);
    expect(t.heading.rule).toBe(false);
    expect(effectiveTemplate(TEMPLATES.classic, undefined)).toEqual(TEMPLATES.classic);
  });
});

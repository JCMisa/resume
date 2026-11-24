import { describe, expect, it } from "vitest";
import {
  SHARE_CODE_LENGTH,
  codeFromBytes,
  fileSlug,
  headline,
  isLikelyBot,
  isShareCode,
  publicContent,
  resumeToPlainText,
  shareTargets,
} from "@/lib/resume-share";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { SAMPLE_CONTENT } from "@/lib/resume-templates";

describe("share codes", () => {
  it("builds a valid code from random bytes, skipping biased values", () => {
    const bytes = new Uint8Array(30).map((_, i) => (i * 37 + 11) % 256);
    const code = codeFromBytes(bytes);
    expect(code).toHaveLength(SHARE_CODE_LENGTH);
    expect(isShareCode(code)).toBe(true);
    // 255 is above the unbiased limit for a 57-symbol alphabet: never used
    expect(codeFromBytes(new Uint8Array([255, 255, 0]))).toBe("A");
  });

  it("rejects anything that isn't a code (no lookalike characters, no paths)", () => {
    expect(isShareCode("abc")).toBe(false);
    expect(isShareCode("O0O0O0O0O0")).toBe(false);
    expect(isShareCode("../../etc/x")).toBe(false);
    expect(isShareCode(123)).toBe(false);
  });
});

describe("public content", () => {
  const content = sanitizeEditorContent({
    personalDetails: { name: "Ada", phone: "+1 555", email: "ada@example.com", address: "London" },
  });

  it("hides phone and address but keeps the email", () => {
    expect(publicContent(content, { hideContact: true }).personalDetails).toMatchObject({
      name: "Ada",
      phone: "",
      address: "",
      email: "ada@example.com",
    });
    expect(publicContent(content, { hideContact: false })).toBe(content);
  });

  it("headline: latest role, else the summary's first sentence", () => {
    expect(headline(SAMPLE_CONTENT)).toBe("Senior Software Engineer at Northwind Labs");
    expect(headline(sanitizeEditorContent({ professionalSummary: "**Designer** who ships. Loves type." }))).toBe("Designer who ships.");
    expect(headline(sanitizeEditorContent({}))).toBe("");
  });
});

describe("share targets", () => {
  it("encodes the link for each network", () => {
    const t = shareTargets("https://app.example/r/abc", "Ada · Resume");
    expect(t.linkedin).toBe("https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fapp.example%2Fr%2Fabc");
    expect(t.x).toContain("text=Ada%20%C2%B7%20Resume");
    expect(t.email.startsWith("mailto:?subject=")).toBe(true);
  });

  it("file names are safe", () => {
    expect(fileSlug("Ada's CV (2026)!")).toBe("ada-s-cv-2026");
    expect(fileSlug("***")).toBe("resume");
  });

  it("bots and link previews aren't views", () => {
    expect(isLikelyBot("LinkedInBot/1.0")).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
    expect(isLikelyBot(null)).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (Windows NT 10.0) Chrome/131.0 Safari/537.36")).toBe(false);
  });
});

describe("resumeToPlainText", () => {
  it("follows the section order with headings and no formatting", () => {
    const text = resumeToPlainText(
      sanitizeEditorContent({
        ...SAMPLE_CONTENT,
        professionalSummary: "**Builder** of things.",
        customSections: [{ id: "c1", title: "Languages", body: "- **English**\n- Spanish" }],
        design: { sectionTitles: { experience: "Work History" } },
        sectionOrder: ["personal", "summary", "custom:c1", "experience"],
      }),
    );
    expect(text.startsWith("ALEX RIVERA\n+1 555 0142 | alex.rivera@example.com | Austin, TX\n")).toBe(true);
    expect(text).toContain("\nPROFESSIONAL SUMMARY\nBuilder of things.\n");
    expect(text).toContain("\nLANGUAGES\n- English\n- Spanish\n");
    expect(text).toContain("\nWORK HISTORY\nSenior Software Engineer, Northwind Labs | 2022 - Present\n- Led checkout rebuild");
    expect(text).not.toContain("**");
    expect(text.indexOf("LANGUAGES")).toBeLessThan(text.indexOf("WORK HISTORY"));
  });
});

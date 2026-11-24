import { describe, expect, it } from "vitest";
import {
  bulletsToDoc,
  docToBullets,
  docToRich,
  escapeRich,
  parseBlocks,
  parseInline,
  richToDoc,
  safeLinkUrl,
  serializeInline,
  stripRich,
  toPlainContent,
} from "@/lib/rich-text";

describe("parseInline", () => {
  it("reads bold, italic, underline and links", () => {
    expect(parseInline("Led **12** devs, *fast*, __done__ at [Acme](https://acme.com)")).toEqual([
      { text: "Led " },
      { text: "12", bold: true },
      { text: " devs, " },
      { text: "fast", italic: true },
      { text: ", " },
      { text: "done", underline: true },
      { text: " at " },
      { text: "Acme", href: "https://acme.com" },
    ]);
  });

  it("nests marks", () => {
    expect(parseInline("***both***")).toEqual([{ text: "both", bold: true, italic: true }]);
    expect(parseInline("[**bold link**](https://a.co)")).toEqual([{ text: "bold link", bold: true, href: "https://a.co" }]);
  });

  it("keeps unpaired markers and escapes as plain text", () => {
    expect(parseInline("rated 5* by users")).toEqual([{ text: "rated 5* by users" }]);
    expect(parseInline("a \\*literal\\* b")).toEqual([{ text: "a *literal* b" }]);
    expect(parseInline("snake_case_name")).toEqual([{ text: "snake_case_name" }]);
    expect(parseInline("[not a link]")).toEqual([{ text: "[not a link]" }]);
  });

  it("drops unsafe link targets but keeps the text", () => {
    expect(parseInline("[click](javascript:alert(1))")).toEqual([{ text: "click)" }]); // link dropped; the stray ")" stays text
    expect(parseInline("[site](example.com)")).toEqual([{ text: "site", href: "https://example.com" }]);
  });
});

describe("serializeInline round-trip", () => {
  const cases = [
    "plain text",
    "Led **12** devs, *fast*, __done__",
    "***both***",
    "[Acme](https://acme.com)",
    "price is 5\\* and \\_x\\_",
  ];
  for (const c of cases) {
    it(`round-trips: ${c}`, () => {
      const spans = parseInline(c);
      expect(parseInline(serializeInline(spans))).toEqual(spans);
    });
  }

  it("escapes characters that would become markup", () => {
    expect(escapeRich("a*b_c[d]\\")).toBe("a\\*b\\_c\\[d\\]\\\\");
    expect(serializeInline([{ text: "5* rating" }])).toBe("5\\* rating");
  });

  it("encodes ) and spaces in link targets", () => {
    expect(serializeInline([{ text: "x", href: "https://a.co/a b)" }])).toBe("[x](https://a.co/a%20b%29)");
  });
});

describe("blocks, stripping, plain content", () => {
  it("only treats '- ' lines as bullets where lists are allowed", () => {
    expect(parseBlocks("- one\n- two", { lists: true }).map((b) => b.type)).toEqual(["bullet", "bullet"]);
    expect(parseBlocks("- one", { lists: false })[0].type).toBe("paragraph");
  });

  it("strips markup for ATS / AI", () => {
    expect(stripRich("**Bold** and [link](https://a.co)\n- item")).toBe("Bold and link\n• item");
    expect(stripRich(undefined)).toBe("");
  });

  it("toPlainContent cleans every rich field and drops design", () => {
    const plain = toPlainContent({
      professionalSummary: "**Senior** dev",
      experiences: [{ bullets: ["Cut costs by **40%**"] }],
      projects: [{ description: ["*Built* it"] }],
      certificates: [{ description: "__Issued__ by AWS" }],
      customSections: [{ title: "Awards", body: "- **Best** paper" }],
      design: { textScale: "lg" },
    });
    expect(plain).toEqual({
      professionalSummary: "Senior dev",
      experiences: [{ bullets: ["Cut costs by 40%"] }],
      projects: [{ description: ["Built it"] }],
      certificates: [{ description: "Issued by AWS" }],
      customSections: [{ title: "Awards", body: "• Best paper" }],
    });
  });
});

describe("Tiptap document conversion", () => {
  it("round-trips paragraphs and lists", () => {
    const value = "Intro with **bold**\n- first\n- [second](https://a.co)\nOutro";
    expect(docToRich(richToDoc(value, { lists: true }))).toBe(value);
  });

  it("drops trailing empty paragraphs", () => {
    const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }, { type: "paragraph" }] };
    expect(docToRich(doc)).toBe("Hi");
  });

  it("bullets: one paragraph per bullet, both ways", () => {
    const bullets = ["Shipped **v2**", "Hired 3 people"];
    const doc = bulletsToDoc(bullets);
    expect(doc.content!.map((n) => n.type)).toEqual(["paragraph", "paragraph"]);
    expect(docToBullets(doc)).toEqual(bullets);
    expect(docToBullets(bulletsToDoc([]))).toEqual([""]);
  });

  it("ignores unsafe link marks coming from the editor", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:void 0" } }] }] }],
    };
    expect(docToRich(doc)).toBe("x");
  });

  it("safeLinkUrl only allows web and mail links", () => {
    expect(safeLinkUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeLinkUrl("ftp://x")).toBeNull();
  });
});

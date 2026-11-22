import { describe, expect, it } from "vitest";
import { decodeEntities, docxHtmlToText, isZipBytes, resumeFileKind } from "@/lib/docx-text";

describe("docxHtmlToText", () => {
  it("keeps headings, paragraphs and bullets on their own lines", () => {
    const html =
      "<h1>Alex Rivera</h1><p>Frontend Engineer &amp; mentor</p>" +
      "<h2>Experience</h2><p><strong>Acme</strong> — Engineer (2022 – Present)</p>" +
      "<ul><li>Cut load time 38%</li><li>Led a <em>TypeScript</em> migration</li></ul>";
    expect(docxHtmlToText(html)).toBe(
      [
        "Alex Rivera",
        "Frontend Engineer & mentor",
        "",
        "Experience",
        "Acme — Engineer (2022 – Present)",
        "",
        "• Cut load time 38%",
        "• Led a TypeScript migration",
      ].join("\n"),
    );
  });

  it("indents nested lists", () => {
    const html = "<ul><li>Parent<ul><li>Child</li></ul></li><li>Next</li></ul>";
    expect(docxHtmlToText(html)).toBe("• Parent\n  • Child\n• Next");
  });

  it("puts table rows on one line with cells separated", () => {
    const html = "<table><tr><td><p>Skills</p></td><td><p>React, SQL</p></td></tr><tr><td>Tools</td><td>Git</td></tr></table>";
    const text = docxHtmlToText(html);
    expect(text).toContain("Tools | Git");
    expect(text).toBe("Skills | React, SQL\nTools | Git"); // rows are consecutive lines
    expect(text).toMatch(/Skills\s*\|\s*React, SQL/);
  });

  it("drops images and empty list items, decodes entities, collapses blank lines", () => {
    const html = "<p>A&nbsp;&nbsp;B &#8211; C &#x2022;</p><ul><li><img src=\"\"/></li></ul><p></p><p></p><p></p><p>End</p>";
    expect(docxHtmlToText(html)).toBe("A B – C •\n\nEnd");
  });

  it("turns <br> into line breaks", () => {
    expect(docxHtmlToText("<p>Austin, TX<br/>alex@example.com</p>")).toBe("Austin, TX\nalex@example.com");
  });
});

describe("decodeEntities", () => {
  it("handles named, decimal and hex entities and leaves unknown ones", () => {
    expect(decodeEntities("&lt;b&gt; &#169; &#xA9; &unknown;")).toBe("<b> © © &unknown;");
  });
});

describe("resumeFileKind", () => {
  it("detects by MIME type, falling back to the extension", () => {
    expect(resumeFileKind({ name: "cv.pdf", type: "" })).toBe("pdf");
    expect(resumeFileKind({ name: "cv.DOCX", type: "" })).toBe("docx");
    expect(resumeFileKind({ name: "x", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).toBe("docx");
    expect(resumeFileKind({ name: "old.doc", type: "application/msword" })).toBe("doc");
    expect(resumeFileKind({ name: "photo.png", type: "image/png" })).toBe("other");
  });
});

describe("isZipBytes", () => {
  it("recognizes the ZIP signature used by .docx files", () => {
    expect(isZipBytes(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14]))).toBe(true);
    expect(isZipBytes(new TextEncoder().encode("%PDF-"))).toBe(false);
  });
});

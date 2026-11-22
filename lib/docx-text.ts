// Turn mammoth's HTML for a Word resume into plain text that keeps the
// structure the AI needs: one line per paragraph/heading, "• " bullets for
// list items (with indentation for nested lists), table rows as one line with
// " | " between cells. Pure and DOM-free so it's unit-testable.

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  bull: "•",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

export function docxHtmlToText(html: string): string {
  // One left-to-right pass over the tags, so nesting is tracked correctly
  let depth = 0; // current list nesting
  let cellIndex = 0; // position within a table row
  let inline = 0; // inside a list item or table cell: paragraphs don't break the line

  const out = html.replace(/<(\/?)([a-z0-9]+)[^>]*>/gi, (_m, closing: string, rawTag: string) => {
    const tag = rawTag.toLowerCase();
    const close = closing === "/";
    switch (tag) {
      case "ul":
      case "ol":
        depth = Math.max(0, depth + (close ? -1 : 1));
        // A list ends: following paragraphs start on a new line
        return close && depth === 0 ? "\n" : "";
      case "li":
        inline = Math.max(0, inline + (close ? -1 : 1));
        return close ? "" : `\n${"  ".repeat(Math.max(0, depth - 1))}• `;
      case "tr":
        cellIndex = 0;
        return close ? "" : "\n";
      case "td":
      case "th":
        inline = Math.max(0, inline + (close ? -1 : 1));
        if (close) return "";
        return cellIndex++ > 0 ? " | " : "";
      case "br":
        return "\n";
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return close ? "\n" : "\n\n";
      case "p":
      case "div":
      case "table":
        if (inline > 0) return close ? " " : "";
        return close ? "\n" : "";
      default:
        // img, strong, em, a, span...: removed
        return "";
    }
  });

  return decodeEntities(out)
    .split("\n")
    // Collapse spaces but keep leading indentation (nested bullets)
    .map((line) => {
      const indent = /^ */.exec(line)![0];
      return indent + line.slice(indent.length).replace(/[ \t ]+/g, " ").trimEnd();
    })
    // Empty bullets (list items whose content was only an image) are noise
    .filter((line) => !/^\s*•\s*$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeFileKind = "pdf" | "docx" | "doc" | "other";

/** What kind of resume file this is (by MIME type, falling back to the extension). */
export function resumeFileKind(file: { name: string; type: string }): ResumeFileKind {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type === DOCX_MIME || name.endsWith(".docx")) return "docx";
  if (file.type === "application/msword" || name.endsWith(".doc")) return "doc";
  return "other";
}

/** True when the bytes look like a .docx (a ZIP archive: "PK\x03\x04"). */
export function isZipBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

// Rebuild readable text from pdf.js text items (pure, unit-tested).
//
// pdf.js returns positioned text fragments, not lines. Joining them with
// spaces (what we did before) merges every line on a page into one, and
// interleaves two-column layouts. Here we:
//   1. group fragments into lines by their baseline (y),
//   2. order fragments left->right and only insert spaces at real gaps,
//   3. detect a two-column layout (a vertical gutter no line crosses) and
//      read the left column before the right one,
//   4. keep paragraph breaks and normalize bullet glyphs.

export type PdfTextItem = {
  str: string;
  /** Left edge */
  x: number;
  /** Baseline, PDF coordinates (grows upward) */
  y: number;
  width: number;
  /** Font size / line height of the fragment */
  height: number;
};

type Line = { y: number; height: number; items: PdfTextItem[]; x0: number; x1: number };

// Glyphs PDFs use for bullets (incl. Symbol/Wingdings private-use code points)
const BULLET_RE = /^[\s]*[•●▪■◦○◆◇►▸‣⁃∙·\-–—*]+\s*/;

function groupLines(items: PdfTextItem[]): Line[] {
  const sorted = items
    .filter((i) => i.str.length > 0)
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: Line[] = [];
  for (const item of sorted) {
    const tolerance = Math.max(2, (item.height || 10) * 0.45);
    const line = lines.find((l) => Math.abs(l.y - item.y) <= tolerance);
    if (line) {
      line.items.push(item);
      line.x0 = Math.min(line.x0, item.x);
      line.x1 = Math.max(line.x1, item.x + item.width);
      line.height = Math.max(line.height, item.height);
    } else {
      lines.push({
        y: item.y,
        height: item.height || 10,
        items: [item],
        x0: item.x,
        x1: item.x + item.width,
      });
    }
  }
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines.sort((a, b) => b.y - a.y);
}

/** Join a line's fragments, adding a space only where there's a visible gap. */
function lineText(items: PdfTextItem[]): string {
  let out = "";
  let prevEnd: number | null = null;
  for (const item of items) {
    if (prevEnd !== null) {
      const gap = item.x - prevEnd;
      const needsSpace =
        gap > (item.height || 10) * 0.15 && !out.endsWith(" ") && !item.str.startsWith(" ");
      if (needsSpace) out += " ";
    }
    out += item.str;
    prevEnd = item.x + item.width;
  }
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Find a vertical gutter that splits the page into two columns: an x position
 * that (almost) no fragment crosses, with substantial text on both sides.
 * Returns the gutter x, or null for single-column pages.
 */
export function findColumnGutter(items: PdfTextItem[], pageWidth: number): number | null {
  const text = items.filter((i) => i.str.trim().length > 0);
  if (text.length < 8 || pageWidth <= 0) return null;

  const totalChars = text.reduce((a, i) => a + i.str.length, 0);
  let best: { x: number; crossing: number } | null = null;

  for (let pct = 0.25; pct <= 0.75; pct += 0.01) {
    const x = pageWidth * pct;
    let crossing = 0; // fragments, not chars: one long header line is one fragment
    let left = 0;
    let right = 0;
    for (const i of text) {
      if (i.x < x && i.x + i.width > x) crossing += 1;
      else if (i.x + i.width <= x) left += i.str.length;
      else right += i.str.length;
    }
    // Both sides need real content (a right-aligned date column is too small
    // to count); full-width lines (headers) may cross
    if (left < totalChars * 0.15 || right < totalChars * 0.15) continue;
    if (crossing > Math.max(2, text.length * 0.1)) continue;
    if (!best || crossing < best.crossing) best = { x, crossing };
  }
  if (!best) return null;

  // Real columns are tall blocks running side by side. A short label/value
  // table (Email | value, Phone | value...) also has a gutter, but few rows.
  const gutter = best.x;
  const leftLines = groupLines(text.filter((i) => i.x + i.width <= gutter));
  const rightLines = groupLines(text.filter((i) => i.x >= gutter));
  if (leftLines.length < 5 || rightLines.length < 5) return null;

  const span = (ls: Line[]) => ({ top: ls[0].y, bottom: ls[ls.length - 1].y });
  const l = span(leftLines);
  const r = span(rightLines);
  const overlap = Math.min(l.top, r.top) - Math.max(l.bottom, r.bottom);
  const shorter = Math.min(l.top - l.bottom, r.top - r.bottom);
  if (shorter <= 0 || overlap < shorter * 0.5) return null;

  return gutter;
}

function renderLines(lines: Line[]): string[] {
  const out: string[] = [];
  let prev: Line | null = null;
  for (const line of lines) {
    let text = lineText(line.items);
    if (!text) continue;
    text = text.replace(BULLET_RE, (m) => (/[•●▪■◦○◆◇►▸‣⁃∙·]/.test(m) ? "• " : m));
    // Paragraph break when the vertical gap is clearly bigger than a line
    if (prev && prev.y - line.y > Math.max(prev.height, line.height) * 1.9) out.push("");
    out.push(text);
    prev = line;
  }
  return out;
}

/** Text of one page, in reading order. */
export function layoutPageText(items: PdfTextItem[], pageWidth: number): string {
  const gutter = findColumnGutter(items, pageWidth);
  if (gutter === null) return renderLines(groupLines(items)).join("\n");

  // Lines crossing the gutter (name/header/footer) stay full-width, in place;
  // between them, read the left column, then the right column.
  const all = groupLines(items);
  const out: string[] = [];
  let leftBlock: PdfTextItem[] = [];
  let rightBlock: PdfTextItem[] = [];
  const flush = () => {
    if (leftBlock.length || rightBlock.length) {
      const left = renderLines(groupLines(leftBlock));
      const right = renderLines(groupLines(rightBlock));
      out.push(...left);
      if (left.length && right.length) out.push("");
      out.push(...right);
    }
    leftBlock = [];
    rightBlock = [];
  };

  for (const line of all) {
    const crosses = line.items.some((i) => i.x < gutter && i.x + i.width > gutter);
    if (crosses) {
      flush();
      out.push(...renderLines([line]));
    } else {
      for (const i of line.items) (i.x + i.width <= gutter ? leftBlock : rightBlock).push(i);
    }
  }
  flush();
  return out.join("\n");
}

/** Join pages and tidy whitespace. */
export function joinPages(pages: string[]): string {
  return pages
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

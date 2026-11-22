import { describe, expect, it } from "vitest";
import {
  findColumnGutter,
  joinPages,
  layoutPageText,
  type PdfTextItem,
} from "@/lib/pdf-layout";

// Helper: a fragment at (x, y) whose width is ~5.5pt per character at 11pt
const t = (str: string, x: number, y: number, height = 11): PdfTextItem => ({
  str,
  x,
  y,
  width: str.length * height * 0.5,
  height,
});

const PAGE_W = 612; // US Letter

describe("single-column layout", () => {
  it("keeps line breaks instead of merging the page into one line", () => {
    const items = [t("Alex Rivera", 50, 750, 18), t("Frontend Engineer", 50, 728), t("Austin, TX", 50, 714)];
    expect(layoutPageText(items, PAGE_W)).toBe("Alex Rivera\nFrontend Engineer\nAustin, TX");
  });

  it("orders fragments left-to-right and joins split words without stray spaces", () => {
    // pdf.js often splits a line into fragments, sometimes mid-word, out of order
    const items = [t("Engineer", 103, 700), t("Fron", 50, 700), t("tend", 72, 700)];
    expect(layoutPageText(items, PAGE_W)).toBe("Frontend Engineer");
  });

  it("groups fragments with slightly different baselines into one line", () => {
    const items = [t("Acme Corp", 50, 600), t("2022 – Present", 400, 601.5, 10)];
    expect(layoutPageText(items, PAGE_W)).toBe("Acme Corp 2022 – Present");
  });

  it("normalizes bullet glyphs (incl. Symbol-font private-use bullets)", () => {
    const items = [t("", 50, 600), t("Cut load time 38%", 62, 600), t("● Led migration", 50, 586)];
    expect(layoutPageText(items, PAGE_W)).toBe("• Cut load time 38%\n• Led migration");
  });

  it("adds a blank line at large vertical gaps (section breaks)", () => {
    const items = [t("Summary text", 50, 700), t("EXPERIENCE", 50, 650)];
    expect(layoutPageText(items, PAGE_W)).toBe("Summary text\n\nEXPERIENCE");
  });
});

describe("two-column layout", () => {
  // Sidebar (skills) on the left, experience on the right, header across both
  const header = t("ALEX RIVERA — Frontend Engineer — alex@example.com — Austin", 50, 760, 12);
  const left = [
    t("SKILLS", 50, 700), t("TypeScript", 50, 686), t("React", 50, 672),
    t("Next.js", 50, 658), t("EDUCATION", 50, 600), t("State University", 50, 586),
  ];
  const right = [
    t("EXPERIENCE", 260, 705), t("Acme Corp, Frontend Engineer", 260, 690),
    t("• Rebuilt checkout in Next.js", 260, 676), t("• Cut load time by 38%", 260, 662),
    t("Widgets LLC, Junior Developer", 260, 620), t("• Built internal dashboards", 260, 606),
  ];

  it("detects the gutter between the columns", () => {
    const gutter = findColumnGutter([header, ...left, ...right], PAGE_W);
    expect(gutter).not.toBeNull();
    expect(gutter!).toBeGreaterThan(100);
    expect(gutter!).toBeLessThan(260);
  });

  it("reads the full-width header, then the left column, then the right column", () => {
    const text = layoutPageText([header, ...left, ...right], PAGE_W);
    const lines = text.split("\n").filter(Boolean);
    expect(lines[0]).toContain("ALEX RIVERA");
    // Left column stays together (no interleaving with the right)
    const skills = lines.indexOf("SKILLS");
    const experience = lines.indexOf("EXPERIENCE");
    expect(lines.slice(skills, skills + 4)).toEqual(["SKILLS", "TypeScript", "React", "Next.js"]);
    expect(experience).toBeGreaterThan(lines.indexOf("State University"));
    expect(lines.slice(experience, experience + 4)).toEqual([
      "EXPERIENCE",
      "Acme Corp, Frontend Engineer",
      "• Rebuilt checkout in Next.js",
      "• Cut load time by 38%",
    ]);
  });

  it("keeps a single-column resume with right-aligned dates on each job together", () => {
    const items: PdfTextItem[] = [];
    let y = 700;
    for (let job = 1; job <= 6; job++) {
      items.push(t(`Company ${job}, Senior Software Engineer`, 50, y), t("Jan 2020 – Mar 2022", 460, y, 10));
      items.push(t("• Shipped a large feature used by thousands of customers every day", 50, y - 14));
      items.push(t("• Reduced infrastructure costs significantly across all regions", 50, y - 28));
      y -= 60;
    }
    expect(findColumnGutter(items, PAGE_W)).toBeNull();
    const lines = layoutPageText(items, PAGE_W).split("\n").filter(Boolean);
    expect(lines[0]).toBe("Company 1, Senior Software Engineer Jan 2020 – Mar 2022");
  });

  it("does not treat a label/value table (same rows on both sides) as columns", () => {
    const rows = ["Email", "Phone", "Location", "Website"].flatMap((label, i) => [
      t(label, 50, 700 - i * 14),
      t(`value ${i + 1} goes here`, 300, 700 - i * 14),
    ]);
    expect(findColumnGutter(rows, PAGE_W)).toBeNull();
    expect(layoutPageText(rows, PAGE_W).split("\n")[0]).toBe("Email value 1 goes here");
  });
});

describe("joinPages", () => {
  it("separates pages and collapses extra blank lines", () => {
    expect(joinPages(["Page one  \n\n\n\nmore", "", "Page two"])).toBe("Page one\n\nmore\n\nPage two");
  });
});

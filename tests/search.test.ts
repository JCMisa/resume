import { describe, expect, it } from "vitest";
import { APP_PAGES, SEARCH_MAX_CHARS, isSearchable, matchPages, normalizeSearchQuery } from "@/lib/search";

const hrefs = (query: string, isAdmin = false) => matchPages(query, isAdmin).map((p) => p.href);

describe("normalizeSearchQuery", () => {
  it("trims, collapses spaces and caps length", () => {
    expect(normalizeSearchQuery("  data   analyst ")).toBe("data analyst");
    expect(normalizeSearchQuery(42)).toBe("");
    expect(normalizeSearchQuery("x".repeat(500))).toHaveLength(SEARCH_MAX_CHARS);
  });

  it("needs at least 2 characters to hit the server", () => {
    expect(isSearchable("a")).toBe(false);
    expect(isSearchable("ab")).toBe(true);
  });
});

describe("matchPages", () => {
  it("suggests quick links before typing", () => {
    expect(hrefs("")).toEqual(["/resumes/analyze", "/resumes/create", "/interviews", "/resumes"]);
  });

  it("matches titles and keyword prefixes, case-insensitively", () => {
    expect(hrefs("Analyze")).toContain("/resumes/analyze");
    expect(hrefs("upl")).toEqual(["/resumes/analyze"]);
    expect(hrefs("password")).toEqual(["/settings?tab=security"]);
    expect(hrefs("pro upgrade")).toEqual(["/settings?tab=billing"]);
  });

  it("ranks title matches above keyword matches", () => {
    expect(hrefs("resume")[0]).toMatch(/resumes/);
    expect(hrefs("settings")[0]).toBe("/settings");
  });

  it("every word has to match", () => {
    expect(hrefs("billing zebra")).toEqual([]);
  });

  it("hides admin pages from non-admins", () => {
    expect(hrefs("admin")).toEqual([]);
    expect(hrefs("admin", true)).toEqual(["/admin"]);
    expect(hrefs("", false)).not.toContain("/admin");
  });

  it("every page links inside the app", () => {
    for (const p of APP_PAGES) expect(p.href.startsWith("/") && !p.href.startsWith("//")).toBe(true);
  });
});

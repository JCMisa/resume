import { describe, expect, it } from "vitest";
import { inSection, isChildActive, parentTone } from "@/lib/nav";

const resumes = {
  url: "/resumes",
  children: [{ url: "/resumes" }, { url: "/resumes/create" }, { url: "/resumes/analyze" }],
};
const interviews = { url: "/interviews" };

describe("inSection", () => {
  it("matches the route and pages under it, not look-alike prefixes", () => {
    expect(inSection("/resumes", "/resumes")).toBe(true);
    expect(inSection("/resumes/abc-123", "/resumes")).toBe(true);
    expect(inSection("/resumesx", "/resumes")).toBe(false);
    expect(inSection("/dashboard", "/resumes")).toBe(false);
  });
});

describe("Resumes parent tone", () => {
  it("is soft on each child page while children are visible (the child is strong)", () => {
    for (const path of ["/resumes", "/resumes/create", "/resumes/analyze"]) {
      expect(parentTone(path, resumes, true)).toBe("soft");
    }
  });

  it("is strong on a single resume page (no child matches)", () => {
    expect(parentTone("/resumes/abc-123", resumes, true)).toBe("strong");
  });

  it("is strong when children are hidden (group collapsed or icon-only sidebar)", () => {
    expect(parentTone("/resumes/create", resumes, false)).toBe("strong");
    expect(parentTone("/resumes", resumes, false)).toBe("strong");
  });

  it("is idle elsewhere", () => {
    expect(parentTone("/dashboard", resumes, true)).toBe("idle");
    expect(parentTone("/interviews", resumes, true)).toBe("idle");
  });
});

describe("items without children", () => {
  it("are strong in their section, including nested pages", () => {
    expect(parentTone("/interviews", interviews, false)).toBe("strong");
    expect(parentTone("/interviews/results/1", interviews, false)).toBe("strong");
    expect(parentTone("/resumes", interviews, false)).toBe("idle");
  });
});

describe("child active state", () => {
  it("is exact, so only one child lights up at a time", () => {
    const active = (path: string) =>
      resumes.children.filter((c) => isChildActive(path, c.url)).map((c) => c.url);
    expect(active("/resumes")).toEqual(["/resumes"]);
    expect(active("/resumes/create")).toEqual(["/resumes/create"]);
    expect(active("/resumes/analyze")).toEqual(["/resumes/analyze"]);
    expect(active("/resumes/abc-123")).toEqual([]);
  });
});

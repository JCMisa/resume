import { describe, expect, it } from "vitest";
import { liveAtsReport, parseDuration, parseMonth, positionsFromContent, scoreBand } from "@/lib/live-ats";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { SAMPLE_CONTENT } from "@/lib/resume-templates";

describe("date parsing", () => {
  it("reads month names, numeric months, bare years and 'present'", () => {
    expect(parseMonth("Jan 2022")).toBe("2022-01");
    expect(parseMonth("September, 2019")).toBe("2019-09");
    expect(parseMonth("03/2020")).toBe("2020-03");
    expect(parseMonth("2021-11")).toBe("2021-11");
    expect(parseMonth("2018", "start")).toBe("2018-01");
    expect(parseMonth("2018", "end")).toBe("2018-12");
    expect(parseMonth("Present")).toBe("present");
    expect(parseMonth("someday")).toBe("");
  });

  it("splits ranges on dashes and 'to', including 2019-2021", () => {
    expect(parseDuration("Jan 2022 – Present")).toEqual({ start: "2022-01", end: "present" });
    expect(parseDuration("July 2025 - Present")).toEqual({ start: "2025-07", end: "present" });
    expect(parseDuration("03/2020 to 05/2022")).toEqual({ start: "2020-03", end: "2022-05" });
    expect(parseDuration("2019-2021")).toEqual({ start: "2019-01", end: "2021-12" });
    expect(parseDuration("2020-01 - 2022-03")).toEqual({ start: "2020-01", end: "2022-03" });
    expect(parseDuration("Summer")).toEqual({ start: "", end: "" });
    expect(parseDuration("")).toEqual({ start: "", end: "" });
  });

  it("skips empty experience rows", () => {
    const c = sanitizeEditorContent({ experiences: [{ id: "a", role: "", company: "", duration: "", bullets: [""] }, { id: "b", role: "Dev", company: "X", duration: "2020 - 2021", bullets: [] }] });
    expect(positionsFromContent(c)).toEqual([{ company: "X", title: "Dev", start: "2020-01", end: "2021-12" }]);
  });
});

describe("liveAtsReport", () => {
  it("a blank page scores 0 and lists what's missing", () => {
    const r = liveAtsReport(sanitizeEditorContent({}));
    expect(r.score).toBe(0);
    expect(r.checks.find((c) => c.id === "email")?.status).toBe("fail");
    expect(r.checks[0].status).toBe("fail"); // problems first
  });

  it("the sample resume scores well and ignores formatting markup", () => {
    const sample = liveAtsReport(sanitizeEditorContent(SAMPLE_CONTENT));
    expect(sample.score).toBeGreaterThanOrEqual(60);
    expect(sample.checks.find((c) => c.id === "dates")?.status).toBe("pass");

    const bold = sanitizeEditorContent({
      ...SAMPLE_CONTENT,
      experiences: SAMPLE_CONTENT.experiences!.map((e) => ({ ...e, bullets: e.bullets.map((b) => `**${b}**`) })),
    });
    expect(liveAtsReport(bold).score).toBe(sample.score);
  });

  it("score bands", () => {
    expect(scoreBand(85).tone).toBe("good");
    expect(scoreBand(65).tone).toBe("ok");
    expect(scoreBand(20).tone).toBe("low");
  });
});

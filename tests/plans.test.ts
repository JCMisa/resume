import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FREE_LIMITS,
  FREE_REPORT,
  INTERVIEW_REFUND_WINDOW_SECONDS,
  LIMIT_REACHED,
  PLAN_HIGHLIGHTS,
  PRO_LIMITS,
  computeAllowed,
  describeFreeLimit,
  formatResetDate,
  isLimitReached,
  isProOnly,
  limitReachedMessage,
  nextMonthlyReset,
  proCapReachedMessage,
  refundWindowStart,
  startOfMonthUTC,
  type UsageCounts,
} from "@/lib/plans";

const usage = (u: Partial<UsageCounts> = {}): UsageCounts => ({
  analyses: 0,
  interviews: 0,
  resumes: 0,
  jobMatches: 0,
  aiWrites: 0,
  tailors: 0,
  tailorsThisMonth: 0,
  ...u,
});
const free = (u?: Partial<UsageCounts>) =>
  computeAllowed({ isPro: false, isAdmin: false, usage: usage(u) });
const pro = (u?: Partial<UsageCounts>) =>
  computeAllowed({ isPro: true, isAdmin: false, usage: usage(u) });

describe("monthly periods (UTC)", () => {
  it("starts the period on the 1st of the month at 00:00 UTC", () => {
    expect(startOfMonthUTC(new Date("2026-11-22T15:30:00Z")).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
  });

  it("uses UTC, not local time, at month boundaries", () => {
    // 23:30 UTC on Nov 30 is already Dec 1 in UTC+8, but the period is still November
    expect(startOfMonthUTC(new Date("2026-11-30T23:30:00Z")).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
    expect(startOfMonthUTC(new Date("2026-12-01T00:00:00Z")).toISOString()).toBe(
      "2026-12-01T00:00:00.000Z",
    );
  });

  it("resets on the 1st of next month, rolling over the year", () => {
    expect(nextMonthlyReset(new Date("2026-11-22T00:00:00Z")).toISOString()).toBe(
      "2026-12-01T00:00:00.000Z",
    );
    expect(nextMonthlyReset(new Date("2026-12-31T23:59:59Z")).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });

  it("formats the reset date in UTC", () => {
    expect(formatResetDate(new Date("2027-01-01T00:00:00Z"))).toBe("Jan 1");
  });
});

describe("computeAllowed", () => {
  it("free: analyses allowed until the monthly limit, then blocked", () => {
    expect(free({ analyses: FREE_LIMITS.analyze - 1 }).analyze).toBe(true);
    expect(free({ analyses: FREE_LIMITS.analyze }).analyze).toBe(false);
  });

  it("free: manual resumes allowed until the monthly limit", () => {
    expect(free({ resumes: FREE_LIMITS.create_resume - 1 }).create_resume).toBe(true);
    expect(free({ resumes: FREE_LIMITS.create_resume }).create_resume).toBe(false);
  });

  it("free: job matches allowed until the monthly limit; pro unlimited", () => {
    expect(free({ jobMatches: FREE_LIMITS.job_match - 1 }).job_match).toBe(true);
    expect(free({ jobMatches: FREE_LIMITS.job_match }).job_match).toBe(false);
    expect(pro({ jobMatches: 999 }).job_match).toBe(true);
  });

  it("free: interviews are never allowed (Pro-only)", () => {
    expect(free().interview).toBe(false);
  });

  it("free: AI writing until the monthly limit; Tailor to a job is Pro-only", () => {
    expect(free({ aiWrites: FREE_LIMITS.ai_write - 1 }).ai_write).toBe(true);
    expect(free({ aiWrites: FREE_LIMITS.ai_write }).ai_write).toBe(false);
    expect(free().tailor).toBe(false);
    expect(pro({ aiWrites: 999 }).ai_write).toBe(true);
    expect(pro().tailor).toBe(true);
  });

  it("tailored resumes: Free 3 ever, Pro 30 a month", () => {
    expect(free({ tailors: FREE_LIMITS.resume_tailor - 1 }).resume_tailor).toBe(true);
    expect(free({ tailors: FREE_LIMITS.resume_tailor }).resume_tailor).toBe(false);
    // Free counts all-time, so a quiet month doesn't give the trial back
    expect(free({ tailors: FREE_LIMITS.resume_tailor, tailorsThisMonth: 0 }).resume_tailor).toBe(false);
    // Pro counts this month only
    expect(pro({ tailors: 500, tailorsThisMonth: PRO_LIMITS.resume_tailor - 1 }).resume_tailor).toBe(true);
    expect(pro({ tailorsThisMonth: PRO_LIMITS.resume_tailor }).resume_tailor).toBe(false);
    expect(limitReachedMessage("resume_tailor")).toBe(
      `You've used all ${FREE_LIMITS.resume_tailor} tailored resumes on the Free plan. Upgrade to Pro for ${PRO_LIMITS.resume_tailor} a month.`,
    );
    expect(proCapReachedMessage("resume_tailor")).toContain(`all ${PRO_LIMITS.resume_tailor} tailored resumes`);
    expect(proCapReachedMessage()).toContain("AI mock interviews");
  });

  it("designer looks and version history are Pro-only", () => {
    expect(free().design).toBe(false);
    expect(free().history).toBe(false);
    expect(pro().design).toBe(true);
    expect(pro().history).toBe(true);
    expect(limitReachedMessage("design")).toMatch(/Pro features/);
    expect(limitReachedMessage("history")).toMatch(/Version history is a Pro feature/);
  });

  it("pro: unlimited analyses and resumes", () => {
    const a = pro({ analyses: 999, resumes: 999 });
    expect(a.analyze).toBe(true);
    expect(a.create_resume).toBe(true);
  });

  it("pro: interviews capped at the monthly fair-use limit", () => {
    expect(pro({ interviews: PRO_LIMITS.interview - 1 }).interview).toBe(true);
    expect(pro({ interviews: PRO_LIMITS.interview }).interview).toBe(false);
  });

  it("admin: everything allowed with no caps, even without a Pro flag", () => {
    expect(
      computeAllowed({
        isPro: false,
        isAdmin: true,
        usage: usage({ analyses: 999, interviews: 999, resumes: 999, jobMatches: 999, aiWrites: 999 }),
      }),
    ).toEqual({
      analyze: true,
      interview: true,
      create_resume: true,
      job_match: true,
      ai_write: true,
      tailor: true,
      design: true,
      history: true,
      resume_tailor: true,
    });
  });
});

describe("refund window", () => {
  it("allows refunds only for sessions created within the window", () => {
    const now = Date.parse("2026-11-22T10:00:00Z");
    const start = refundWindowStart(now);
    expect(now - start.getTime()).toBe(INTERVIEW_REFUND_WINDOW_SECONDS * 1000);

    const createdAt = (secondsAgo: number) => new Date(now - secondsAgo * 1000);
    // Mirrors the server query: gte(interviews.createdAt, windowStart)
    const refundable = (d: Date) => d.getTime() >= start.getTime();
    expect(refundable(createdAt(5))).toBe(true);
    expect(refundable(createdAt(INTERVIEW_REFUND_WINDOW_SECONDS))).toBe(true);
    expect(refundable(createdAt(INTERVIEW_REFUND_WINDOW_SECONDS + 1))).toBe(false);
    expect(refundable(createdAt(300))).toBe(false); // a full 5-minute call
  });
});

describe("messages and copy", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects LIMIT_REACHED results", () => {
    expect(isLimitReached({ success: false, code: LIMIT_REACHED })).toBe(true);
    expect(isLimitReached({ success: false, code: "RATE_LIMITED" })).toBe(false);
    expect(isLimitReached({ success: false, error: "x" })).toBe(false);
  });

  it("knows interviews are Pro-only", () => {
    expect(isProOnly("interview")).toBe(true);
    expect(isProOnly("analyze")).toBe(false);
    expect(isProOnly("tailor")).toBe(true);
    expect(isProOnly("ai_write")).toBe(false);
  });

  it("limit messages use the real numbers and reset date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-22T12:00:00Z"));
    expect(describeFreeLimit("analyze")).toBe(
      `${FREE_LIMITS.analyze} AI resume analyses per month`,
    );
    expect(limitReachedMessage("analyze")).toContain(`all ${FREE_LIMITS.analyze}`);
    expect(limitReachedMessage("analyze")).toContain("resets Dec 1");
    expect(limitReachedMessage("interview")).toMatch(/Pro feature/);
    expect(limitReachedMessage("tailor")).toMatch(/Tailor to a job is a Pro feature/);
    expect(limitReachedMessage("ai_write")).toContain(`all ${FREE_LIMITS.ai_write} AI writing actions`);
    expect(proCapReachedMessage()).toContain(`${PRO_LIMITS.interview}`);
  });

  it("pricing copy stays in sync with the limits", () => {
    const free = PLAN_HIGHLIGHTS.free.join(" | ");
    const pro = PLAN_HIGHLIGHTS.pro.join(" | ");
    expect(free).toContain(`${FREE_LIMITS.analyze} AI resume analyses`);
    expect(free).toContain(`${FREE_LIMITS.create_resume} resumes`);
    expect(free).toContain(`${FREE_LIMITS.job_match} job description matches`);
    expect(free).toContain(`${FREE_REPORT.bulletRewrites} bullet rewrites`);
    expect(free).toContain(`${FREE_LIMITS.ai_write} AI writing actions`);
    expect(pro).toContain(`${PRO_LIMITS.interview} AI mock interviews`);
  });
});

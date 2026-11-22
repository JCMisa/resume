import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFS,
  KIND_CATEGORY,
  NOTIFICATION_BODY_MAX,
  NOTIFICATION_KINDS,
  analysisReadyNotice,
  capFor,
  deviceLabel,
  enabledInAppCategories,
  interviewGradedNotice,
  jobMatchReadyNotice,
  monthKey,
  normalizeNotification,
  parsePushSubscription,
  pushPayload,
  resolvePrefs,
  safeHref,
  usageNotice,
  usageNoticeFor,
} from "@/lib/notifications";
import { FREE_LIMITS, PRO_LIMITS } from "@/lib/plans";

const NOV = new Date(Date.UTC(2026, 10, 22));

describe("resolvePrefs", () => {
  it("defaults to everything on", () => {
    expect(resolvePrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(resolvePrefs("nope")).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("keeps valid booleans and drops junk", () => {
    const prefs = resolvePrefs({
      inApp: { usage: false, results: "no", extra: false },
      push: { account: false },
      email: { results: true },
    });
    expect(prefs).toEqual({
      inApp: { results: true, usage: false, account: true },
      push: { results: true, usage: true, account: false },
    });
  });

  it("lists enabled in-app categories", () => {
    const prefs = resolvePrefs({ inApp: { usage: false } });
    expect(enabledInAppCategories(prefs)).toEqual(["results", "account"]);
  });
});

describe("safeHref", () => {
  it("allows same-site paths only", () => {
    expect(safeHref("/resumes/abc?tab=match")).toBe("/resumes/abc?tab=match");
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("https://evil.com")).toBeNull();
    expect(safeHref("/\\evil.com")).toBeNull();
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });
});

describe("normalizeNotification", () => {
  it("maps the category, clips text and sanitizes the link", () => {
    const n = normalizeNotification({
      kind: "usage_low",
      title: "  Hello   there ",
      body: "x".repeat(1000),
      href: "https://evil.com",
    });
    expect(n.category).toBe("usage");
    expect(n.title).toBe("Hello there");
    expect(n.body.length).toBe(NOTIFICATION_BODY_MAX);
    expect(n.body.endsWith("…")).toBe(true);
    expect(n.href).toBeNull();
    expect(n.dedupeKey).toBeNull();
  });

  it("every kind has a category", () => {
    for (const kind of NOTIFICATION_KINDS) expect(KIND_CATEGORY[kind]).toBeTruthy();
  });

  it("push payload falls back to the dashboard and never includes extra data", () => {
    const n = normalizeNotification({ kind: "welcome", title: "Hi", body: "b" });
    expect(pushPayload(n)).toEqual({ title: "Hi", body: "b", url: "/dashboard", tag: "welcome" });
  });
});

describe("usageNotice", () => {
  it("warns at one left, then at the limit, once per month", () => {
    expect(usageNotice("analyze", 3, 5, NOV)).toBeNull();
    const low = usageNotice("analyze", 4, 5, NOV)!;
    expect(low.kind).toBe("usage_low");
    expect(low.dedupeKey).toBe("usage:analyze:low:2026-11");
    const reached = usageNotice("analyze", 5, 5, NOV)!;
    expect(reached.kind).toBe("usage_reached");
    expect(reached.dedupeKey).toBe("usage:analyze:reached:2026-11");
    expect(usageNotice("analyze", 6, 5, NOV)).toBeNull();
  });

  it("small limits only warn when reached", () => {
    expect(usageNotice("job_match", 1, 2, NOV)).toBeNull();
    expect(usageNotice("job_match", 2, 3, NOV)?.kind).toBe("usage_low");
  });

  it("no cap, no warning", () => {
    expect(usageNotice("analyze", 100, Infinity, NOV)).toBeNull();
  });

  it("monthKey is UTC and zero-padded", () => {
    expect(monthKey(new Date(Date.UTC(2026, 0, 1)))).toBe("2026-01");
  });
});

describe("capFor / usageNoticeFor", () => {
  const usage = { analyses: 0, interviews: 0, resumes: 0, jobMatches: 0 };

  it("free caps, Pro only capped on interviews, admins never", () => {
    expect(capFor("analyze", { isPro: false, isAdmin: false })).toBe(FREE_LIMITS.analyze);
    expect(capFor("analyze", { isPro: true, isAdmin: false })).toBe(Infinity);
    expect(capFor("interview", { isPro: true, isAdmin: false })).toBe(PRO_LIMITS.interview);
    expect(capFor("interview", { isPro: true, isAdmin: true })).toBe(Infinity);
  });

  it("counts the action that just happened", () => {
    const free = { isPro: false, isAdmin: false, limits: { ...usage, analyses: FREE_LIMITS.analyze - 2 } };
    expect(usageNoticeFor("analyze", free, NOV)?.kind).toBe("usage_low");
    const pro = { isPro: true, isAdmin: false, limits: { ...usage, analyses: 99 } };
    expect(usageNoticeFor("analyze", pro, NOV)).toBeNull();
  });
});

describe("event messages", () => {
  it("analysis, job match and interview link to the right pages", () => {
    expect(analysisReadyNotice({ id: "r1", title: "CV", analysis: { overallScore: 82 } })).toMatchObject({
      href: "/resumes/r1",
      body: expect.stringContaining("82/100"),
    });
    expect(
      jobMatchReadyNotice({ resumeId: "r1", matchScore: 71, jobTitle: "Dev", company: "Acme" }),
    ).toMatchObject({ href: "/resumes/r1?tab=match", title: "Job match ready: 71% fit" });
    expect(interviewGradedNotice({ id: "i1", jobRole: "PM" }, 64)).toMatchObject({
      href: "/interviews/results/i1",
      dedupeKey: "interview:i1:graded",
    });
  });
});

describe("parsePushSubscription", () => {
  const valid = {
    endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
    keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" },
    expirationTime: null,
  };

  it("accepts a real-looking subscription", () => {
    expect(parsePushSubscription(valid)).toEqual({ endpoint: valid.endpoint, keys: valid.keys });
  });

  it("rejects non-https endpoints and bad keys", () => {
    expect(parsePushSubscription({ ...valid, endpoint: "http://x.com/a" })).toBeNull();
    expect(parsePushSubscription({ ...valid, endpoint: "not a url" })).toBeNull();
    expect(parsePushSubscription({ ...valid, keys: { p256dh: "<script>", auth: "a" } })).toBeNull();
    expect(parsePushSubscription({ endpoint: valid.endpoint })).toBeNull();
    expect(parsePushSubscription(null)).toBeNull();
  });
});

describe("deviceLabel", () => {
  it("names common browsers and systems", () => {
    expect(
      deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0"),
    ).toBe("Edge on Windows");
    expect(
      deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36"),
    ).toBe("Chrome on Android");
    expect(
      deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"),
    ).toBe("Safari on iPhone/iPad");
    expect(deviceLabel(null)).toBe("Browser on unknown device");
  });
});

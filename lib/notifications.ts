import { FREE_LIMITS, PRO_LIMITS, type UsageCounts } from "./plans";

// Pure notification rules (unit-tested in tests/notifications.test.ts).
// Creating/sending lives in lib/notify.ts (server-only); this file is safe to
// import anywhere, including config/schema.ts and client components.

export const NOTIFICATION_CATEGORIES = ["results", "usage", "account"] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const CATEGORY_INFO: Record<NotificationCategory, { label: string; description: string }> = {
  results: {
    label: "Results ready",
    description: "Resume analyses, job matches and interview grades",
  },
  usage: {
    label: "Plan usage",
    description: "When you're about to hit, or have hit, a monthly limit",
  },
  account: {
    label: "Account",
    description: "Welcome messages and changes to your account access",
  },
};

export const NOTIFICATION_KINDS = [
  "analysis_ready",
  "job_match_ready",
  "interview_graded",
  "grading_failed",
  "usage_low",
  "usage_reached",
  "admin_granted",
  "admin_removed",
  "welcome",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const KIND_CATEGORY: Record<NotificationKind, NotificationCategory> = {
  analysis_ready: "results",
  job_match_ready: "results",
  interview_graded: "results",
  grading_failed: "results",
  usage_low: "usage",
  usage_reached: "usage",
  admin_granted: "account",
  admin_removed: "account",
  welcome: "account",
};

export type ChannelPrefs = Record<NotificationCategory, boolean>;
/** Stored on users.notification_prefs. Email arrives with #8b. */
export type NotificationPrefs = { inApp: ChannelPrefs; push: ChannelPrefs };

const allOn = (): ChannelPrefs => ({ results: true, usage: true, account: true });
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { inApp: allOn(), push: allOn() };

/** Stored/untrusted value -> complete prefs (missing or invalid keys use the defaults). */
export function resolvePrefs(raw: unknown): NotificationPrefs {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const channel = (value: unknown): ChannelPrefs => {
    const c = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const out = allOn();
    for (const cat of NOTIFICATION_CATEGORIES) {
      if (typeof c[cat] === "boolean") out[cat] = c[cat] as boolean;
    }
    return out;
  };
  return { inApp: channel(src.inApp), push: channel(src.push) };
}

/** In-app categories the user wants to see in the bell. */
export function enabledInAppCategories(prefs: NotificationPrefs): NotificationCategory[] {
  return NOTIFICATION_CATEGORIES.filter((c) => prefs.inApp[c]);
}

export const NOTIFICATION_RETENTION_DAYS = 90;
export const NOTIFICATION_LIST_LIMIT = 20;
export const NOTIFICATION_TITLE_MAX = 120;
export const NOTIFICATION_BODY_MAX = 280;

/** Only same-site paths ("/resumes/x"), never another origin ("//evil", "https://..."). */
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return null;
  if (href.includes("\\") || href.length > 500) return null;
  return href;
}

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export type NotificationInput = {
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  /** Same key for the same user is only ever stored (and pushed) once. */
  dedupeKey?: string | null;
};

/** Clean a notification before it's stored or pushed. */
export function normalizeNotification(n: NotificationInput) {
  return {
    kind: n.kind,
    category: KIND_CATEGORY[n.kind],
    title: clip(n.title, NOTIFICATION_TITLE_MAX) || "ResuMe",
    body: clip(n.body, NOTIFICATION_BODY_MAX),
    href: safeHref(n.href),
    dedupeKey: n.dedupeKey ? n.dedupeKey.slice(0, 200) : null,
  };
}

/**
 * What a device notification carries. Kept minimal on purpose (no resume
 * text): it's shown on lock screens.
 */
export function pushPayload(n: { title: string; body: string; href: string | null; kind: string }) {
  return {
    title: n.title,
    body: n.body,
    url: n.href ?? "/dashboard",
    // Same tag replaces an older notification of the same kind on the device
    tag: n.kind,
  };
}

// ── Plan usage warnings ─────────────────────────────────────────────────────

export type UsageFeature = "analyze" | "create_resume" | "job_match" | "interview";

const FEATURE_TEXT: Record<UsageFeature, { one: string; many: string; href: string }> = {
  analyze: { one: "AI analysis", many: "AI analyses", href: "/resumes/analyze" },
  create_resume: { one: "resume build", many: "resume builds", href: "/resumes/create" },
  job_match: { one: "job match", many: "job matches", href: "/resumes" },
  interview: { one: "mock interview", many: "mock interviews", href: "/interviews" },
};

const USAGE_COUNT_KEY: Record<UsageFeature, keyof UsageCounts> = {
  analyze: "analyses",
  create_resume: "resumes",
  job_match: "jobMatches",
  interview: "interviews",
};

/** The monthly cap that applies to this user for a feature (Infinity = none). */
export function capFor(feature: UsageFeature, plan: { isPro: boolean; isAdmin: boolean }): number {
  if (plan.isAdmin) return Infinity;
  if (plan.isPro) return feature === "interview" ? PRO_LIMITS.interview : Infinity;
  return feature === "interview" ? Infinity : FREE_LIMITS[feature];
}

/**
 * Usage warning after a metered action, from the billing status that allowed
 * it (its counts are from *before* the action).
 */
export function usageNoticeFor(
  feature: UsageFeature,
  billing: { isPro: boolean; isAdmin: boolean; limits: UsageCounts },
  now = new Date(),
): NotificationInput | null {
  return usageNotice(feature, billing.limits[USAGE_COUNT_KEY[feature]] + 1, capFor(feature, billing), now);
}

/** "2026-11": usage warnings are sent at most once per feature per month. */
export function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Warning to send after a metered action, given usage *including* it.
 * One left -> "low" (only for limits of 3+, so tiny limits don't double-warn);
 * none left -> "reached". Otherwise nothing.
 */
export function usageNotice(
  feature: UsageFeature,
  usedAfter: number,
  limit: number,
  now = new Date(),
): NotificationInput | null {
  if (!Number.isFinite(limit) || limit <= 0) return null;
  const text = FEATURE_TEXT[feature];
  const month = monthKey(now);
  if (usedAfter === limit) {
    return {
      kind: "usage_reached",
      title: `You've used all your ${text.many} this month`,
      body: `You've used ${limit} of ${limit}. Your allowance resets on the 1st, or upgrade to Pro for more.`,
      href: "/settings?tab=billing",
      dedupeKey: `usage:${feature}:reached:${month}`,
    };
  }
  if (limit >= 3 && usedAfter === limit - 1) {
    return {
      kind: "usage_low",
      title: `1 ${text.one} left this month`,
      body: `You've used ${usedAfter} of ${limit}. It resets on the 1st.`,
      href: text.href,
      dedupeKey: `usage:${feature}:low:${month}`,
    };
  }
  return null;
}

// ── Push subscriptions ──────────────────────────────────────────────────────

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Validate a browser PushSubscription.toJSON() before storing it. */
export function parsePushSubscription(raw: unknown): PushSubscriptionInput | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof r.endpoint !== "string" || r.endpoint.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(r.endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const b64url = /^[A-Za-z0-9_-]+={0,2}$/;
  const p256dh = r.keys?.p256dh;
  const auth = r.keys?.auth;
  if (typeof p256dh !== "string" || !b64url.test(p256dh) || p256dh.length > 200) return null;
  if (typeof auth !== "string" || !b64url.test(auth) || auth.length > 100) return null;
  return { endpoint: r.endpoint, keys: { p256dh, auth } };
}

/** Short device label from a user agent, e.g. "Chrome on Windows". */
export function deviceLabel(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iPhone/iPad"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "unknown device";
  return `${browser} on ${os}`;
}

// ── Event messages ──────────────────────────────────────────────────────────

export function analysisReadyNotice(resume: {
  id: string;
  title: string;
  analysis?: { overallScore?: number } | null;
}): NotificationInput {
  const score = resume.analysis?.overallScore;
  return {
    kind: "analysis_ready",
    title: "Your resume analysis is ready",
    body: `${resume.title}${typeof score === "number" ? `: ATS score ${score}/100` : ""}. See what to fix next.`,
    href: `/resumes/${resume.id}`,
  };
}

export function jobMatchReadyNotice(match: {
  resumeId: string;
  matchScore: number;
  jobTitle: string;
  company: string;
}): NotificationInput {
  const job = [match.jobTitle, match.company].filter(Boolean).join(" at ") || "this job";
  return {
    kind: "job_match_ready",
    title: `Job match ready: ${match.matchScore}% fit`,
    body: `Your resume vs ${job}. See the keywords to add and tailored rewrites.`,
    href: `/resumes/${match.resumeId}?tab=match`,
  };
}

export function interviewGradedNotice(session: { id: string; jobRole: string }, score: number): NotificationInput {
  return {
    kind: "interview_graded",
    title: `Interview graded: ${score}/100`,
    body: `Your ${session.jobRole} mock interview feedback is ready.`,
    href: `/interviews/results/${session.id}`,
    dedupeKey: `interview:${session.id}:graded`,
  };
}

export function gradingFailedNotice(session: { id: string; jobRole: string }): NotificationInput {
  return {
    kind: "grading_failed",
    title: "We couldn't grade your interview yet",
    body: `Your ${session.jobRole} answers are saved. Open the results page to retry grading.`,
    href: `/interviews/results/${session.id}`,
    dedupeKey: `interview:${session.id}:failed`,
  };
}

export function adminRoleNotice(granted: boolean): NotificationInput {
  return granted
    ? {
        kind: "admin_granted",
        title: "You're now an admin",
        body: "You can manage user roles from the Admin page, and you have every Pro feature with no usage caps.",
        href: "/admin",
      }
    : {
        kind: "admin_removed",
        title: "Your admin access was removed",
        body: "You're back on your regular plan. Contact an admin if you think this is a mistake.",
        href: "/dashboard",
      };
}

export function welcomeNotice(firstName?: string | null): NotificationInput {
  return {
    kind: "welcome",
    title: firstName ? `Welcome to ResuMe, ${firstName}!` : "Welcome to ResuMe!",
    body: "Start by uploading your resume for an instant ATS score and rewrite suggestions.",
    href: "/resumes/analyze",
    dedupeKey: "welcome",
  };
}

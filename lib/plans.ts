// Single source of truth for plan rules. Safe to import from client and server.
// Clerk Billing decides *which* plan a user is on (plan key "pro");
// this file decides what each plan is allowed to do, and the landing page
// pricing card is generated from it so marketing copy can't drift from the code.

export const PRO_PLAN_KEY = "pro";
/** Display only. The real price is configured in Clerk Billing; keep in sync. */
export const PRO_PRICE_MONTHLY_USD = 12;

export type GatedFeature = "analyze" | "interview" | "create_resume";

/** Features Free users can't use at all (Vapi voice calls are the main cost driver). */
export const PRO_ONLY_FEATURES = ["interview"] as const;
export type ProOnlyFeature = (typeof PRO_ONLY_FEATURES)[number];
export type MeteredFeature = Exclude<GatedFeature, ProOnlyFeature>;

export function isProOnly(feature: GatedFeature): feature is ProOnlyFeature {
  return (PRO_ONLY_FEATURES as readonly GatedFeature[]).includes(feature);
}

/** Free-plan allowances, per calendar month (UTC). */
export const FREE_LIMITS = {
  /** AI analyses (new uploads + re-analyses) */
  analyze: 5,
  /** Manually built resumes */
  create_resume: 10,
} as const satisfies Record<MeteredFeature, number>;

export const LIMIT_PERIOD: Record<MeteredFeature, "lifetime" | "monthly"> = {
  analyze: "monthly",
  create_resume: "monthly",
};

/**
 * Pro fair-use caps, per calendar month (UTC). Everything not listed is
 * unlimited for Pro. Admins have no caps. Interviews are capped because each
 * Vapi call costs real money, unlike Gemini analyses.
 */
export const PRO_LIMITS = {
  interview: 20,
} as const;

/** Start of the next monthly allowance period (1st of next month, UTC). */
export function nextMonthlyReset(from = new Date()) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
}

export function formatResetDate(date = nextMonthlyReset()) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * An interview session can be cancelled (and not counted) only within this many
 * seconds of being created. Server-enforced, so a full-length call can't be
 * "refunded" by a tampered client; covers mic/connection failures and empty calls.
 */
export const INTERVIEW_REFUND_WINDOW_SECONDS = 60;

/** Error code returned by server actions when a plan limit blocks the request. */
export const LIMIT_REACHED = "LIMIT_REACHED";

const NOUNS: Record<MeteredFeature, string> = {
  analyze: "AI resume analyses",
  create_resume: "resume builds",
};

/** Human-readable allowance, e.g. "5 AI resume analyses per month". */
export function describeFreeLimit(feature: MeteredFeature) {
  const period =
    LIMIT_PERIOD[feature] === "monthly" ? "per month" : "in total";
  return `${FREE_LIMITS[feature]} ${NOUNS[feature]} ${period}`;
}

/** True when a server action result failed because of a plan limit. */
export function isLimitReached(result: object): boolean {
  return "code" in result && result.code === LIMIT_REACHED;
}

/** Message for a Free user blocked by their plan. */
export function limitReachedMessage(feature: GatedFeature) {
  if (isProOnly(feature)) {
    return "AI mock interviews are a Pro feature. Upgrade to Pro to practice with the AI interviewer.";
  }
  const period =
    LIMIT_PERIOD[feature] === "monthly"
      ? `this month (resets ${formatResetDate()})`
      : "on the Free plan";
  return `You've used all ${FREE_LIMITS[feature]} ${NOUNS[feature]} ${period}. Upgrade to Pro for unlimited access.`;
}

/** Message for a Pro user who hit a monthly fair-use cap. */
export function proCapReachedMessage() {
  return `You've used all ${PRO_LIMITS.interview} AI mock interviews for this month. Your allowance resets on ${formatResetDate()}.`;
}

/** Pricing card copy, generated from the limits above. */
export const PLAN_HIGHLIGHTS = {
  free: [
    `${FREE_LIMITS.analyze} AI resume analyses / month`,
    `${FREE_LIMITS.create_resume} resumes / month in the builder`,
    "ATS score with improvement tips",
    "PDF export",
  ],
  pro: [
    "Unlimited AI resume analyses",
    "Unlimited resumes in the builder",
    `${PRO_LIMITS.interview} AI mock interviews / month`,
    "Scored interview reports & transcripts",
    "Higher limits for back-to-back analyses",
    "PDF export",
  ],
};

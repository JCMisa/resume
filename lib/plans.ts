// Single source of truth for plan rules. Safe to import from client and server.
// Clerk Billing decides *which* plan a user is on (plan key "pro");
// this file decides what each plan is allowed to do.

export const PRO_PLAN_KEY = "pro";

export type GatedFeature = "analyze" | "interview" | "create_resume";

/** Features Free users can't use at all (Vapi voice calls are the main cost driver). */
export const PRO_ONLY_FEATURES = ["interview"] as const;
export type ProOnlyFeature = (typeof PRO_ONLY_FEATURES)[number];
export type MeteredFeature = Exclude<GatedFeature, ProOnlyFeature>;

export function isProOnly(feature: GatedFeature): feature is ProOnlyFeature {
  return (PRO_ONLY_FEATURES as readonly GatedFeature[]).includes(feature);
}

/** Free-plan allowances for features Free users *can* use. */
export const FREE_LIMITS = {
  /** AI analyses (new uploads + re-analyses), lifetime */
  analyze: 3,
  /** Manually built resumes, per calendar month */
  create_resume: 5,
} as const satisfies Record<MeteredFeature, number>;

export const LIMIT_PERIOD: Record<MeteredFeature, "lifetime" | "monthly"> = {
  analyze: "lifetime",
  create_resume: "monthly",
};

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

/** Human-readable allowance, e.g. "3 AI resume analyses in total". */
export function describeFreeLimit(feature: MeteredFeature) {
  const period =
    LIMIT_PERIOD[feature] === "monthly" ? "per month" : "in total";
  return `${FREE_LIMITS[feature]} ${NOUNS[feature]} ${period}`;
}

/** True when a server action result failed because of a plan limit. */
export function isLimitReached(result: object): boolean {
  return "code" in result && result.code === LIMIT_REACHED;
}

export function limitReachedMessage(feature: GatedFeature) {
  if (isProOnly(feature)) {
    return "AI mock interviews are a Pro feature. Upgrade to Pro to practice with the AI interviewer.";
  }
  return `You've used all ${describeFreeLimit(feature)} on the Free plan. Upgrade to Pro for unlimited access.`;
}

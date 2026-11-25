// Single source of truth for plan rules. Safe to import from client and server.
// Clerk Billing decides *which* plan a user is on (plan key "pro");
// this file decides what each plan is allowed to do, and the landing page
// pricing card is generated from it so marketing copy can't drift from the code.

export const PRO_PLAN_KEY = "pro";
/** Display only. The real price is configured in Clerk Billing; keep in sync. */
export const PRO_PRICE_MONTHLY_USD = 12;

export type GatedFeature =
  | "analyze"
  | "interview"
  | "create_resume"
  | "job_match"
  | "ai_write"
  | "tailor"
  /** Designer templates + custom colours/fonts */
  | "design"
  /** Resume version history */
  | "history"
  /** "Tailor to a job" on the Create screen: upload/pick a resume + a job -> a tailored copy */
  | "resume_tailor";

/**
 * Features Free users can't use at all: interviews (Vapi voice calls are the
 * main cost driver), "Tailor to a job", designer looks and version history.
 */
export const PRO_ONLY_FEATURES = ["interview", "tailor", "design", "history"] as const;
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
  /** Resume vs job description matches */
  job_match: 3,
  /** AI writing actions in the editor (write/improve summary, bullets, skill ideas) */
  ai_write: 10,
  /** Tailored resumes from the Create screen (a free trial: 3 in total, ever) */
  resume_tailor: 3,
} as const satisfies Record<MeteredFeature, number>;

export const LIMIT_PERIOD: Record<MeteredFeature, "lifetime" | "monthly"> = {
  analyze: "monthly",
  create_resume: "monthly",
  job_match: "monthly",
  ai_write: "monthly",
  resume_tailor: "lifetime",
};

/**
 * Pro fair-use caps, per calendar month (UTC). Everything not listed is
 * unlimited for Pro. Admins have no caps. Interviews are capped because each
 * Vapi call costs real money, unlike Gemini analyses.
 */
export const PRO_LIMITS = {
  interview: 20,
  /** Tailored resumes (2 Gemini calls each) */
  resume_tailor: 30,
} as const;

export type ProCappedFeature = keyof typeof PRO_LIMITS;
export const isProCapped = (f: GatedFeature): f is ProCappedFeature => f in PRO_LIMITS;

/** Start of the current monthly allowance period (1st of this month, UTC). */
export function startOfMonthUTC(from = new Date()) {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
}

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

/** Sessions created at or after this moment can still be refunded. */
export function refundWindowStart(now = Date.now()) {
  return new Date(now - INTERVIEW_REFUND_WINDOW_SECONDS * 1000);
}

export type UsageCounts = {
  analyses: number;
  interviews: number;
  resumes: number;
  jobMatches: number;
  aiWrites: number;
  /** Tailored resumes ever (the Free limit is lifetime) */
  tailors: number;
  /** Tailored resumes this month (the Pro cap) */
  tailorsThisMonth: number;
};

/** What a user may start right now, given their plan and this period's usage. */
export function computeAllowed({
  isPro,
  isAdmin,
  usage,
}: {
  isPro: boolean;
  isAdmin: boolean;
  usage: UsageCounts;
}): Record<GatedFeature, boolean> {
  if (isAdmin) {
    return {
      analyze: true,
      interview: true,
      create_resume: true,
      job_match: true,
      ai_write: true,
      tailor: true,
      design: true,
      history: true,
      resume_tailor: true,
    };
  }
  if (isPro) {
    return {
      analyze: true,
      interview: usage.interviews < PRO_LIMITS.interview,
      create_resume: true,
      job_match: true,
      ai_write: true,
      tailor: true,
      design: true,
      history: true,
      resume_tailor: usage.tailorsThisMonth < PRO_LIMITS.resume_tailor,
    };
  }
  return {
    analyze: usage.analyses < FREE_LIMITS.analyze,
    interview: false, // Pro-only (PRO_ONLY_FEATURES)
    create_resume: usage.resumes < FREE_LIMITS.create_resume,
    job_match: usage.jobMatches < FREE_LIMITS.job_match,
    ai_write: usage.aiWrites < FREE_LIMITS.ai_write,
    tailor: false, // Pro-only
    design: false, // Pro-only
    history: false, // Pro-only
    resume_tailor: usage.tailors < FREE_LIMITS.resume_tailor,
  };
}

/** Error code returned by server actions when a plan limit blocks the request. */
export const LIMIT_REACHED = "LIMIT_REACHED";

const NOUNS: Record<MeteredFeature, string> = {
  analyze: "AI resume analyses",
  create_resume: "resume builds",
  job_match: "job matches",
  ai_write: "AI writing actions",
  resume_tailor: "tailored resumes",
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
  if (feature === "interview") {
    return "AI mock interviews are a Pro feature. Upgrade to Pro to practice with the AI interviewer.";
  }
  if (feature === "tailor") {
    return "Tailor to a job is a Pro feature. Upgrade to Pro to rewrite your resume for a specific job description.";
  }
  if (feature === "design") {
    return "Designer templates and custom colours and fonts are Pro features. Upgrade to Pro to use them.";
  }
  if (feature === "history") {
    return "Version history is a Pro feature. Upgrade to Pro to see and restore earlier versions of your resume.";
  }
  const period =
    LIMIT_PERIOD[feature] === "monthly"
      ? `this month (resets ${formatResetDate()})`
      : "on the Free plan";
  const upsell = isProCapped(feature)
    ? `Upgrade to Pro for ${PRO_LIMITS[feature]} a month.`
    : "Upgrade to Pro for unlimited access.";
  return `You've used all ${FREE_LIMITS[feature]} ${NOUNS[feature]} ${period}. ${upsell}`;
}

const PRO_CAP_NOUNS: Record<ProCappedFeature, string> = {
  interview: "AI mock interviews",
  resume_tailor: "tailored resumes",
};

/** Message for a Pro user who hit a monthly fair-use cap. */
export function proCapReachedMessage(feature: ProCappedFeature = "interview") {
  return `You've used all ${PRO_LIMITS[feature]} ${PRO_CAP_NOUNS[feature]} for this month. Your allowance resets on ${formatResetDate()}.`;
}

/**
 * How much of the AI reports Free users see. Everything is generated and stored
 * for every user; Pro-only parts are removed server-side before reaching a Free
 * user's browser (lib/plan-gating.ts), so upgrading unlocks existing reports.
 */
export const FREE_REPORT = {
  /** Bullet audit: every bullet is rated for Free, but only this many rewrites */
  bulletRewrites: 3,
  /** Suggested line rewrites ("improvements") */
  improvements: 3,
  /** Job match: tailored bullets (the tailored summary is Pro-only) */
  tailoredBullets: 1,
} as const;

/** Pricing card copy, generated from the limits above. */
export const PLAN_HIGHLIGHTS = {
  free: [
    `${FREE_LIMITS.analyze} AI resume analyses / month`,
    "ATS score, 13-point checklist & red flags",
    `${FREE_REPORT.bulletRewrites} bullet rewrites per report`,
    `${FREE_LIMITS.job_match} job description matches / month`,
    `${FREE_LIMITS.create_resume} resumes / month in the builder`,
    `${FREE_LIMITS.ai_write} AI writing actions / month`,
    "Live ATS checks while you write",
    "PDF export",
  ],
  pro: [
    "Unlimited AI resume analyses",
    "Every bullet rewritten, ready to paste",
    "Unlimited job matches with a tailored summary & bullets",
    "In-demand skills missing for your target role",
    `${PRO_LIMITS.interview} AI mock interviews / month`,
    "Scored interview reports & transcripts",
    "Unlimited resumes in the builder",
    "Unlimited AI writing + Tailor to a job",
    "Designer templates, custom colours & fonts",
    "Word export, version history & share view counts",
    "PDF export",
  ],
};

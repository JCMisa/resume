import "server-only";

import arcjet, {
  detectBot,
  request,
  shield,
  tokenBucket,
} from "@arcjet/next";

// Burst protection only. Plan *allowances* live in lib/plans.ts and are
// enforced by assertAllowed(); these buckets just stop rapid-fire abuse and
// runaway AI/voice spend. Each (feature, tier) gets its own bucket per user.
export const RATE_LIMITS = {
  analyze: {
    free: { capacity: 3, refillRate: 3, interval: "1h" },
    pro: { capacity: 10, refillRate: 10, interval: "1h" },
  },
  // One Gemini call per match, similar cost to an analysis
  job_match: {
    free: { capacity: 3, refillRate: 3, interval: "1h" },
    pro: { capacity: 10, refillRate: 10, interval: "1h" },
  },
  // Editor AI writing (one small Gemini call each). Free users also have a
  // monthly cap; this only stops rapid-fire clicking or scripts.
  ai_write: {
    free: { capacity: 5, refillRate: 10, interval: "1h" },
    pro: { capacity: 15, refillRate: 60, interval: "1h" },
  },
  // Tailor to a job (Pro-only; a bigger Gemini call)
  tailor: {
    pro: { capacity: 5, refillRate: 15, interval: "1h" },
  },
  // Pro-only feature: Free users are rejected by assertAllowed() before this.
  interview: {
    pro: { capacity: 3, refillRate: 6, interval: "1h" },
  },
  // Re-grading a saved interview transcript (one cheap Gemini call). Same for
  // every user; it only guards against hammering the retry button.
  grading: {
    pro: { capacity: 3, refillRate: 10, interval: "1h" },
  },
  // "Send test notification" in Settings: free to send, but don't let a
  // script flood a user's own devices. Same for every user.
  push_test: {
    pro: { capacity: 5, refillRate: 5, interval: "1h" },
  },
} as const;

export type RateLimitedFeature = keyof typeof RATE_LIMITS;

// Shared base: attack + bot protection on every metered server action.
const base = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ["userId"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      // Block AI crawlers and curl from hitting AI-backed server actions
      deny: ["CATEGORY:AI", "CURL"],
    }),
  ],
});

const bucket = (cfg: {
  capacity: number;
  refillRate: number;
  interval: "1h";
}) => base.withRule(tokenBucket({ mode: "LIVE", ...cfg }));

// Built once at module load (Arcjet recommends defining clients outside handlers).
const limiters = {
  analyze: {
    free: bucket(RATE_LIMITS.analyze.free),
    pro: bucket(RATE_LIMITS.analyze.pro),
  },
  job_match: {
    free: bucket(RATE_LIMITS.job_match.free),
    pro: bucket(RATE_LIMITS.job_match.pro),
  },
  ai_write: {
    free: bucket(RATE_LIMITS.ai_write.free),
    pro: bucket(RATE_LIMITS.ai_write.pro),
  },
  tailor: {
    pro: bucket(RATE_LIMITS.tailor.pro),
  },
  interview: {
    pro: bucket(RATE_LIMITS.interview.pro),
  },
  grading: {
    pro: bucket(RATE_LIMITS.grading.pro),
  },
  push_test: {
    pro: bucket(RATE_LIMITS.push_test.pro),
  },
};

export const RATE_LIMITED = "RATE_LIMITED";

/** Thrown when a user hits a burst limit; message says when to retry. */
export class RateLimitError extends Error {
  readonly code = RATE_LIMITED;
  constructor(readonly retryAfterSeconds: number) {
    super(`You're going a bit fast. Please try again ${formatWait(retryAfterSeconds)}.`);
    this.name = "RateLimitError";
  }
}

function formatWait(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "in a moment";
  if (seconds < 60) return `in ${Math.ceil(seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "in about a minute" : `in about ${minutes} minutes`;
}

/**
 * Run shield + bot detection + the plan-sized token bucket for this feature.
 * Call AFTER assertAllowed() (so plan-blocked requests don't burn tokens),
 * passing its isPro result. Throws RateLimitError or a generic Error.
 */
export async function enforceRateLimit(
  feature: RateLimitedFeature,
  userId: string,
  isPro: boolean,
) {
  const tiers = limiters[feature];
  const limiter = "free" in tiers && !isPro ? tiers.free : tiers.pro;

  const decision = await limiter.protect(await request(), {
    userId,
    requested: 1,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new RateLimitError(decision.reason.reset);
    }
    throw new Error("This request was blocked by our security checks.");
  }
}

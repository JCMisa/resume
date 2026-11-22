"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { users, interviews, usageEvents } from "@/config/schema";
import { eq, and, gte, count, ne, or, isNull } from "drizzle-orm";
import { db } from "@/config/db";
import {
  LIMIT_PERIOD,
  PRO_PLAN_KEY,
  computeAllowed,
  startOfMonthUTC,
} from "@/lib/plans";

export async function getUserBillingStatus() {
  const { userId, has } = await auth();
  if (!userId)
    return {
      isPro: false,
      isAdmin: false,
      limits: { analyses: 0, interviews: 0, resumes: 0, jobMatches: 0 },
      allowed: {
        analyze: false,
        interview: false,
        create_resume: false,
        job_match: false,
      },
    };

  const monthStart = startOfMonthUTC();
  const since = (feature: keyof typeof LIMIT_PERIOD) =>
    LIMIT_PERIOD[feature] === "monthly" ? monthStart : undefined;

  const analyzeSince = since("analyze");
  const resumeSince = since("create_resume");
  const jobMatchSince = since("job_match");

  const [[userRecord], [analysesRow], [resumesRow], [interviewsRow], [jobMatchesRow]] =
    await Promise.all([
      db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      // Every AI analysis (new upload or re-analysis) is logged in usage_events.
      db
        .select({ value: count() })
        .from(usageEvents)
        .where(
          and(
            eq(usageEvents.userId, userId),
            eq(usageEvents.kind, "resume_analysis"),
            analyzeSince ? gte(usageEvents.createdAt, analyzeSince) : undefined,
          ),
        ),
      // Editor builds, from the usage log (survives deletion, so deleting
      // and rebuilding can't reset the monthly allowance).
      db
        .select({ value: count() })
        .from(usageEvents)
        .where(
          and(
            eq(usageEvents.userId, userId),
            eq(usageEvents.kind, "resume_create"),
            resumeSince ? gte(usageEvents.createdAt, resumeSince) : undefined,
          ),
        ),
      // Interviews this month, for the Pro fair-use cap.
      db
        .select({ value: count() })
        .from(interviews)
        .where(
          and(
            eq(interviews.userId, userId),
            // Cancelled sessions (failed to connect / no answers) don't count
            or(isNull(interviews.status), ne(interviews.status, "failed")),
            gte(interviews.createdAt, monthStart),
          ),
        ),
      // Job description matches (usage log, survives deletion)
      db
        .select({ value: count() })
        .from(usageEvents)
        .where(
          and(
            eq(usageEvents.userId, userId),
            eq(usageEvents.kind, "job_match"),
            jobMatchSince ? gte(usageEvents.createdAt, jobMatchSince) : undefined,
          ),
        ),
    ]);

  const usage = {
    analyses: analysesRow?.value ?? 0,
    interviews: interviewsRow?.value ?? 0,
    resumes: resumesRow?.value ?? 0,
    jobMatches: jobMatchesRow?.value ?? 0,
  };

  // Pro is checked by Clerk plan key (not a Clerk feature) so it stays correct
  // even if a feature is accidentally attached to the Free plan.
  // Admins get everything Pro gets, without the fair-use caps.
  const isAdmin = userRecord?.role === "admin";
  const isPro = isAdmin || has({ plan: PRO_PLAN_KEY });

  return {
    isPro,
    isAdmin,
    limits: usage,
    allowed: computeAllowed({ isPro, isAdmin, usage }),
  };
}

// ── Pro plan id for direct checkout ─────────────────────────────────────────
// Clerk's <CheckoutButton> needs the plan *id*, which differs between the dev
// and production Clerk instances. Resolve it from the plan key instead of
// hard-coding it, and cache per server instance (plan ids rarely change).
const PLAN_ID_TTL_MS = 60 * 60 * 1000;
let proPlanIdCache: { id: string; at: number } | null = null;

export async function getProPlanIdAction() {
  try {
    if (proPlanIdCache && Date.now() - proPlanIdCache.at < PLAN_ID_TTL_MS) {
      return { success: true as const, data: proPlanIdCache.id };
    }
    const client = await clerkClient();
    const plans = await client.billing.getPlanList({ payerType: "user" });
    const pro = plans.data.find((p) => p.slug === PRO_PLAN_KEY);
    if (!pro) throw new Error(`No Clerk user plan with key "${PRO_PLAN_KEY}".`);

    proPlanIdCache = { id: pro.id, at: Date.now() };
    return { success: true as const, data: pro.id };
  } catch (error) {
    console.error("Pro Plan Lookup Failure:", error);
    return { success: false as const, error: "Checkout is unavailable right now." };
  }
}

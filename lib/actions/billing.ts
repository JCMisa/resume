"use server";

import { auth } from "@clerk/nextjs/server";
import { users, resumes, interviews, usageEvents } from "@/config/schema";
import { eq, and, gte, count, ne, or, isNull } from "drizzle-orm";
import { db } from "@/config/db";
import { FREE_LIMITS, LIMIT_PERIOD, PRO_PLAN_KEY } from "@/lib/plans";

function startOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getUserBillingStatus() {
  const { userId, has } = await auth();
  if (!userId)
    return {
      isPro: false,
      limits: { analyses: 0, interviews: 0, resumes: 0 },
      allowed: { analyze: false, interview: false, create_resume: false },
    };

  const monthStart = startOfMonth();
  const since = (feature: keyof typeof LIMIT_PERIOD) =>
    LIMIT_PERIOD[feature] === "monthly" ? monthStart : undefined;

  const analyzeSince = since("analyze");
  const resumeSince = since("create_resume");

  const [[userRecord], [analysesRow], [resumesRow], [interviewsRow]] =
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
      // Manual builds only (status "created").
      db
        .select({ value: count() })
        .from(resumes)
        .where(
          and(
            eq(resumes.userId, userId),
            eq(resumes.status, "created"),
            resumeSince ? gte(resumes.createdAt, resumeSince) : undefined,
          ),
        ),
      // Interviews are Pro-only; counted for display (and a future Pro fair-use cap).
      db
        .select({ value: count() })
        .from(interviews)
        .where(
          and(
            eq(interviews.userId, userId),
            // Cancelled sessions (failed to connect / no answers) don't count
            or(isNull(interviews.status), ne(interviews.status, "failed")),
          ),
        ),
    ]);

  const usage = {
    analyses: analysesRow?.value ?? 0,
    interviews: interviewsRow?.value ?? 0,
    resumes: resumesRow?.value ?? 0,
  };

  // Admins and Clerk Billing "pro" subscribers bypass all limits and unlock
  // Pro-only features. Checked by plan key (not a Clerk feature) so it stays
  // correct even if a feature is accidentally attached to the Free plan.
  const isPro = userRecord?.role === "admin" || has({ plan: PRO_PLAN_KEY });

  if (isPro) {
    return {
      isPro: true,
      limits: usage,
      allowed: { analyze: true, interview: true, create_resume: true },
    };
  }

  return {
    isPro: false,
    limits: usage,
    allowed: {
      analyze: usage.analyses < FREE_LIMITS.analyze,
      interview: false, // Pro-only feature (see PRO_ONLY_FEATURES)
      create_resume: usage.resumes < FREE_LIMITS.create_resume,
    },
  };
}

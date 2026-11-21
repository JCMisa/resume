"use server";

import { auth } from "@clerk/nextjs/server";
import { users, resumes, interviews, usageEvents } from "@/config/schema";
import { eq, and, gte, count, ne, or, isNull } from "drizzle-orm";
import { db } from "@/config/db";
import {
  FREE_LIMITS,
  LIMIT_PERIOD,
  PRO_LIMITS,
  PRO_PLAN_KEY,
} from "@/lib/plans";

function startOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export async function getUserBillingStatus() {
  const { userId, has } = await auth();
  if (!userId)
    return {
      isPro: false,
      isAdmin: false,
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
    ]);

  const usage = {
    analyses: analysesRow?.value ?? 0,
    interviews: interviewsRow?.value ?? 0,
    resumes: resumesRow?.value ?? 0,
  };

  // Pro is checked by Clerk plan key (not a Clerk feature) so it stays correct
  // even if a feature is accidentally attached to the Free plan.
  // Admins get everything Pro gets, without the fair-use caps.
  const isAdmin = userRecord?.role === "admin";
  const isPro = isAdmin || has({ plan: PRO_PLAN_KEY });

  if (isPro) {
    return {
      isPro: true,
      isAdmin,
      limits: usage,
      allowed: {
        analyze: true,
        interview: isAdmin || usage.interviews < PRO_LIMITS.interview,
        create_resume: true,
      },
    };
  }

  return {
    isPro: false,
    isAdmin: false,
    limits: usage,
    allowed: {
      analyze: usage.analyses < FREE_LIMITS.analyze,
      interview: false, // Pro-only feature (see PRO_ONLY_FEATURES)
      create_resume: usage.resumes < FREE_LIMITS.create_resume,
    },
  };
}

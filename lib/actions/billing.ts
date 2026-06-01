"use server";

import { auth } from "@clerk/nextjs/server";
import { users, resumes, interviews } from "@/config/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { db } from "@/config/db";

export async function getUserBillingStatus() {
  const { userId, has } = await auth();
  if (!userId)
    return { isPro: false, limits: { analyses: 0, interviews: 0, resumes: 0 } };

  // 1. Fetch user core role context
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const userRole = userRecord?.role || "user";

  // 🚀 RULE 1: Admin override or Clerk Pro plan entitlement bypasses all checks
  const hasProPlan = has({ plan: "pro" }) || has({ feature: "pro" });
  if (userRole === "admin" || hasProPlan) {
    return {
      isPro: true,
      limits: { analyses: "∞", interviews: "∞", resumes: "∞" },
      allowed: { analyze: true, interview: true, create_resume: true },
    };
  }

  // 2. Setup date boundaries for monthly items (AI Analyses reset monthly)
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  // 📊 CALCULATE ACCURATE METRICS SEPARATING RESUME STATUS CODES

  // A. AI Analyses Count: Only counts resumes with a status of 'parsed' (Lifetime limit)
  const [analysesQuery] = await db
    .select({ value: count() })
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, userId),
        eq(resumes.status, "parsed"), // 🚀 FIXED: Only target AI parse flows
      ),
    );
  const currentAnalysesCount = analysesQuery?.value || 0;

  // B. Resume Creation Attempts: Only counts manual builds where status is 'created' generated this month
  const [resumesQuery] = await db
    .select({ value: count() })
    .from(resumes)
    .where(
      and(
        eq(resumes.userId, userId),
        eq(resumes.status, "created"), // 🚀 FIXED: Only target manual design attempts
        gte(resumes.createdAt, firstDayOfMonth),
      ),
    );
  const currentResumesCount = resumesQuery?.value || 0;

  // C. Lifetime Mock Interviews
  const [interviewsQuery] = await db
    .select({ value: count() })
    .from(interviews)
    .where(eq(interviews.userId, userId));
  const currentInterviewsCount = interviewsQuery?.value || 0;

  return {
    isPro: false,
    limits: {
      analyses: currentAnalysesCount,
      interviews: currentInterviewsCount,
      resumes: currentResumesCount,
    },
    allowed: {
      analyze: currentAnalysesCount < 3,
      interview: currentInterviewsCount < 2,
      create_resume: currentResumesCount < 5,
    },
  };
}

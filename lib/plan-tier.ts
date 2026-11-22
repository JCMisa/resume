import "server-only";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { PRO_PLAN_KEY } from "@/lib/plans";

/**
 * Pro (or admin) for the signed-in user: one cheap check for deciding which
 * view of a report to send (lib/plan-gating.ts). Same rule as
 * getUserBillingStatus(), without counting usage.
 */
export async function currentUserIsPro(): Promise<boolean> {
  const { userId, has } = await auth();
  if (!userId) return false;
  if (has({ plan: PRO_PLAN_KEY })) return true;
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role === "admin";
}

import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { users } from "@/config/schema";
import { PRO_PLAN_KEY } from "@/lib/plans";

// Whether ANOTHER user (e.g. the owner of a shared resume) is on Pro.
// auth().has() only knows about the signed-in visitor, so this asks Clerk's
// Backend API, cached per server instance so busy public pages don't call
// Clerk on every view. On any error: "not Pro" (shows the footer; safe).

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { pro: boolean; at: number }>();

/** Subscription item statuses that still give Pro access. */
const ACTIVE = new Set(["active", "past_due"]);

export async function userIsPro(userId: string): Promise<boolean> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.pro;

  let pro = false;
  try {
    const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (row?.role === "admin") pro = true;
    else {
      const client = await clerkClient();
      const sub = await client.billing.getUserBillingSubscription(userId);
      pro = sub.subscriptionItems.some((item) => ACTIVE.has(item.status) && item.plan?.slug === PRO_PLAN_KEY);
    }
  } catch (error) {
    // No subscription yet (404) is normal for Free users
    const status = (error as { status?: number })?.status;
    if (status !== 404) console.error("Owner Plan Lookup Failure:", error);
  }

  if (cache.size > 5000) cache.clear(); // simple bound
  cache.set(userId, { pro, at: Date.now() });
  return pro;
}

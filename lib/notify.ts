import "server-only";

import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/config/db";
import { notifications, users } from "@/config/schema";
import {
  normalizeNotification,
  pushPayload,
  resolvePrefs,
  usageNoticeFor,
  type NotificationInput,
  type UsageFeature,
} from "@/lib/notifications";
import type { UsageCounts } from "@/lib/plans";
import { sendPushToUser } from "@/lib/push";

/**
 * Store a notification for the bell and push it to the user's devices
 * (if that category is switched on for devices). Never throws.
 *
 * The row is stored even when the in-app switch is off (the bell filters by
 * the user's switches when it loads), so turning a category back on later
 * doesn't resend old alerts, and dedupe keys keep working.
 */
export async function notify(userId: string, input: NotificationInput): Promise<void> {
  try {
    const n = normalizeNotification(input);
    const [inserted] = await db
      .insert(notifications)
      .values({ userId, ...n })
      .onConflictDoNothing({ target: [notifications.userId, notifications.dedupeKey] })
      .returning({ id: notifications.id });
    if (!inserted) return; // already sent (same dedupe key)

    const [row] = await db
      .select({ prefs: users.notificationPrefs })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!resolvePrefs(row?.prefs).push[n.category]) return;

    await sendPushToUser(userId, pushPayload(n));
  } catch (error) {
    console.error("Notify Failure:", error);
  }
}

/** notify() after the response is sent, so it never slows down an action. */
export function notifyLater(userId: string, input: NotificationInput | null | undefined) {
  if (!input) return;
  after(() => notify(userId, input));
}

/**
 * After a metered action succeeded: warn when one is left / none are left
 * this month. `billing` is the status that allowed the action.
 */
export function notifyUsageLater(
  userId: string,
  feature: UsageFeature,
  billing: { isPro: boolean; isAdmin: boolean; limits: UsageCounts },
) {
  notifyLater(userId, usageNoticeFor(feature, billing));
}

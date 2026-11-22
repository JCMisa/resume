"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { and, count, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/config/db";
import { notifications, pushSubscriptions, users } from "@/config/schema";
import {
  NOTIFICATION_LIST_LIMIT,
  NOTIFICATION_RETENTION_DAYS,
  deviceLabel,
  enabledInAppCategories,
  parsePushSubscription,
  resolvePrefs,
} from "@/lib/notifications";
import { pushConfigured, sendPushToUser } from "@/lib/push";
import { enforceRateLimit, RateLimitError } from "@/lib/arcjet";
import { toActionError } from "@/lib/billing-guard";

// Bell, notification settings and device (Web Push) subscriptions.
// Every query is scoped to the signed-in user.

const UNAUTHORIZED = { success: false as const, error: "Not signed in." };

async function loadPrefs(userId: string) {
  const [row] = await db
    .select({ prefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return resolvePrefs(row?.prefs);
}

/** Latest notifications for the bell, plus the unread count. */
export async function getNotificationsAction() {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;

    const categories = enabledInAppCategories(await loadPrefs(userId));
    if (!categories.length) {
      return { success: true as const, data: { items: [], unread: 0, allMuted: true } };
    }

    // Retention: prune this user's old rows (cheap, indexed; no cron needed)
    const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const visible = and(eq(notifications.userId, userId), inArray(notifications.category, categories));

    const [, items, [unreadRow]] = await Promise.all([
      db.delete(notifications).where(and(eq(notifications.userId, userId), lt(notifications.createdAt, cutoff))),
      db
        .select({
          id: notifications.id,
          kind: notifications.kind,
          title: notifications.title,
          body: notifications.body,
          href: notifications.href,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(visible)
        .orderBy(desc(notifications.createdAt))
        .limit(NOTIFICATION_LIST_LIMIT),
      db.select({ value: count() }).from(notifications).where(and(visible, isNull(notifications.readAt))),
    ]);

    return {
      success: true as const,
      data: { items, unread: unreadRow?.value ?? 0, allMuted: false },
    };
  } catch (error) {
    console.error("Get Notifications Failure:", error);
    return { success: false as const, error: "Couldn't load notifications." };
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return { success: false as const, error: "Unknown notification." };
    }
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { success: true as const };
  } catch (error) {
    console.error("Mark Notification Read Failure:", error);
    return { success: false as const, error: "Couldn't update the notification." };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { success: true as const };
  } catch (error) {
    console.error("Mark All Notifications Read Failure:", error);
    return { success: false as const, error: "Couldn't update notifications." };
  }
}

/** Switches + this account's devices, for Settings → Notifications. */
export async function getNotificationSettingsAction() {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    const [prefs, devices] = await Promise.all([
      loadPrefs(userId),
      db
        .select({
          id: pushSubscriptions.id,
          label: pushSubscriptions.label,
          endpoint: pushSubscriptions.endpoint,
          createdAt: pushSubscriptions.createdAt,
        })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId))
        .orderBy(desc(pushSubscriptions.createdAt)),
    ]);
    return {
      success: true as const,
      data: { prefs, devices, pushAvailable: pushConfigured() },
    };
  } catch (error) {
    console.error("Get Notification Settings Failure:", error);
    return { success: false as const, error: "Couldn't load your notification settings." };
  }
}

export async function updateNotificationPrefsAction(prefs: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    const clean = resolvePrefs(prefs); // never store untrusted shapes
    await db
      .update(users)
      .set({ notificationPrefs: clean, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { success: true as const, data: clean };
  } catch (error) {
    console.error("Update Notification Prefs Failure:", error);
    return { success: false as const, error: "Couldn't save your notification settings." };
  }
}

/**
 * Save this browser's push subscription for the signed-in user. The endpoint
 * is unique, so if another account had turned push on in this same browser,
 * the device moves to this account (the user just opted in here).
 */
export async function savePushSubscriptionAction(subscription: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    if (!pushConfigured()) {
      return { success: false as const, error: "Device notifications aren't set up on the server yet." };
    }
    const sub = parsePushSubscription(subscription);
    if (!sub) return { success: false as const, error: "This browser sent an invalid subscription." };

    const label = deviceLabel((await headers()).get("user-agent"));
    await db
      .insert(pushSubscriptions)
      .values({ userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, label })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, label, createdAt: new Date() },
      });
    return { success: true as const };
  } catch (error) {
    console.error("Save Push Subscription Failure:", error);
    return { success: false as const, error: "Couldn't turn on notifications for this device." };
  }
}

/**
 * Whose is this browser's subscription? Used on load: if it isn't the
 * signed-in user's (another account turned it on, or it was removed), the
 * browser unsubscribes so it can't receive someone else's alerts.
 */
export async function checkPushSubscriptionAction(endpoint: string) {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    if (typeof endpoint !== "string" || endpoint.length > 1000) {
      return { success: true as const, data: "none" as const };
    }
    const [row] = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    const owner = !row ? ("none" as const) : row.userId === userId ? ("mine" as const) : ("other" as const);
    return { success: true as const, data: owner };
  } catch (error) {
    console.error("Check Push Subscription Failure:", error);
    return { success: false as const, error: "Couldn't check this device." };
  }
}

/** Turn off this browser (by endpoint) or a listed device (by id). */
export async function removePushSubscriptionAction(target: { endpoint?: string; id?: string }) {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    if (typeof target?.id === "string" && /^[0-9a-f-]{36}$/i.test(target.id)) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.id, target.id), eq(pushSubscriptions.userId, userId)));
    } else if (typeof target?.endpoint === "string" && target.endpoint.length <= 1000) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.endpoint, target.endpoint), eq(pushSubscriptions.userId, userId)));
    } else {
      return { success: false as const, error: "Unknown device." };
    }
    return { success: true as const };
  } catch (error) {
    console.error("Remove Push Subscription Failure:", error);
    return { success: false as const, error: "Couldn't remove that device." };
  }
}

/** A test notification to all of this account's devices (not stored in the bell). */
export async function sendTestPushAction() {
  try {
    const { userId } = await auth();
    if (!userId) return UNAUTHORIZED;
    await enforceRateLimit("push_test", userId, true);
    const sent = await sendPushToUser(userId, {
      title: "Notifications are working",
      body: "This is how ResuMe will let you know when your results are ready.",
      url: "/settings?tab=notifications",
      tag: "test",
      always: true, // show it even if ResuMe is the focused tab
    });
    if (!sent) {
      return {
        success: false as const,
        error: "No device accepted the test. Turn notifications off and on again for this device.",
      };
    }
    return { success: true as const, data: { sent } };
  } catch (error) {
    console.error("Send Test Push Failure:", error);
    if (error instanceof RateLimitError) return toActionError(error, "");
    return { success: false as const, error: "Couldn't send a test notification." };
  }
}

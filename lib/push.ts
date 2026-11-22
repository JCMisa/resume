import "server-only";

import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/config/db";
import { pushSubscriptions } from "@/config/schema";

// Web Push (VAPID). Browsers' own push services (Google, Mozilla, Apple)
// deliver the messages for free; payloads are end-to-end encrypted to the
// device by web-push. Keys: NEXT_PUBLIC_VAPID_PUBLIC_KEY (public by design),
// VAPID_PRIVATE_KEY (server only), VAPID_SUBJECT (mailto: or https: contact).

let configured: boolean | null = null;

export function pushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return (configured = false);
  try {
    setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (error) {
    console.error("Web Push VAPID config invalid:", error);
    configured = false;
  }
  return configured;
}

export type PushMessage = { title: string; body: string; url: string; tag: string; always?: boolean };

/**
 * Send to every device the user turned on. Best effort, never throws.
 * Devices the push service reports as gone (404/410) are deleted.
 * Returns how many devices accepted the message.
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<number> {
  try {
    if (!pushConfigured()) return 0;
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    if (!subs.length) return 0;

    const payload = JSON.stringify(message);
    const gone: string[] = [];
    const results = await Promise.allSettled(
      subs.map((s) =>
        sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            // Drop it if the device stays offline for a day; results aren't urgent
            { TTL: 60 * 60 * 24, urgency: "normal", timeout: 10_000 },
          )
          .catch((error: unknown) => {
            if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
              gone.push(s.id);
            }
            throw error;
          }),
      ),
    );

    if (gone.length) {
      await db
        .delete(pushSubscriptions)
        .where(and(eq(pushSubscriptions.userId, userId), inArray(pushSubscriptions.id, gone)));
    }
    const failed = results.filter((r) => r.status === "rejected").length - gone.length;
    if (failed > 0) console.warn(`Web Push: ${failed} device(s) failed for a user`);
    return results.filter((r) => r.status === "fulfilled").length;
  } catch (error) {
    console.error("Web Push Failure:", error);
    return 0;
  }
}

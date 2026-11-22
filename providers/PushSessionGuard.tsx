"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { checkPushSubscriptionAction } from "@/lib/actions/notifications";
import { existingSubscription } from "@/lib/push-client";

/**
 * Shared-computer safety for device notifications. Push permission belongs to
 * the browser, but our subscriptions belong to an account, so:
 * - signed out: this browser stops receiving anyone's notifications
 * - signed in as someone else than who turned it on (or it was removed from
 *   Settings on another device): this browser unsubscribes
 * The server drops the stale row the next time a push to it fails (410).
 */
export function PushSessionGuard() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const sub = await existingSubscription();
        if (!sub || cancelled) return;
        if (!isSignedIn) {
          await sub.unsubscribe();
          return;
        }
        const res = await checkPushSubscriptionAction(sub.endpoint);
        if (!cancelled && res.success && res.data !== "mine") await sub.unsubscribe();
      } catch {
        // Best effort; never break the page over this
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  return null;
}

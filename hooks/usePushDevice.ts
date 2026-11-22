"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  checkPushSubscriptionAction,
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from "@/lib/actions/notifications";
import { existingSubscription, pushSupport, subscribeThisBrowser, type PushSupport } from "@/lib/push-client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushDeviceStatus =
  | "loading"
  | "unsupported" // browser can't do web push
  | "needs-install" // iPhone/iPad: add to Home Screen first
  | "unconfigured" // server keys missing
  | "blocked" // user clicked Block in the browser prompt
  | "off"
  | "on";

/** On/off state of device notifications for THIS browser and the signed-in account. */
export function usePushDevice() {
  const [status, setStatus] = useState<PushDeviceStatus>("loading");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const support: PushSupport = pushSupport();
    if (support !== "supported") return setStatus(support);
    if (!PUBLIC_KEY) return setStatus("unconfigured");
    if (Notification.permission === "denied") return setStatus("blocked");
    try {
      const sub = await existingSubscription();
      if (!sub) {
        setEndpoint(null);
        return setStatus("off");
      }
      const res = await checkPushSubscriptionAction(sub.endpoint);
      const mine = res.success && res.data === "mine";
      setEndpoint(mine ? sub.endpoint : null);
      setStatus(mine && Notification.permission === "granted" ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }, []);

  useEffect(() => {
    // Initial read of browser state (async; nothing set synchronously)
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh]);

  /** Must be called from a click (browsers require a user gesture for the prompt). */
  const turnOn = useCallback(async () => {
    if (!PUBLIC_KEY) {
      toast.error("Device notifications aren't set up yet.");
      return false;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        if (permission === "denied") toast.error("Notifications are blocked for ResuMe in this browser.");
        return false;
      }
      const sub = await subscribeThisBrowser(PUBLIC_KEY);
      const res = await savePushSubscriptionAction(sub.toJSON());
      if (!res.success) {
        await sub.unsubscribe().catch(() => {});
        toast.error(res.error);
        setStatus("off");
        return false;
      }
      setEndpoint(sub.endpoint);
      setStatus("on");
      toast.success("Device notifications are on for this browser.");
      return true;
    } catch (error) {
      console.error("Push subscribe failed:", error);
      toast.error("Couldn't turn on notifications for this device. Try again.");
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const turnOff = useCallback(async () => {
    setBusy(true);
    try {
      const sub = await existingSubscription();
      const target = sub?.endpoint ?? endpoint;
      if (target) await removePushSubscriptionAction({ endpoint: target });
      await sub?.unsubscribe();
      setEndpoint(null);
      setStatus("off");
      toast.success("Device notifications are off for this browser.");
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
      toast.error("Couldn't turn off notifications for this device.");
    } finally {
      setBusy(false);
    }
  }, [endpoint]);

  return { status, endpoint, busy, turnOn, turnOff, refresh };
}

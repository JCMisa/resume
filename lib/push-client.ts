// Browser-only helpers for device (Web Push) notifications.
// The service worker is public/sw.js; the server side is lib/push.ts.

export const SW_URL = "/sw.js";

export type PushSupport = "supported" | "unsupported" | "needs-install";

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac with touch
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad only allow web push for apps added to the Home Screen. */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS() && !isStandalone()) return "needs-install";
  const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  return ok ? "supported" : "unsupported";
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

/** This browser's current subscription, without registering anything. */
export async function existingSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "supported") return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Register the worker (if needed) and subscribe. Call after permission is granted. */
export async function subscribeThisBrowser(publicKey: string): Promise<PushSubscription> {
  await navigator.serviceWorker.register(SW_URL, { scope: "/", updateViaCache: "none" });
  const reg = await navigator.serviceWorker.ready;
  const options = { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) };
  const current = await reg.pushManager.getSubscription();
  if (current) return current;
  try {
    return await reg.pushManager.subscribe(options);
  } catch (error) {
    // A stale subscription made with an old key blocks a new one: reset once
    const stale = await reg.pushManager.getSubscription();
    if (!stale) throw error;
    await stale.unsubscribe();
    return reg.pushManager.subscribe(options);
  }
}

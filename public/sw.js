// ResuMe service worker: device (Web Push) notifications only. No caching or
// offline support. Served with no-cache headers (next.config.ts) so updates
// apply right away.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** Same-site paths only, so a payload can never open another website. */
function safePath(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = typeof data.title === "string" && data.title ? data.title : "ResuMe";
  const body = typeof data.body === "string" ? data.body : "";
  const url = safePath(data.url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Let open tabs refresh their bell right away
      for (const client of windows) client.postMessage({ type: "resume:notification" });

      // Already looking at ResuMe: the bell shows it, so skip the system pop-up
      // (unless it's a test notification)
      const focused = windows.some((c) => c.focused && c.visibilityState === "visible");
      if (focused && !data.always) return;

      await self.registration.showNotification(title, {
        body,
        tag: typeof data.tag === "string" ? data.tag : undefined,
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Reuse an open ResuMe tab when there is one
      const existing = windows.find((c) => new URL(c.url).origin === url.origin);
      if (existing) {
        await existing.focus();
        if ("navigate" in existing) return existing.navigate(url.href);
        return;
      }
      return self.clients.openWindow(url.href);
    })(),
  );
});

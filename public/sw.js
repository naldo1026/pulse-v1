// Service worker: push notifications only, no offline caching.
// Served with no-cache (vercel.json) so updates land on the next launch.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Every push must show a notification. iOS revokes the subscription of a
// web app that receives pushes without showing anything.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(d.title || "Pulse", {
      body: d.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: d.tag,
      data: { url: d.url || "/" },
    })
  );
});

// Focus the app if it's already open and tell it where to go, otherwise
// open it at the notification's URL.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const win = wins.find((w) => "focus" in w);
    if (win) {
      win.postMessage({ type: "open", url });
      return win.focus();
    }
    return self.clients.openWindow(url);
  })());
});

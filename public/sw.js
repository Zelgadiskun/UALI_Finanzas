// Hand-rolled app-shell service worker — no Workbox: this app has one
// static build output with content-hashed filenames that change every
// deploy, so there's no fixed asset list to precache at build time. Instead
// this precaches the shell itself and caches hashed assets as they're
// fetched, which is enough to make "open the app with no connection" work
// after the first real visit.
const CACHE_VERSION = "ffos-shell-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Supabase and Google Fonts go straight to network — this SW only owns
  // the app shell and its own static assets, not third-party data/fonts.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, so a real connection always gets the latest
  // build. Offline, fall back to the cached shell — the client router still
  // renders whatever route was requested once it hydrates.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        async () => (await caches.match("/index.html")) ?? (await caches.match("/")),
      ),
    );
    return;
  }

  // Hashed build assets never change under the same filename: cache-first,
  // filling the cache in on first fetch.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

// PWA Web Push & Notification handling
self.addEventListener("push", (event) => {
  let data = { title: "UALÍ Finanzas", body: "Revisá tus movimientos y protegé tu racha diaria." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || "Revisá tus movimientos y protegé tu racha diaria.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.url || "/",
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || "UALÍ Finanzas", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

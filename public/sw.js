// Service Worker para UALÍ Finanzas PWA
// Implementado con Google Workbox para modo offline y persistencia en navegador

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js");

const CACHE_VERSION = "uali-v2";
const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-16.png",
  "/icon-32.png",
  "/icon-180.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/privacidad.html",
  "/terminos.html",
];

if (typeof workbox !== "undefined" && workbox) {
  // Configuración de Workbox
  workbox.setConfig({ debug: false });

  workbox.core.setCacheNameDetails({
    prefix: "uali",
    suffix: CACHE_VERSION,
    precache: "precache",
    runtime: "runtime",
  });

  // Tomar control inmediato de los clientes
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // 1. Precaching de la App Shell básica y activos estáticos clave
  workbox.precaching.precacheAndRoute(
    APP_SHELL_ASSETS.map((url) => ({ url, revision: CACHE_VERSION })),
  );

  // 2. Navegación SPA: Estrategia NetworkFirst para HTML con fallback al App Shell (/index.html)
  // Permite que rutas como /presupuesto, /deudas, /educacion funcionen sin conexión.
  const handler = workbox.precaching.createHandlerBoundToURL("/index.html");
  const navigationRoute = new workbox.routing.NavigationRoute(handler, {
    denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
  });
  workbox.routing.registerRoute(navigationRoute);

  // Red de seguridad adicional para peticiones de navegación directas
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: `uali-navigation-${CACHE_VERSION}`,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        }),
      ],
    }),
  );

  // 3. Activos estáticos empaquetados por Vite (CSS, JS, Web Workers, Chunks en /assets/)
  // StaleWhileRevalidate para obtener respuestas inmediatas mientras se actualiza en segundo plano
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "worker" ||
      url.pathname.startsWith("/assets/"),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `uali-static-assets-${CACHE_VERSION}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    }),
  );

  // 4. Imágenes (PNG, SVG, JPG, WebP, Favicons)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: `uali-images-${CACHE_VERSION}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );

  // 5. Google Fonts (Hojas de estilo y tipografías WOFF2)
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
    }),
  );

  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );

  // 6. Consultas de lectura a Supabase REST (GET): NetworkFirst con expiración
  workbox.routing.registerRoute(
    ({ url, request }) => url.origin.includes("supabase.co") && request.method === "GET",
    new workbox.strategies.NetworkFirst({
      cacheName: `uali-supabase-api-${CACHE_VERSION}`,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    }),
  );
} else {
  // Fallback nativo en caso de que la red bloquee la CDN de Workbox
  const FALLBACK_CACHE = `uali-fallback-${CACHE_VERSION}`;
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(FALLBACK_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)));
    self.skipWaiting();
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k !== FALLBACK_CACHE).map((k) => caches.delete(k))),
        )
        .then(() => self.clients.claim()),
    );
  });

  self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(
          async () => (await caches.match("/index.html")) ?? (await caches.match("/")),
        ),
      );
      return;
    }
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  });
}

// 7. Notificaciones Push (Web Push API)
self.addEventListener("push", (event) => {
  let data = { title: "UALÍ Finanzas", body: "Revisá tus finanzas y protegé tu racha activa." };
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

// 8. Comunicación con clientes
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

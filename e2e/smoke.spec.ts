import { test, expect } from "@playwright/test";

test("loads the app shell and shows the auth screen when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "FFOS Wallet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("a deep link resolves via the SPA fallback instead of 404ing", async ({ page }) => {
  // This is the one thing Phase 7's static-SPA conversion could get wrong
  // silently: a pure static host has no server-side router, so /deudas only
  // works if public/_redirects rewrites it to index.html for the client
  // router to pick up.
  const response = await page.goto("/deudas");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "FFOS Wallet" })).toBeVisible();
});

test("registers a service worker that precaches the app shell", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true));

  const cachedPaths = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys[0]!);
    const requests = await cache.keys();
    return requests.map((r) => new URL(r.url).pathname).sort();
  });

  expect(cachedPaths).toContain("/index.html");
  expect(cachedPaths).toContain("/manifest.webmanifest");
});

test("exposes a valid installable-PWA manifest", async ({ page, request }) => {
  await page.goto("/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");

  const response = await request.get(manifestHref!);
  const manifest = await response.json();
  expect(manifest.name).toBe("FFOS Wallet");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBeGreaterThan(0);
});

import { defineConfig, devices } from "@playwright/test";

// Runs against the real static build output (.output/public), not the dev
// server — the thing this suite has to prove is that the SPA-mode build
// (Phase 7) actually works when served as plain static files: no Node
// process, no SSR, deep links resolved only by public/_redirects. `bun run
// build` must run before this (see package.json's test:e2e script).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "bunx serve -s .output/public -l 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env["CI"],
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

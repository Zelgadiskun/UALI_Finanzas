import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// Separate from vite.config.ts on purpose: tanstackStart()/nitro() build the
// app, they have nothing to do with running unit tests and pull in a much
// heavier (and SSR-shaped) pipeline than a plain Vite + jsdom setup needs.
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] }), viteReact()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: false,
    // e2e/ holds Playwright specs — a different `test()` API that Vitest
    // would otherwise also try (and fail) to run.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});

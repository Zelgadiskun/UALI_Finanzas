import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Standalone TanStack Start config — no @lovable.dev/vite-tanstack-config
// dependency. SPA mode: no server function or API route in this app talks to
// anything but Supabase directly from the client, so there's nothing for a
// Node server to render per-request. `bun run build` prerenders one static
// shell (.output/public/_shell.html) and lets the router hydrate and take
// over from there — that's the only directory that matters for deployment.
//
// The nitro preset stays "node-server", not "static": nitro's own "static"
// preset tries to run its prerender crawler over Start's SSR build entry and
// breaks ("rolldownOptions.input should not be an html file when building
// for SSR") on this nitro/react-start beta pairing. node-server still builds
// a server bundle in .output/server, but nothing deploys or runs it — it's
// dead weight from the build, not a runtime dependency.
export default defineConfig({
  server: { port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({ spa: { enabled: true } }),
    nitro({ preset: "node-server" }),
    viteReact(),
  ],
});

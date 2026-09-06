import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Standalone TanStack Start config — no @lovable.dev/vite-tanstack-config
// dependency. Targets a plain Node server (nitro "node-server" preset) so
// `bun run build` produces something deployable anywhere, not just Cloudflare.
export default defineConfig({
  server: { port: 8080 },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    nitro({ preset: "node-server" }),
    viteReact(),
  ],
});

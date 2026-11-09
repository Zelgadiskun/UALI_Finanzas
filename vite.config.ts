import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

function locationRadarApiPlugin(): Plugin {
  return {
    name: "location-radar-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/location-radar")) {
          return next();
        }

        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const data = JSON.parse(body || "{}");
              const { latitude = 8.9824, longitude = -79.5199, simulatePlace } = data;
              const { detectNearbyPlaceWithMaps } = await import("./src/server/locationRadar.ts");
              const result = await detectNearbyPlaceWithMaps(
                Number(latitude),
                Number(longitude),
                simulatePlace,
              );
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({ error: (err as Error)?.message || "Internal server error" }),
              );
            }
          });
        } else if (req.method === "GET") {
          try {
            const url = new URL(req.url || "", "http://localhost");
            const latitude = Number(url.searchParams.get("lat") || "8.9824");
            const longitude = Number(url.searchParams.get("lng") || "-79.5199");
            const simulatePlace = url.searchParams.get("simulate") || undefined;
            const { detectNearbyPlaceWithMaps } = await import("./src/server/locationRadar.ts");
            const result = await detectNearbyPlaceWithMaps(latitude, longitude, simulatePlace);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: (err as Error)?.message || "Internal server error" }));
          }
        } else {
          res.statusCode = 405;
          res.end("Method Not Allowed");
        }
      });
    },
  };
}

function expressApiPlugin(): Plugin {
  return {
    name: "express-api-plugin",
    async configureServer(server) {
      const { expressApp } = await import("./src/server/app.ts");
      server.middlewares.use(expressApp);
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    warmup: {
      clientFiles: ["./src/routes/__root.tsx", "./src/routes/index.tsx", "./src/styles.css"],
    },
    watch: {
      ignored: ["**/.output/**", "**/dist/**", "**/.git/**"],
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@tanstack/react-router",
      "@tanstack/react-start",
      "@tanstack/react-query",
      "canvas-confetti",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "framer-motion",
      "sonner",
      "date-fns",
    ],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === "MODULE_LEVEL_DIRECTIVE" ||
          (typeof warning.message === "string" &&
            warning.message.includes('module level directive "use client"'))
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  plugins: [
    tailwindcss(),
    locationRadarApiPlugin(),
    expressApiPlugin(),
    tanstackStart({ spa: { enabled: true } }),
    nitro({
      preset: "node-server",
      rollupConfig: {
        onwarn(
          warning: { code?: string; message?: unknown },
          warn: (w: { code?: string; message?: unknown }) => void,
        ) {
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" ||
            (typeof warning.message === "string" &&
              warning.message.includes('module level directive "use client"'))
          ) {
            return;
          }
          warn(warning);
        },
      },
      rolldownConfig: {
        onwarn(
          warning: { code?: string; message?: unknown },
          warn: (w: { code?: string; message?: unknown }) => void,
        ) {
          if (
            warning.code === "MODULE_LEVEL_DIRECTIVE" ||
            (typeof warning.message === "string" &&
              warning.message.includes('module level directive "use client"'))
          ) {
            return;
          }
          warn(warning);
        },
      },
    }),
    viteReact(),
  ],
});

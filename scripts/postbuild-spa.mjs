// TanStack Start's SPA mode prerenders one app shell at .output/public/_shell.html
// (see vite.config.ts) — it has no server-fetched content, just the HTML shell
// and script tags the client router hydrates into whatever route it's loaded
// at. Static hosts expect that at index.html, not _shell.html, so copy it
// there. public/_redirects (copied verbatim into .output/public by Vite)
// handles the other half: rewriting every path to index.html so a deep link
// like /deudas doesn't 404 against a host that only knows static files.
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const publicDir = resolve(import.meta.dirname, "..", ".output", "public");
copyFileSync(resolve(publicDir, "_shell.html"), resolve(publicDir, "index.html"));

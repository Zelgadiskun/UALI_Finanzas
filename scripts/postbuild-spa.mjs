// TanStack Start's SPA mode prerenders one app shell at .output/public/_shell.html
// (see vite.config.ts) — it has no server-fetched content, just the HTML shell
// and script tags the client router hydrates into whatever route it's loaded
// at. Static hosts expect that at index.html, not _shell.html, so copy it
// there. public/_redirects (copied verbatim into .output/public by Vite)
// handles the other half: rewriting every path to index.html so a deep link
// like /deudas doesn't 404 against a host that only knows static files.
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir =
  typeof import.meta.dirname === "string"
    ? import.meta.dirname
    : dirname(fileURLToPath(import.meta.url));

const publicDir = resolve(currentDir, "..", ".output", "public");
const shellFile = resolve(publicDir, "_shell.html");
const indexFile = resolve(publicDir, "index.html");

if (existsSync(shellFile)) {
  copyFileSync(shellFile, indexFile);
  console.log("✓ Copiado _shell.html -> index.html para hosting SPA en Vercel");
} else if (existsSync(indexFile)) {
  console.log("✓ index.html ya existe en .output/public");
} else {
  console.warn("⚠ Aviso: no se encontró _shell.html ni index.html en .output/public");
}

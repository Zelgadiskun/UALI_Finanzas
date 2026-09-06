/** Minimal, dependency-free fallback page for a request that fails before React can render. */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>FFOS Wallet</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #080b12; color: #f2f5fa; padding: 24px; }
      .box { max-width: 360px; text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 8px; }
      p { color: #9aa5ba; font-size: 0.9rem; margin: 0 0 20px; }
      a { display: inline-block; padding: 10px 20px; border-radius: 10px; background: #6366f1;
        color: white; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="box">
      <h1>Esta página no cargó</h1>
      <p>Algo falló del lado del servidor. Probá recargar o volver al inicio.</p>
      <a href="/">Ir al inicio</a>
    </div>
  </body>
</html>`;
}

# UALÍ Finanzas

Finanzas familiares compartidas con educación financiera gamificada, estilo Duolingo.

## Stack

- [TanStack Start](https://tanstack.com/start) en modo SPA (React 19) + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query) + TypeScript estricto
- [Supabase](https://supabase.com) (Postgres, Auth, RLS, funciones `security definer` en vez de Edge Functions) como único backend
- Tailwind v4 + [shadcn/ui](https://ui.shadcn.com) (estilo "new-york")
- [Bun](https://bun.sh) como runtime y gestor de paquetes
- [date-fns](https://date-fns.org) para fechas, [Recharts](https://recharts.org) para los gráficos de presupuesto y movimientos

## Desarrollo local

```sh
bun install
bun run dev      # http://localhost:8080
```

Necesita un `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto Supabase (ver `supabase/migrations/` para el esquema).

```sh
bun run build    # build estático en .output/public — ver "Despliegue"
bun run lint
```

## Tests

```sh
bun run test       # Vitest — funciones puras (format, gamification) y componentes de UI
bun run test:e2e   # Playwright — build real servido como estático, contra un Chromium real
```

`test:e2e` corre `bun run build` primero: valida el artefacto que de verdad se despliega (fallback de SPA vía `public/_redirects`, manifest, service worker), no el servidor de desarrollo.

## Despliegue

La app corre en modo SPA: no hay funciones de servidor ni rutas de API, todo habla directo con Supabase desde el cliente. `bun run build` prerenderiza un único shell HTML (`.output/public/index.html`) que el router hidrata y desde el que navega — el resultado es un sitio estático común y corriente, sin proceso Node que mantener en producción. Esto es a propósito: es el mismo artefacto que más adelante empaqueta Capacitor para las apps nativas.

Para publicarlo en un hosting estático gratuito (Cloudflare Pages, Netlify, etc.):

- Build command: `bun run build`
- Output directory: `.output/public`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `public/_redirects` ya deja resuelto el fallback de SPA (`/* /index.html 200`) para que un deep link como `/deudas` no dé 404 contra un host que solo sirve archivos estáticos — Cloudflare Pages y Netlify lo leen tal cual, sin configuración adicional.

`.output/server` también se genera en el build (por una limitación del preset `static` de Nitro con esta versión de `@tanstack/react-start`, ver el comentario en `vite.config.ts`) pero no se despliega ni se ejecuta — solo `.output/public` importa.

## Estado del proyecto

App familiar multiusuario con cuentas reales, sincronización y RLS en Supabase, presupuesto/deudas/metas con datos derivados (nunca duplicados) de los movimientos, y contenido de lecciones editable desde la base de datos. El detalle completo de fases está en el plan de construcción del proyecto (fuera de este repo).

## Estructura

```
src/
  components/ffos/   componentes específicos del producto (KpiCard, LevelBar, TransactionSheet...)
  components/ui/     shadcn/ui, no se edita a mano — se regenera con su CLI
  lib/ffos/          tipos, formato y motor de gamificación (niveles, logros)
  lib/supabase/      cliente, auth, queries y mutations — único acceso a datos, todo vía Supabase
  routes/            una ruta por archivo (TanStack Router file-based)
```

## Origen

Este proyecto se exportó originalmente desde [Lovable](https://lovable.dev); desde el commit inicial de este repositorio ya no depende de su infraestructura ni de su configuración de build.

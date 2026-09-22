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

`.output/server` también se genera en el build (por una limitación del preset `static` de Nitro con esta versión de `@tanstack/react-start`, ver el comentario en `vite.config.ts`) pero **no se despliega ni se ejecuta** — solo `.output/public` importa.

### Vercel (producción actual)

El deployment vive en `https://<proyecto>.vercel.app`. Configuración:

| Ajuste | Valor |
| --- | --- |
| Framework Preset | **Other** (no Vite, no TanStack) |
| Build command | `bun run build` |
| Output directory | `.output/public` |
| Install command | `bun install` |

**El archivo `vercel.json` en la raíz es obligatorio.** Leave it at the project root with that exact name — Vercel lo busca literal y lo ignora si el nombre cambia (por ejemplo al subirlo desde la web de GitHub con otro nombre). Declara `framework: null` para que la detección automática no envuelva el output en un handler de servidor, `outputDirectory` para que no asuma `dist`, y el rewrite `/* → /index.html` para que un deep link como `/deudas` no dé 404:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "outputDirectory": ".output/public",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Vercel no lee `public/_redirects`.** Ese archivo solo aplica a Cloudflare Pages y Netlify; en Vercel el fallback de SPA lo resuelve el bloque `rewrites` de arriba, y ninguno de los dos interfiere con el otro.

#### Variables de entorno en Vercel

En **Settings → Environment Variables**, para Production (y Preview):

- `VITE_SUPABASE_URL` — la URL del proyecto de Supabase
- `VITE_SUPABASE_ANON_KEY` — la `anon` / publishable key

Estas variables se **incrustan en el bundle en tiempo de build**, no se leen en runtime. Si las agregás o cambiás después de un deploy, hay que volver a desplegar para que surtan efecto: un cambio de env vars no re-dispara el build por sí solo.

Si faltan, el síntoma no es un 404 sino **pantalla en blanco**: `src/lib/supabase/client.ts` lanza un error al cargar el módulo (`Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY`), visible en la consola del navegador. Se ve el HTML y nada hidrata.

#### Comprobar un deploy

```sh
vercel ls                      # deployments y sus URLs
curl -sI https://<proyecto>.vercel.app/deudas | head -1   # debe dar 200, no 404
```

Si `/` funciona pero `/deudas` da 404, el rewrite no está aplicando: revisar nombre y ubicación de `vercel.json`. Si todo da 404, el Output directory apunta a otro lado.

### Cloudflare Pages / Netlify

- Build command: `bun run build`
- Output directory: `.output/public`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `public/_redirects` ya deja resuelto el fallback de SPA (`/* /index.html 200`) — ambos hosts lo leen tal cual, sin configuración adicional. En estos hosts `vercel.json` se ignora, así que convive sin conflicto.

### Supabase: allowed redirect URLs

Los correos de recuperación de contraseña de `resetPasswordForEmail()` (ver `src/lib/supabase/auth.ts`) redirigen a `${window.location.origin}/reset-password`. Cada dominio donde corra la app tiene que estar en **Supabase → Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:8080/**` (desarrollo local — el puerto está fijado en `vite.config.ts`)
- `https://<proyecto>.vercel.app/**`

Un cambio o borrado del proyecto en Vercel genera una URL `*.vercel.app` nueva, y hay que registrarla de nuevo ahí.

## Estado del proyecto

App familiar multiusuario con cuentas reales, sincronización y RLS en Supabase, presupuesto/deudas/metas con datos derivados (nunca duplicados) de los movimientos, y contenido de lecciones editable desde la base de datos. El detalle completo de fases está en el plan de construcción del proyecto (fuera de este repo).

### Pendiente conocido

- **El flujo "Olvidé mi contraseña" está roto a medias.** `resetPasswordForEmail()` redirige a `/reset-password`, pero esa ruta no existe en `src/routes/`, y `updatePassword()` (que ya está escrito en `auth.ts`) no lo llama ningún componente: no hay pantalla donde se escreva la contraseña nueva. Además, la confirmación de email y el reset solo aterrizan en el dominio correcto si el dominio está declarado en **Supabase → Authentication → URL Configuration** (`Site URL` y `Redirect URLs`). Con `Site URL` apuntando a `localhost:8080`, el link del correo de confirmación abre en localhost y la cuenta nunca se confirma, lo que se manifiesta como "no me deja iniciar sesión" con credenciales correctas.

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

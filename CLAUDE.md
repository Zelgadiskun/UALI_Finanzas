# FFOS Wallet

Finanzas familiares compartidas + educación financiera gamificada. Ver [README.md](README.md) para stack y comandos.

## Convenciones

- Todo en minúsculas: `src/`, `src/components/`, `src/hooks/`. El repo tuvo `SRC/`/`Components/` en mayúsculas heredado de una exportación de Lovable — se corrigió porque Windows resuelve rutas sin distinguir mayúsculas y escondía el problema, pero rompía en cualquier build Linux. Este repo tiene `core.ignorecase=false` (a propósito, solo en este repo) para que un desajuste de mayúsculas se note enseguida en `git status` en vez de quedar invisible.
- `src/components/ui/` es shadcn/ui — no se edita a mano, se regenera con su CLI (`components.json` tiene la config).
- `src/components/ffos/` es específico del producto.
- Estado global en `src/lib/ffos/store.ts`: un store manual con `useSyncExternalStore`, sin Zustand/Redux. `useFfos()` da el estado, `useIsHydrated()` evita el desajuste de SSR vs `localStorage` (todas las pantallas muestran un esqueleto hasta que `hydrate()` corre en el cliente).
- Los montos son `number` en la unidad monetaria completa (no centavos) mientras el estado vive en el cliente — eso cambia al pasar a Supabase (Fase 2 del plan), donde se migra a centavos enteros en la base.
- `money(value, compactAbove?)` en `src/lib/ffos/format.ts` — el segundo argumento activa notación compacta ("$12,3 k") en tarjetas angostas. No inventar deltas/porcentajes sin dato real detrás: `percentChange()` devuelve `undefined` cuando no hay base de comparación, y los componentes ya saben ocultar esa fila.
- El contenido de gamificación (niveles, lecciones, logros) vive hardcodeado en `src/lib/ffos/gamification.ts`. Se migra a tablas de Supabase en una fase posterior para que agregar contenido no requiera deploy.

## Historia relevante

Este proyecto se exportó de Lovable con `src/lib/` completo faltante (el store, los tipos, el formato, la gamificación — todo). Se reconstruyó leyendo el contrato exacto de cada componente. Al mismo tiempo se retiró la dependencia de `@lovable.dev/vite-tanstack-config`; `vite.config.ts` usa piezas estándar (TanStack Start + Tailwind v4 + Nitro con preset `node-server`).

Existe un prototipo anterior del mismo producto en JavaScript plano con Firebase (`ffos-wallet/`, repo aparte) — tiene lógica de familia e invitaciones ya escrita (aunque rota) que sirve de referencia conceptual, pero no es la base de este proyecto.

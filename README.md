# FFOS Wallet

Finanzas familiares compartidas con educación financiera gamificada, estilo Duolingo.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, SSR) + TypeScript estricto
- Tailwind v4 + [shadcn/ui](https://ui.shadcn.com) (estilo "new-york")
- [Bun](https://bun.sh) como runtime y gestor de paquetes
- [date-fns](https://date-fns.org) para fechas, [Recharts](https://recharts.org) para gráficos (aún sin usar)

## Desarrollo local

```sh
bun install
bun run dev      # http://localhost:8080
```

```sh
bun run build    # cliente + SSR + servidor Node vía Nitro
bun run lint
```

## Estado del proyecto

App funcional de un solo usuario y un solo dispositivo (estado en `localStorage`). Sin backend todavía — la fase en curso conecta [Supabase](https://supabase.com) para cuentas, sincronización familiar y persistencia real. El detalle completo de fases está en el plan de construcción del proyecto (fuera de este repo).

## Estructura

```
src/
  components/ffos/   componentes específicos del producto (KpiCard, LevelBar, TransactionSheet...)
  components/ui/     shadcn/ui, no se edita a mano — se regenera con su CLI
  lib/ffos/          store, tipos, formato y motor de gamificación
  routes/            una ruta por archivo (TanStack Router file-based)
```

## Origen

Este proyecto se exportó originalmente desde [Lovable](https://lovable.dev); desde el commit inicial de este repositorio ya no depende de su infraestructura ni de su configuración de build.

/**
 * UALÍ Finanzas - Arquitectura Canónica de Rutas y Conexiones Principales
 *
 * Conecta los tres pilares esenciales de la experiencia:
 * 1. Inicio (/): Tablero de respiración, regla de 3 elementos y control de cortisol.
 * 2. Presupuesto (/presupuesto): Asignación de canasta, 50/30/20 y límites saludables.
 * 3. Aprender (/aprender): Motor de simulación de vida financiera, árbol de habilidades y misiones.
 */

export const APP_ROUTES = {
  INICIO: "/",
  PRESUPUESTO: "/presupuesto",
  APRENDER: "/aprender",
  AHORRO: "/ahorro",
  DEUDAS: "/deudas",
  MOVIMIENTOS: "/movimientos",
  MAS: "/mas",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
export type AppRoutePath = (typeof APP_ROUTES)[AppRouteKey];

export interface RouteMetadata {
  id: AppRouteKey;
  path: AppRoutePath;
  title: string;
  shortTitle: string;
  description: string;
  guardian: "nido" | "chispa" | "toto" | "alianza";
  accentColor: string;
  badgeText?: string;
}

/**
 * Registro de los tres pilares base de UALÍ
 */
export const CORE_PILLARS: Record<"INICIO" | "PRESUPUESTO" | "APRENDER", RouteMetadata> = {
  INICIO: {
    id: "INICIO",
    path: APP_ROUTES.INICIO,
    title: "Panel Principal",
    shortTitle: "Inicio",
    description: "Visión general en calma: balance sanitizado, salud de Nido y nivel actual.",
    guardian: "nido",
    accentColor: "#2EC4B6",
    badgeText: "3 Elementos",
  },
  PRESUPUESTO: {
    id: "PRESUPUESTO",
    path: APP_ROUTES.PRESUPUESTO,
    title: "Presupuesto Consciente",
    shortTitle: "Presupuesto",
    description:
      "Distribución de canastas (50/30/20), metas mensuales y balance de flujo sin fricción.",
    guardian: "toto",
    accentColor: "#F59E0B",
    badgeText: "Canastas",
  },
  APRENDER: {
    id: "APRENDER",
    path: APP_ROUTES.APRENDER,
    title: "Simulación & Aprendizaje",
    shortTitle: "Aprender",
    description:
      "Simulador de vida financiera por roles, toma de decisiones rápidas y árbol de resiliencia.",
    guardian: "chispa",
    accentColor: "#A855F7",
    badgeText: "Simulador de Vida",
  },
};

/**
 * Atajos de transición fluida entre pilares
 * Evita desorientación mental en el usuario Eduardo permitiendo saltar con 1 toque.
 */
export function getPillarNavigationBridge(currentPath: string) {
  const isInicio = currentPath === "/" || currentPath === "/inicio";
  const isPresupuesto = currentPath.startsWith("/presupuesto");
  const isAprender = currentPath.startsWith("/aprender");

  return {
    isInicio,
    isPresupuesto,
    isAprender,
    nextPillars: [
      {
        to: APP_ROUTES.INICIO,
        label: "Inicio",
        active: isInicio,
        hint: "Panel en calma",
      },
      {
        to: APP_ROUTES.PRESUPUESTO,
        label: "Presupuesto",
        active: isPresupuesto,
        hint: "Canastas y límites",
      },
      {
        to: APP_ROUTES.APRENDER,
        label: "Aprender",
        active: isAprender,
        hint: "Simulador de roles",
      },
    ],
  };
}

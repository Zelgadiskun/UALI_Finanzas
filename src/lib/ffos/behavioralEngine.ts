/**
 * UALÍ Finanzas - Motor de Gamificación y Bienestar Conductual
 * Versión de Arquitectura: 2.0.0
 *
 * Fuente única de verdad estructural para telemetría, mapeo real-a-virtual,
 * mitigación de cortisol y los 6 pilares de dopamina conductual.
 */

export const UALI_CONFIG_V2 = {
  project_name: "UALÍ Finanzas - Motor de Gamificación y Bienestar Conductual",
  architecture_version: "2.0.0",
  target_routes: ["src/routes/aprender.tsx", "src/routes/inicio.tsx", "src/routes/presupuesto.tsx"],
  system_telemetry: {
    sync_mode: "Offline-First / Híbrido",
    real_to_virtual_mapping: {
      real_savings_deposit: "recargar_escudo_nido_hp",
      real_unbudgeted_expense: "generar_fisura_fortaleza_estres",
      real_shared_expense: "incrementar_voltaje_bateria_clan",
    },
  },
  global_reset_protocol: {
    scope: "Universal (Aplica a cualquier usuario nuevo o existente mediante sesión activa)",
    trigger_actions: {
      on_reset_click: [
        "Limpiar de forma atómica las tablas en Supabase vinculadas al $USER_ID activo.",
        "Purgar claves locales en localStorage bajo el esquema local-first del store.",
        "Desmontar modales del DOM y re-compilar la vista en estado inicial plano.",
      ],
    },
    database_state_payload: {
      profiles_and_user_progress: {
        xp: 0,
        level: 1,
        ffos_tokens: 0,
        streak_days: 0,
        last_active: "CURRENT_TIMESTAMP",
        ritual_fase1_visto: false,
        ritual_fase2_visto: false,
        estres_financiero_index: 0,
      },
      progreso_misiones: {
        mision_01: { estado: "DISPONIBLE", estrellas: 0, submodulos_completados: 0 },
        misiones_02_to_12: { estado: "BLOQUEADO", estrellas: 0, submodulos_completados: 0 },
      },
    },
  },
  behavioral_health_and_dopamine_engine: {
    psychological_pillars: [
      {
        pilar: "1. Retroalimentación Inmediata",
        frontend_implementation:
          "Invocación de useSound() para tintineos sónicos en depósito y micro-animaciones de canvas-confetti en cuestionarios.",
        backend_latency_requirement_ms: 100,
      },
      {
        pilar: "2. Progresión y Niveles",
        frontend_implementation:
          "Barra de progreso con transiciones fluidas de Tailwind (transition-all duration-500).",
        mathematical_formula: "level = Math.floor(xp / 250) + 1",
      },
      {
        pilar: "3. Narrativa y Avatares",
        guardians_identities: {
          nido: { avatar: "Cerdito de Titanio", focus: "Ahorro básico, reserva y resguardo" },
          chispa: { avatar: "Triángulo Compás", focus: "Crédito, paridad e ingresos de equipo" },
          toto: { avatar: "Moneda Holográfica", focus: "Inversión, avalancha e interés compuesto" },
        },
      },
      {
        pilar: "4. Recompensas Variables",
        components: ["Desafío Flash Diario de Toto", "Cofres sorpresa en bazar FFOS"],
        server_cronjob_refresh_utc: "00:00",
      },
      {
        pilar: "5. Competencia Social",
        features: ["La Liga de Tiburones (Ranking de Solvencia)", "Batería de aportes compartidos"],
        data_relations: "Agrupación asociativa de múltiples $USER_ID bajo un mismo $TEAM_ID",
      },
      {
        pilar: "6. El Error como Aprendizaje",
        ui_rules:
          "Prohibido el uso de textos punitivos. El fallo disminuye salud virtual pero permite reintentos ilimitados.",
      },
    ],
    cortisol_reduction_protocols: {
      diagnostics: {
        data_dumping: "Causa fatiga cognitiva por sobreexposición numérica simultánea.",
        code_leaks:
          "Textos rotos tipo NaN% en presupuestos vacíos incrementan la desconfianza del usuario.",
      },
      ui_treatments: {
        progressive_disclosure:
          "Implementación mandatoria de acordeones para ocultar categorías no consultadas activamente.",
        zero_bug_fallback:
          "Si el monto planeado o límite es igual a $0.00, interceptar la ecuación y renderizar la cadena fija '0% utilizado de tu cupo'.",
        permanent_shields:
          "Los depósitos en la alcancía real incrementan visiblemente los puntos de vida (HP) de la armadura de Nido.",
      },
    },
  },
} as const;

// Identidades Oficiales de los Guardianes
export const GUARDIAN_IDENTITIES = {
  nido: {
    key: "nido" as const,
    name: "Nido",
    avatar: "Cerdito de Titanio",
    focus: "Ahorro básico, reserva y resguardo",
    emoji: "🐷🛡️",
    baseColor: "#2EC4B6",
    badgeLabel: "Fondo & Blindaje",
  },
  chispa: {
    key: "chispa" as const,
    name: "Chispa",
    avatar: "Triángulo Compás",
    focus: "Crédito, paridad e ingresos de equipo",
    emoji: "📐⚡",
    baseColor: "#A855F7",
    badgeLabel: "Equipo & Crédito",
  },
  toto: {
    key: "toto" as const,
    name: "Toto",
    avatar: "Moneda Holográfica",
    focus: "Inversión, avalancha e interés compuesto",
    emoji: "🪙✨",
    baseColor: "#E71D36",
    badgeLabel: "Inversión & Liga",
  },
} as const;

/**
 * Pilar 2: Fórmula Matemática Universal de Nivel
 * level = Math.floor(xp / 250) + 1
 */
export function calculateLevel(xp: number): number {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return Math.floor(safeXp / 250) + 1;
}

export interface LevelProgressCalculation {
  level: number;
  xpTotal: number;
  xpFloor: number;
  xpCap: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  pct: number;
  xpToNext: number;
  title: string;
}

export function calculateLevelProgress(xp: number): LevelProgressCalculation {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  const level = calculateLevel(safeXp);
  const xpFloor = (level - 1) * 250;
  const xpCap = level * 250;
  const xpIntoLevel = safeXp - xpFloor;
  const xpNeededForLevel = 250;
  const pct = Math.min(100, Math.max(0, Math.round((xpIntoLevel / xpNeededForLevel) * 100)));
  const xpToNext = Math.max(0, xpCap - safeXp);

  const titles = [
    "Aprendiz de Titanio",
    "Organizador de Flujo",
    "Estratega del Compás",
    "Planificador 50/30/20",
    "Maestro del Blindaje",
    "Gran Guardián",
    "Soberano de la Bóveda",
    "Tiburón Maestro",
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)] ?? `Nivel ${level}`;

  return {
    level,
    xpTotal: safeXp,
    xpFloor,
    xpCap,
    xpIntoLevel,
    xpNeededForLevel,
    pct,
    xpToNext,
    title,
  };
}

/**
 * Protocolo de Reducción de Cortisol - Zero-Bug Fallback
 * Si el monto planeado o límite es igual a $0.00 (o inválido), interceptar la ecuación
 * y renderizar la cadena fija "0% utilizado de tu cupo" o su variante compacta.
 */
export function formatSafeBudgetPercent(
  spent: number,
  planned: number,
  mode: "full" | "badge" | "number" = "full",
): string {
  const s = Number.isFinite(spent) ? Math.max(0, spent) : 0;
  const p = Number.isFinite(planned) ? Math.max(0, planned) : 0;

  if (p <= 0) {
    if (mode === "number") return "0";
    if (mode === "badge") return "0% cupo";
    return "0% utilizado de tu cupo";
  }

  const pct = Math.round((s / p) * 100);

  if (mode === "number") return `${pct}`;
  if (mode === "badge") return `${pct}% usado`;
  return `${pct}% utilizado de tu cupo`;
}

/**
 * Mapeo Real a Virtual:
 * - real_savings_deposit: recargar_escudo_nido_hp
 * - real_unbudgeted_expense: generar_fisura_fortaleza_estres
 * - real_shared_expense: incrementar_voltaje_bateria_clan
 */
export interface VirtualTelemetryState {
  escudoNidoHp: number; // 0 to 120 HP (100 base max, 120 con bono de ahorro real)
  escudoMaxHp: number;
  fisurasEstres: number; // 0 to 5 fisuras
  indiceEstres: number; // 0 (paz mental) to 100
  bateriaClanVoltaje: number; // 0% to 100%
  clanMembersCount: number;
  sharkLeagueTier: "Bronce" | "Plata" | "Oro" | "Diamante";
  sharkLeagueRank: number;
  solvenciaScore: number;
}

export function computeVirtualTelemetry(params: {
  savingsThisMonth: number;
  totalSpentThisMonth: number;
  totalPlannedThisMonth: number;
  sharedExpensesCount: number;
  sharedExpensesTotal: number;
  overdrawnCategoriesCount: number;
}): VirtualTelemetryState {
  const {
    savingsThisMonth = 0,
    totalSpentThisMonth = 0,
    totalPlannedThisMonth = 0,
    sharedExpensesCount = 0,
    sharedExpensesTotal = 0,
    overdrawnCategoriesCount = 0,
  } = params;

  // 1. Escudo Nido HP: Los depósitos reales en alcancía incrementan los puntos de vida
  // Base 60 HP + 10 HP por cada $50 ahorrados este mes (máx 120 HP de titanio)
  const savingsBoost = Math.floor(Math.max(0, savingsThisMonth) / 50) * 10;
  const escudoNidoHp = Math.min(120, Math.max(20, 60 + savingsBoost));

  // 2. Fisuras en la fortaleza por gastos imprevistos / sobregiros
  const fisurasEstres = Math.min(5, Math.max(0, overdrawnCategoriesCount));

  // Índice de estrés conductual: 0 (excelente) a 100
  let indiceEstres = fisurasEstres * 20;
  if (totalPlannedThisMonth > 0 && totalSpentThisMonth > totalPlannedThisMonth) {
    indiceEstres = Math.min(100, indiceEstres + 25);
  }

  // 3. Batería de aportes compartidos del Clan:
  // Se carga con gastos compartidos y registros de equipo (10% por gasto compartido + factor de volumen)
  const baseBattery = Math.min(
    100,
    sharedExpensesCount * 15 + Math.min(50, Math.floor(sharedExpensesTotal / 20)),
  );
  const bateriaClanVoltaje = Math.min(100, Math.max(15, baseBattery));

  // 4. Liga de Tiburones (Ranking de Solvencia)
  const ratioAhorro = totalSpentThisMonth > 0 ? (savingsThisMonth / totalSpentThisMonth) * 100 : 25;
  let sharkLeagueTier: "Bronce" | "Plata" | "Oro" | "Diamante" = "Plata";
  let solvenciaScore = 750;

  if (ratioAhorro >= 30 && fisurasEstres === 0) {
    sharkLeagueTier = "Diamante";
    solvenciaScore = 920;
  } else if (ratioAhorro >= 20) {
    sharkLeagueTier = "Oro";
    solvenciaScore = 840;
  } else if (fisurasEstres > 2) {
    sharkLeagueTier = "Bronce";
    solvenciaScore = 630;
  }

  return {
    escudoNidoHp,
    escudoMaxHp: 120,
    fisurasEstres,
    indiceEstres,
    bateriaClanVoltaje,
    clanMembersCount: 2,
    sharkLeagueTier,
    sharkLeagueRank: 4,
    solvenciaScore,
  };
}

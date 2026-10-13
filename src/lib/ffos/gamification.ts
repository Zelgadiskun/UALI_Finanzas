export type Level = { level: number; name: string; xpRequired: number };

export const LEVELS: Level[] = [
  { level: 1, name: "Aprendiz", xpRequired: 0 },
  { level: 2, name: "Organizador", xpRequired: 250 },
  { level: 3, name: "Estratega", xpRequired: 500 },
  { level: 4, name: "Planificador", xpRequired: 750 },
  { level: 5, name: "Maestro", xpRequired: 1000 },
  { level: 6, name: "Gran Maestro", xpRequired: 1250 },
  { level: 7, name: "Soberano", xpRequired: 1500 },
];

export type LevelInfo = {
  level: number;
  name: string;
  next: Level | null;
  /** 0-100, progress within the current level */
  pct: number;
  xpIntoLevel: number;
  xpForLevel: number;
  xpToNext: number;
  /** Denominador acumulado indexado del nivel (Nivel 1 = 250, Nivel 2 = 500, etc.) */
  levelCap: number;
};

export function levelInfo(xp: number): LevelInfo {
  let current: Level = LEVELS[0]!;
  let next: Level | null = null;

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i]!;
    if (xp >= level.xpRequired) {
      current = level;
      next = LEVELS[i + 1] ?? null;
    }
  }

  const xpForLevel = next ? next.xpRequired - current.xpRequired : 250;
  const xpIntoLevel = next ? xp - current.xpRequired : 250;
  const pct = next ? Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100)) : 100;
  const xpToNext = next ? next.xpRequired - xp : 0;
  const levelCap = current.level * 250;

  return {
    level: current.level,
    name: current.name,
    next,
    pct,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    levelCap,
  };
}

export type Achievement = { id: string; name: string; description: string };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_tx", name: "Primer registro", description: "Registraste tu primer movimiento." },
  {
    id: "week_streak",
    name: "Racha semanal",
    description: "Registraste movimientos 7 días seguidos.",
  },
  { id: "first_lesson", name: "Primera lección", description: "Completaste tu primera lección." },
  { id: "saver", name: "Ahorrista", description: "Registraste tu primer ahorro." },
  { id: "debt_slayer", name: "Cazadeudas", description: "Registraste tu primer pago de deuda." },
];

/**
 * Criterios Mandatorios de Equilibrio Económico (Game Balancing Spec)
 */
export const GAMIFICATION_BALANCING = {
  VICTORIA_LIMPIA: {
    XP_MIN: 25,
    XP_MAX: 35,
    XP_DEFAULT: 30,
    FFOS_MAX: 50,
  },
  APRENDIZAJE_POR_ERROR: {
    XP_PERCENT: 0.3,
    XP_CONSOLATION: 10,
    FFOS_CONSOLATION: 15,
  },
  POWERUPS: {
    INDIVIDUAL_MIN_FFOS: 40,
    TEAM_MAX_FFOS: 600,
  },
} as const;

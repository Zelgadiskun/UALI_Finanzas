export type Level = { level: number; name: string; xpRequired: number };

export const LEVELS: Level[] = [
  { level: 1, name: "Aprendiz", xpRequired: 0 },
  { level: 2, name: "Organizador", xpRequired: 150 },
  { level: 3, name: "Estratega", xpRequired: 350 },
  { level: 4, name: "Planificador", xpRequired: 600 },
  { level: 5, name: "Maestro", xpRequired: 900 },
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

  const xpForLevel = next ? next.xpRequired - current.xpRequired : 0;
  const xpIntoLevel = next ? xp - current.xpRequired : 0;
  const pct = next ? Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100)) : 100;
  const xpToNext = next ? next.xpRequired - xp : 0;

  return { level: current.level, name: current.name, next, pct, xpIntoLevel, xpForLevel, xpToNext };
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

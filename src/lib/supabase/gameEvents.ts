export type GameEvent = { xp: number; levelUp: boolean; newAchievements: string[] };

const listeners = new Set<(e: GameEvent) => void>();

/** Celebration.tsx se suscribe acá para el confetti de nivel/logro. */
export function onGameEvent(fn: (e: GameEvent) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitGameEvent(e: GameEvent) {
  for (const fn of listeners) fn(e);
}

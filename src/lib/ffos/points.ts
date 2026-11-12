import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import {
  useCurrentUserId,
  useProgressQuery,
  queryKeys,
  type ProfileRow,
} from "@/lib/supabase/queries";
import { emitGameEvent } from "@/lib/supabase/gameEvents";
import { levelInfo, type LevelInfo } from "@/lib/ffos/gamification";

const EXTRA_TOKENS_STORAGE_KEY = "uali_extra_tokens_v2";
const LOCAL_XP_STORAGE_KEY = "uali_local_xp_v2";
const LOCAL_STREAK_STORAGE_KEY = "uali_local_streak_v2";
const POINTS_HISTORY_STORAGE_KEY = "uali_points_history_v2";

export interface PointEvent {
  id: string;
  tokens: number;
  xp: number;
  reason: string;
  timestamp: string;
}

/**
 * Obtiene el XP acumulado localmente para el usuario (respaldo resiliente ante restricciones de DB).
 */
export function getLocalXp(userId?: string | null): number {
  if (typeof window === "undefined" || !userId) return 0;
  try {
    const raw = localStorage.getItem(`${LOCAL_XP_STORAGE_KEY}_${userId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Suma XP localmente y dispara sincronización.
 */
export function addLocalXp(userId: string, amount: number): number {
  if (typeof window === "undefined" || !userId || amount <= 0) return 0;
  try {
    const current = getLocalXp(userId);
    const updated = current + amount;
    localStorage.setItem(`${LOCAL_XP_STORAGE_KEY}_${userId}`, updated.toString());
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("uali-xp-updated", { detail: { userId, xp: updated } }));
    }, 0);
    return updated;
  } catch {
    return 0;
  }
}

const BEST_STREAK_STORAGE_KEY = "uali_best_streak_v2";
const LAST_STREAK_DATE_KEY = "uali_last_streak_date_v2";

/**
 * Obtiene la racha guardada localmente para el usuario.
 */
export function getLocalStreak(userId?: string | null): number {
  if (typeof window === "undefined" || !userId) return 1;
  try {
    const raw = localStorage.getItem(`${LOCAL_STREAK_STORAGE_KEY}_${userId}`);
    return raw ? Math.max(1, parseInt(raw, 10) || 1) : 1;
  } catch {
    return 1;
  }
}

/**
 * Obtiene la mejor racha histórica del usuario.
 */
export function getBestStreak(userId?: string | null): number {
  if (typeof window === "undefined" || !userId) return 1;
  try {
    const raw = localStorage.getItem(`${BEST_STREAK_STORAGE_KEY}_${userId}`);
    const localBest = raw ? parseInt(raw, 10) || 1 : 1;
    const current = getLocalStreak(userId);
    return Math.max(localBest, current);
  } catch {
    return 1;
  }
}

/**
 * Obtiene la fecha del último registro de racha del usuario (formato YYYY-MM-DD).
 */
export function getLastStreakDate(userId?: string | null): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    return localStorage.getItem(`${LAST_STREAK_DATE_KEY}_${userId}`);
  } catch {
    return null;
  }
}

/**
 * Actualiza la racha guardada localmente y despacha el evento uali-streak-updated.
 */
export function setLocalStreak(userId: string, streak: number, dateStr?: string): number {
  if (typeof window === "undefined" || !userId) return 1;
  try {
    const val = Math.max(1, streak);
    localStorage.setItem(`${LOCAL_STREAK_STORAGE_KEY}_${userId}`, val.toString());

    const prevBest = getBestStreak(userId);
    const newBest = Math.max(prevBest, val);
    localStorage.setItem(`${BEST_STREAK_STORAGE_KEY}_${userId}`, newBest.toString());

    const effectiveDate = dateStr || new Date().toISOString().slice(0, 10);
    localStorage.setItem(`${LAST_STREAK_DATE_KEY}_${userId}`, effectiveDate);

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("uali-streak-updated", {
          detail: {
            userId,
            streak: val,
            bestStreak: newBest,
            date: effectiveDate,
            isNewTransaction: true,
          },
        }),
      );
    }, 0);
    return val;
  } catch {
    return 1;
  }
}

/**
 * Obtiene los tokens FFOS adicionales guardados localmente para el usuario.
 */
export function getExtraTokens(userId?: string | null): number {
  if (typeof window === "undefined" || !userId) return 0;
  try {
    const raw = localStorage.getItem(`${EXTRA_TOKENS_STORAGE_KEY}_${userId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Suma tokens FFOS adicionales al usuario y dispara evento de sincronización.
 */
export function addExtraTokens(userId: string, amount: number): number {
  if (typeof window === "undefined" || !userId || amount === 0) return 0;
  try {
    const current = getExtraTokens(userId);
    const updated = current + amount;
    localStorage.setItem(`${EXTRA_TOKENS_STORAGE_KEY}_${userId}`, updated.toString());
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("uali-tokens-updated", { detail: { userId, tokens: updated } }),
      );
    }, 0);
    return updated;
  } catch {
    return 0;
  }
}

/**
 * Gasta tokens FFOS del usuario si dispone de saldo suficiente.
 */
export function spendExtraTokens(
  userId: string,
  amount: number,
  reason = "Gasto en UALÍ",
): boolean {
  if (typeof window === "undefined" || !userId || amount <= 0) return false;
  try {
    const current = getExtraTokens(userId);
    const updated = current - amount;
    localStorage.setItem(`${EXTRA_TOKENS_STORAGE_KEY}_${userId}`, updated.toString());
    recordPointEvent(userId, {
      tokens: -amount,
      xp: 0,
      reason,
    });
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("uali-tokens-updated", { detail: { userId, tokens: updated } }),
      );
    }, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el historial reciente de puntos otorgados.
 */
export function getPointsHistory(userId?: string | null): PointEvent[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${POINTS_HISTORY_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Registra un evento en el historial de puntos.
 */
export function recordPointEvent(
  userId: string,
  event: Omit<PointEvent, "id" | "timestamp">,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const list = getPointsHistory(userId);
    const newEntry: PointEvent = {
      ...event,
      id: `pe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...list].slice(0, 30);
    localStorage.setItem(`${POINTS_HISTORY_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("uali-points-history-updated", { detail: { userId, history: updated } }),
      );
    }, 0);
  } catch {
    // ignorar error de almacenamiento
  }
}

/**
 * Calcula los Puntos FFOS totales basados en XP, Racha y tokens extra.
 */
export function calculateFfosTokens(xp: number, streak: number, extraTokens: number): number {
  const base = 50;
  const xpPart = Math.round((xp || 0) * 0.5);
  const streakPart = Math.max(1, streak || 1) * 5;
  return base + xpPart + streakPart + (extraTokens || 0);
}

/**
 * Hook reactivo para obtener y sumar Puntos FFOS en cualquier componente.
 */
export function useUserPoints(): {
  userId: string | null;
  xp: number;
  streak: number;
  bestStreak: number;
  levelData: LevelInfo;
  ffosTokens: number;
  pointsHistory: PointEvent[];
  awardPoints: (options: {
    xpToAdd?: number;
    tokensToAdd?: number;
    reason?: string;
    silent?: boolean;
  }) => Promise<{ newXp: number; newTokens: number }>;
  spendTokens: (amount: number, reason?: string) => boolean;
} {
  const userId = useCurrentUserId();
  const progressQuery = useProgressQuery();
  const queryClient = useQueryClient();

  const progress = progressQuery.data;
  const dbXp = progress?.xp ?? 0;
  const dbStreak = progress?.streak ?? 1;

  const [localXp, setLocalXp] = useState<number>(() => getLocalXp(userId));
  const [localStreak, setLocalStreakState] = useState<number>(() => getLocalStreak(userId));
  const [bestStreak, setBestStreakState] = useState<number>(() => getBestStreak(userId));
  const [extraTokens, setExtraTokens] = useState<number>(() => getExtraTokens(userId));
  const [pointsHistory, setPointsHistory] = useState<PointEvent[]>(() => getPointsHistory(userId));

  useEffect(() => {
    if (!userId) return;
    setLocalXp(getLocalXp(userId));
    setLocalStreakState(getLocalStreak(userId));
    setBestStreakState(getBestStreak(userId));
    setExtraTokens(getExtraTokens(userId));
    setPointsHistory(getPointsHistory(userId));

    const handleTokensUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; tokens: number }>;
      if (customEvent.detail?.userId === userId) {
        setExtraTokens(customEvent.detail.tokens);
      }
    };

    const handleXpUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; xp: number }>;
      if (customEvent.detail?.userId === userId) {
        setLocalXp(customEvent.detail.xp);
      }
    };

    const handleHistoryUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; history: PointEvent[] }>;
      if (customEvent.detail?.userId === userId) {
        setPointsHistory(customEvent.detail.history);
      }
    };

    const handleStreakUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        userId: string;
        streak: number;
        bestStreak?: number;
      }>;
      if (customEvent.detail?.userId === userId) {
        setLocalStreakState(customEvent.detail.streak);
        if (customEvent.detail.bestStreak) {
          setBestStreakState(customEvent.detail.bestStreak);
        }
      }
    };

    window.addEventListener("uali-tokens-updated", handleTokensUpdate);
    window.addEventListener("uali-xp-updated", handleXpUpdate);
    window.addEventListener("uali-points-history-updated", handleHistoryUpdate);
    window.addEventListener("uali-streak-updated", handleStreakUpdate);

    return () => {
      window.removeEventListener("uali-tokens-updated", handleTokensUpdate);
      window.removeEventListener("uali-xp-updated", handleXpUpdate);
      window.removeEventListener("uali-points-history-updated", handleHistoryUpdate);
      window.removeEventListener("uali-streak-updated", handleStreakUpdate);
    };
  }, [userId]);

  // El XP efectivo es el mayor entre la base de datos y el acumulado local resiliente
  const effectiveXp = Math.max(dbXp, localXp);
  const effectiveStreak = Math.max(dbStreak, localStreak);
  const effectiveBestStreak = Math.max(effectiveStreak, bestStreak);

  const totalTokens = calculateFfosTokens(effectiveXp, effectiveStreak, extraTokens);
  const levelData = levelInfo(effectiveXp);

  /**
   * Suma Puntos FFOS y XP directamente al usuario y sincroniza de forma inmediata y resiliente.
   */
  const awardPoints = useCallback(
    async ({
      xpToAdd = 0,
      tokensToAdd = 0,
      reason = "Recompensa UALÍ",
      silent = false,
    }: {
      xpToAdd?: number;
      tokensToAdd?: number;
      reason?: string;
      silent?: boolean;
    }) => {
      if (!userId) return { newXp: effectiveXp, newTokens: totalTokens };

      let nextTokens = extraTokens;
      let nextXp = effectiveXp;

      // 1. Sumar tokens extra locales
      if (tokensToAdd > 0) {
        nextTokens = addExtraTokens(userId, tokensToAdd);
      }

      // 2. Sumar XP local resiliente
      if (xpToAdd > 0) {
        nextXp = addLocalXp(userId, xpToAdd);
        setLocalXp(nextXp);

        // Actualización optimista de perfil TanStack
        const profileKey = queryKeys.profile(userId);
        const cached = queryClient.getQueryData<ProfileRow>(profileKey);
        if (cached) {
          queryClient.setQueryData<ProfileRow>(profileKey, {
            ...cached,
            xp: Math.max(cached.xp ?? 0, nextXp),
            last_active: new Date().toISOString(),
          });
        }

        // Emitir evento de animación de nivel
        emitGameEvent({
          xp: xpToAdd,
          levelUp: levelInfo(nextXp).level > levelInfo(effectiveXp).level,
          newAchievements: [],
        });

        // Intentar actualizar Supabase profiles si los permisos lo permiten
        try {
          await supabase
            .from("profiles")
            .update({
              xp: nextXp,
              last_active: new Date().toISOString(),
            })
            .eq("id", userId);
        } catch {
          // Ignorar silenciosamente si DB restringe la columna
        }
      }

      // 3. Registrar en historial de puntos para transparencia del usuario
      if (tokensToAdd > 0 || xpToAdd > 0) {
        recordPointEvent(userId, {
          tokens: tokensToAdd,
          xp: xpToAdd,
          reason,
        });

        // Feedback al usuario para que vea claramente que los puntos se suman
        if (!silent) {
          const parts: string[] = [];
          if (tokensToAdd > 0) parts.push(`+${tokensToAdd} FFOS`);
          if (xpToAdd > 0) parts.push(`+${xpToAdd} XP`);
          toast.success(`${parts.join(" · ")}`, {
            description: reason,
            duration: 2500,
          });
        }
      }

      const calculatedTotal = calculateFfosTokens(nextXp, effectiveStreak, nextTokens);
      return {
        newXp: nextXp,
        newTokens: calculatedTotal,
      };
    },
    [userId, effectiveXp, effectiveStreak, extraTokens, totalTokens, queryClient],
  );

  const spendTokens = useCallback(
    (amount: number, reason = "Gasto de tokens"): boolean => {
      if (!userId || amount <= 0) return false;
      if (totalTokens < amount) {
        toast.error("Saldo insuficiente de FFOS", {
          description: `Necesitas ${amount} FFOS, pero tienes ${totalTokens}.`,
        });
        return false;
      }
      return spendExtraTokens(userId, amount, reason);
    },
    [userId, totalTokens],
  );

  return {
    userId,
    xp: effectiveXp,
    streak: effectiveStreak,
    bestStreak: effectiveBestStreak,
    levelData,
    ffosTokens: totalTokens,
    pointsHistory,
    awardPoints,
    spendTokens,
  };
}

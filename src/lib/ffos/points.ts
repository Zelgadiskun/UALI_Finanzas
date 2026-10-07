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
    window.dispatchEvent(new CustomEvent("uali-xp-updated", { detail: { userId, xp: updated } }));
    return updated;
  } catch {
    return 0;
  }
}

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
 * Actualiza la racha guardada localmente.
 */
export function setLocalStreak(userId: string, streak: number): number {
  if (typeof window === "undefined" || !userId) return 1;
  try {
    const val = Math.max(1, streak);
    localStorage.setItem(`${LOCAL_STREAK_STORAGE_KEY}_${userId}`, val.toString());
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
  if (typeof window === "undefined" || !userId || amount <= 0) return 0;
  try {
    const current = getExtraTokens(userId);
    const updated = current + amount;
    localStorage.setItem(`${EXTRA_TOKENS_STORAGE_KEY}_${userId}`, updated.toString());
    window.dispatchEvent(
      new CustomEvent("uali-tokens-updated", { detail: { userId, tokens: updated } }),
    );
    return updated;
  } catch {
    return 0;
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
    window.dispatchEvent(
      new CustomEvent("uali-points-history-updated", { detail: { userId, history: updated } }),
    );
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
  levelData: LevelInfo;
  ffosTokens: number;
  pointsHistory: PointEvent[];
  awardPoints: (options: {
    xpToAdd?: number;
    tokensToAdd?: number;
    reason?: string;
    silent?: boolean;
  }) => Promise<{ newXp: number; newTokens: number }>;
} {
  const userId = useCurrentUserId();
  const progressQuery = useProgressQuery();
  const queryClient = useQueryClient();

  const progress = progressQuery.data;
  const dbXp = progress?.xp ?? 0;
  const dbStreak = progress?.streak ?? 1;

  const [localXp, setLocalXp] = useState<number>(() => getLocalXp(userId));
  const [extraTokens, setExtraTokens] = useState<number>(() => getExtraTokens(userId));
  const [pointsHistory, setPointsHistory] = useState<PointEvent[]>(() => getPointsHistory(userId));

  useEffect(() => {
    if (!userId) return;
    setLocalXp(getLocalXp(userId));
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

    window.addEventListener("uali-tokens-updated", handleTokensUpdate);
    window.addEventListener("uali-xp-updated", handleXpUpdate);
    window.addEventListener("uali-points-history-updated", handleHistoryUpdate);

    return () => {
      window.removeEventListener("uali-tokens-updated", handleTokensUpdate);
      window.removeEventListener("uali-xp-updated", handleXpUpdate);
      window.removeEventListener("uali-points-history-updated", handleHistoryUpdate);
    };
  }, [userId]);

  // El XP efectivo es el mayor entre la base de datos y el acumulado local resiliente
  const effectiveXp = Math.max(dbXp, localXp);
  const effectiveStreak = Math.max(dbStreak, getLocalStreak(userId));

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

  return {
    userId,
    xp: effectiveXp,
    streak: effectiveStreak,
    levelData,
    ffosTokens: totalTokens,
    pointsHistory,
    awardPoints,
  };
}

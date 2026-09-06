import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useCurrentUserId, queryKeys } from "./queries";
import { levelInfo } from "@/lib/ffos/gamification";
import type { Transaction } from "@/lib/ffos/types";
import type { Database } from "./types";

type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

export type GameEvent = { xp: number; levelUp: boolean; newAchievements: string[] };

/**
 * Corre `run` (el insert que dispara un trigger de recompensa en el
 * servidor) y compara el perfil/logros antes y después para reconstruir
 * qué ganó el usuario. El servidor decide los valores reales — esto solo
 * los lee de vuelta para poder mostrar el toast de "+25 XP" / "subiste de
 * nivel" / "logro desbloqueado".
 */
async function captureRewardEvent(
  queryClient: QueryClient,
  userId: string,
  run: () => Promise<void>,
): Promise<GameEvent> {
  const profileKey = queryKeys.profile(userId);
  const achievementsKey = queryKeys.achievements(userId);

  const beforeXp = queryClient.getQueryData<{ xp: number }>(profileKey)?.xp ?? 0;
  const beforeAchievements = queryClient.getQueryData<string[]>(achievementsKey) ?? [];
  const beforeLevel = levelInfo(beforeXp).level;

  await run();

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: profileKey }),
    queryClient.invalidateQueries({ queryKey: achievementsKey }),
  ]);

  const afterXp = queryClient.getQueryData<{ xp: number }>(profileKey)?.xp ?? beforeXp;
  const afterAchievements = queryClient.getQueryData<string[]>(achievementsKey) ?? [];

  return {
    xp: afterXp - beforeXp,
    levelUp: levelInfo(afterXp).level > beforeLevel,
    newAchievements: afterAchievements.filter((id) => !beforeAchievements.includes(id)),
  };
}

export function useAddTransactionMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (payload: Omit<Transaction, "id">): Promise<GameEvent> => {
      if (!userId) throw new Error("No hay sesión activa");
      return captureRewardEvent(queryClient, userId, async () => {
        const { error } = await supabase.from("transactions").insert({
          user_id: userId,
          type: payload.type,
          category: payload.category,
          amount_cents: Math.round(payload.amount * 100),
          occurred_on: payload.date,
          note: payload.note ?? null,
          shared: false,
        });
        if (error) throw error;
      });
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
    },
  });
}

export function useUpdateTransactionMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Transaction, "id">> }) => {
      const dbPatch: TransactionUpdate = {};
      if (patch.type !== undefined) dbPatch["type"] = patch.type;
      if (patch.category !== undefined) dbPatch["category"] = patch.category;
      if (patch.amount !== undefined) dbPatch["amount_cents"] = Math.round(patch.amount * 100);
      if (patch.date !== undefined) dbPatch["occurred_on"] = patch.date;
      if (patch.note !== undefined) dbPatch["note"] = patch.note ?? null;

      const { error } = await supabase.from("transactions").update(dbPatch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
    },
  });
}

export function useDeleteTransactionMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
    },
  });
}

export function useCompleteLessonMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ lessonId, xp }: { lessonId: string; xp: number }): Promise<GameEvent> => {
      if (!userId) throw new Error("No hay sesión activa");
      return captureRewardEvent(queryClient, userId, async () => {
        const { error } = await supabase
          .from("lesson_progress")
          .insert({ user_id: userId, lesson_id: lessonId, xp });
        if (error) throw error;
      });
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ["lessons-done", userId] });
    },
  });
}

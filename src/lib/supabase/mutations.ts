import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useCurrentUserId, useProfileQuery, queryKeys } from "./queries";
import { useSession } from "./auth";
import { emitGameEvent, type GameEvent } from "./gameEvents";
import { levelInfo } from "@/lib/ffos/gamification";
import type { Transaction } from "@/lib/ffos/types";
import type { Database } from "./types";

type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
type NewTransaction = Omit<Transaction, "id" | "userId">;

export type { GameEvent };

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

  const event: GameEvent = {
    xp: afterXp - beforeXp,
    levelUp: levelInfo(afterXp).level > beforeLevel,
    newAchievements: afterAchievements.filter((id) => !beforeAchievements.includes(id)),
  };
  emitGameEvent(event);
  return event;
}

export function useAddTransactionMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: NewTransaction): Promise<GameEvent> => {
      if (!userId) throw new Error("No hay sesión activa");
      return captureRewardEvent(queryClient, userId, async () => {
        const { error } = await supabase.from("transactions").insert({
          user_id: userId,
          // Se etiqueta con la familia aunque no se comparta: no cambia la
          // visibilidad (tx_family_read exige shared=true igual), pero deja
          // el dato listo para reportes familiares más adelante.
          family_id: familyId,
          type: payload.type,
          category: payload.category,
          amount_cents: Math.round(payload.amount * 100),
          occurred_on: payload.date,
          note: payload.note ?? null,
          shared: payload.shared,
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
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<NewTransaction> }) => {
      const dbPatch: TransactionUpdate = {};
      if (patch.type !== undefined) dbPatch["type"] = patch.type;
      if (patch.category !== undefined) dbPatch["category"] = patch.category;
      if (patch.amount !== undefined) dbPatch["amount_cents"] = Math.round(patch.amount * 100);
      if (patch.date !== undefined) dbPatch["occurred_on"] = patch.date;
      if (patch.note !== undefined) dbPatch["note"] = patch.note ?? null;
      if (patch.shared !== undefined) dbPatch["shared"] = patch.shared;

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

function invalidateFamilyState(queryClient: QueryClient, userId: string | null) {
  if (!userId) return;
  queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
  queryClient.invalidateQueries({ queryKey: ["family"] });
  queryClient.invalidateQueries({ queryKey: ["family-members"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
}

export function useCreateFamilyMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.rpc("create_family", { p_name: name });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateFamilyState(queryClient, userId),
  });
}

export function useJoinFamilyMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("join_family", { p_code: code });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateFamilyState(queryClient, userId),
  });
}

export function useInviteToFamilyMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const { session } = useSession();

  return useMutation({
    mutationFn: async ({
      email,
      familyId,
      familyName,
    }: {
      email: string;
      familyId: string;
      familyName: string;
    }) => {
      if (!userId) throw new Error("No hay sesión activa");
      const fromDisplayName =
        (session?.user.user_metadata as { display_name?: string } | undefined)?.display_name ??
        session?.user.email ??
        "Alguien";
      const { error } = await supabase.from("invitations").insert({
        family_id: familyId,
        from_user_id: userId,
        to_email: email.trim().toLowerCase(),
        family_name: familyName,
        from_display_name: fromDisplayName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent-invitations"] });
    },
  });
}

export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc("accept_invitation", {
        p_invitation_id: invitationId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateFamilyState(queryClient, userId);
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
  });
}

export function useAddBudgetMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: { name: string; group: string; planned: number }) => {
      if (!familyId) throw new Error("No estás en una familia todavía");
      const { error } = await supabase.from("budgets").insert({
        family_id: familyId,
        name: payload.name,
        bucket: payload.group,
        planned_cents: Math.round(payload.planned * 100),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", familyId] });
    },
  });
}

export function useRejectInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invitations"] });
    },
  });
}

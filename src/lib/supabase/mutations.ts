import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useCurrentUserId, useProfileQuery, queryKeys } from "./queries";
import { useSession } from "./auth";
import { emitGameEvent, type GameEvent } from "./gameEvents";
import { levelInfo } from "@/lib/ffos/gamification";
import { addLocalLessonDone, recordSpacedReview, DEFAULT_LESSONS } from "@/lib/ffos/lessonsData";
import { getStoredEducationProgress, saveEducationProgress } from "@/lib/ffos/educationStore";
import {
  addExtraTokens,
  addLocalXp,
  setLocalStreak,
  recordPointEvent,
  getLocalXp,
  getLocalStreak,
} from "@/lib/ffos/points";
import {
  savePersonalBudget,
  updatePersonalBudget,
  deletePersonalBudget,
  setPersonalBudgetsBulk,
} from "@/lib/ffos/personalBudgets";
import { savePendingTransaction, addLocalGoal, deleteLocalGoal } from "@/lib/offline-storage";
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
  explicitXpGain = 0,
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

  const afterCached = queryClient.getQueryData<{ xp: number }>(profileKey)?.xp;
  const afterXp = afterCached !== undefined ? afterCached : beforeXp + explicitXpGain;
  const afterAchievements = queryClient.getQueryData<string[]>(achievementsKey) ?? [];

  const actualXpGain = Math.max(explicitXpGain, afterXp - beforeXp);

  const event: GameEvent = {
    xp: actualXpGain,
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
      return captureRewardEvent(
        queryClient,
        userId,
        async () => {
          let savedOnline = false;
          if (typeof navigator === "undefined" || navigator.onLine) {
            try {
              const { error } = await supabase.from("transactions").insert({
                user_id: userId,
                family_id: familyId,
                type: payload.type,
                category: payload.category,
                amount_cents: Math.round(payload.amount * 100),
                occurred_on: payload.date,
                note: payload.note ?? null,
                shared: payload.shared,
                debt_id: payload.debtId ?? null,
                goal_id: payload.goalId ?? null,
              });
              if (!error) {
                savedOnline = true;
              }
            } catch {
              savedOnline = false;
            }
          }

          if (!savedOnline) {
            // Guardar localmente en la cola offline para persistencia
            const pendingId = `tx-offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            savePendingTransaction({
              id: pendingId,
              userId,
              familyId,
              type: payload.type,
              category: payload.category,
              amount: payload.amount,
              date: payload.date,
              note: payload.note ?? null,
              shared: payload.shared,
              debtId: payload.debtId ?? null,
              goalId: payload.goalId ?? null,
              createdAt: new Date().toISOString(),
            });
          }

          // Recompensa real: +10 XP y +15 Puntos FFOS
          const profileKey = queryKeys.profile(userId);
          const cached = queryClient.getQueryData<{
            xp: number;
            streak: number;
            last_active: string | null;
          }>(profileKey);
          const currentXp = Math.max(cached?.xp ?? 0, getLocalXp(userId));
          const currentStreak = Math.max(cached?.streak ?? 1, getLocalStreak(userId));

          const today = new Date().toISOString().slice(0, 10);
          const lastActive = cached?.last_active
            ? new Date(cached.last_active).toISOString().slice(0, 10)
            : null;

          let newStreak = Math.max(1, currentStreak);
          if (!lastActive) {
            newStreak = 1;
          } else if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            newStreak = lastActive === yesterday ? currentStreak + 1 : 1;
          }

          const newXp = currentXp + 10;
          addLocalXp(userId, 10);
          addExtraTokens(userId, 15);
          setLocalStreak(userId, newStreak);
          recordPointEvent(userId, {
            tokens: 15,
            xp: 10,
            reason: `Registro de ${payload.type === "gasto" ? "gasto" : payload.type === "ingreso" ? "ingreso" : payload.type === "ahorro" ? "ahorro" : "pago de deuda"}`,
          });

          // Actualización optimista de perfil
          if (cached) {
            queryClient.setQueryData(profileKey, {
              ...cached,
              xp: newXp,
              streak: newStreak,
              last_active: new Date().toISOString(),
            });
          }

          try {
            await supabase
              .from("profiles")
              .update({
                xp: newXp,
                streak: newStreak,
                last_active: new Date().toISOString(),
              })
              .eq("id", userId);
          } catch {
            // Ignorar errores transitorios
          }
        },
        10,
      );
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
      if (patch.debtId !== undefined) dbPatch["debt_id"] = patch.debtId ?? null;
      if (patch.goalId !== undefined) dbPatch["goal_id"] = patch.goalId ?? null;

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
    mutationFn: async ({
      lessonId,
      slug,
      xp = 25,
    }: {
      lessonId: string;
      slug?: string;
      xp?: number;
    }): Promise<GameEvent> => {
      // 1. Save local fallback & initialize spaced repetition schedule
      addLocalLessonDone(lessonId, slug);
      recordSpacedReview(lessonId, "bien");
      if (slug) recordSpacedReview(slug, "bien");

      // Marcar todas las sub-lecciones de esta lección como completadas en educationStore
      const def = DEFAULT_LESSONS.find(
        (l) => l.id === lessonId || l.slug === slug || `lesson-${l.slug}` === lessonId,
      );
      if (def?.subLessons) {
        const eduState = getStoredEducationProgress();
        const subSet = new Set(eduState.completedSubLessonIds);
        const now = new Date().toISOString();
        for (const sub of def.subLessons) {
          subSet.add(sub.id);
          if (!eduState.subLessonCompletedAt[sub.id]) {
            eduState.subLessonCompletedAt[sub.id] = now;
          }
        }
        eduState.completedSubLessonIds = Array.from(subSet);
        const key = slug || lessonId;
        eduState.lessonActiveStep[key] = def.subLessons.length + 1;
        saveEducationProgress(eduState);
      }

      // 2. Eagerly update TanStack Query cache for instant UI feedback
      const eagerKeys = [lessonId, slug, `lesson-${slug}`].filter(Boolean) as string[];
      if (userId) {
        queryClient.setQueryData<string[]>(["lessons-done", userId], (prev = []) => {
          return Array.from(new Set([...prev, ...eagerKeys]));
        });
      }
      queryClient.setQueryData<string[]>(["lessons-done", "anon"], (prev = []) => {
        return Array.from(new Set([...prev, ...eagerKeys]));
      });

      if (!userId) {
        // Modo anónimo/offline
        addLocalXp("anon", xp);
        addExtraTokens("anon", 50);
        return { xp, levelUp: false, newBadges: [] };
      }

      return captureRewardEvent(
        queryClient,
        userId,
        async () => {
          // Intentar obtener UUID real de la lección para insertar en Supabase
          try {
            let targetUuid = lessonId;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(targetUuid) && slug) {
              const { data: dbL } = await supabase
                .from("lessons")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();
              if (dbL?.id) targetUuid = dbL.id;
            }

            if (uuidRegex.test(targetUuid)) {
              await supabase.from("lesson_progress").insert({
                user_id: userId,
                lesson_id: targetUuid,
              });
            }
          } catch {
            // Ignorar si ya existía o problema de conexión
          }

          // Otorgar XP a perfil y +50 Puntos FFOS
          const profileKey = queryKeys.profile(userId);
          const cached = queryClient.getQueryData<{
            xp: number;
            streak: number;
            last_active: string | null;
          }>(profileKey);
          const currentXp = Math.max(cached?.xp ?? 0, getLocalXp(userId));
          const newXp = currentXp + xp;

          addLocalXp(userId, xp);
          addExtraTokens(userId, 50);
          recordPointEvent(userId, {
            tokens: 50,
            xp,
            reason: `Lección completada: ${slug || lessonId}`,
          });

          if (cached) {
            queryClient.setQueryData(profileKey, {
              ...cached,
              xp: newXp,
              last_active: new Date().toISOString(),
            });
          }

          try {
            await supabase
              .from("profiles")
              .update({ xp: newXp, last_active: new Date().toISOString() })
              .eq("id", userId);
          } catch {
            // Guardado local garantizado
          }
        },
        xp,
      );
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["lessons-done", userId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
      }
      queryClient.invalidateQueries({ queryKey: ["lessons-done", "anon"] });
    },
  });
}

export function useLeaveFamilyMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No hay sesión activa");
      const { error } = await supabase
        .from("profiles")
        .update({ family_id: null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => invalidateFamilyState(queryClient, userId),
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
  const userId = useCurrentUserId();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      group: string;
      planned: number;
      isShared?: boolean;
    }) => {
      const isShared = payload.isShared ?? !!familyId;
      if (!isShared || !familyId) {
        if (!userId) throw new Error("No hay sesión activa");
        savePersonalBudget(userId, {
          name: payload.name,
          group: payload.group,
          planned: payload.planned,
        });
        return;
      }
      const { error } = await supabase.from("budgets").insert({
        family_id: familyId,
        name: payload.name,
        bucket: payload.group,
        planned_cents: Math.round(payload.planned * 100),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateBudgetMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async ({ id, planned }: { id: string; planned: number }) => {
      if (id.startsWith("personal-budget-")) {
        if (userId) updatePersonalBudget(userId, id, planned);
        return;
      }
      const { error } = await supabase
        .from("budgets")
        .update({ planned_cents: Math.round(planned * 100) })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useDeleteBudgetMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("personal-budget-")) {
        if (userId) deletePersonalBudget(userId, id);
        return;
      }
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useSetBudgetsBulkMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const userId = useCurrentUserId();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (items: { name: string; group: string; planned: number }[]) => {
      if (!userId) throw new Error("No hay sesión activa");
      setPersonalBudgetsBulk(userId, items);

      if (familyId) {
        for (const item of items) {
          try {
            await supabase.from("budgets").upsert(
              {
                family_id: familyId,
                name: item.name,
                bucket: item.group,
                planned_cents: Math.round(item.planned * 100),
              },
              { onConflict: "family_id,name" },
            );
          } catch {
            // Ignore if RLS prevents
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

/** Solo el administrador del presupuesto (created_by) puede llamar esto — RLS lo hace cumplir igual, esto solo evita el viaje al servidor para descubrirlo. */
export function useSetBudgetAllocationMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async ({
      budgetId,
      userId,
      allocated,
    }: {
      budgetId: string;
      userId: string;
      allocated: number;
    }) => {
      const { error } = await supabase
        .from("budget_allocations")
        .upsert(
          { budget_id: budgetId, user_id: userId, allocated_cents: Math.round(allocated * 100) },
          { onConflict: "budget_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-allocations", familyId] });
    },
  });
}

export function useDeleteBudgetAllocationMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-allocations", familyId] });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}

const PERSONAL_DEBTS_STORAGE_KEY = "uali_personal_debts_v2";

export function getLocalDebts(): Array<{
  id: string;
  name: string;
  principal: number;
  annualRate: number | null;
  minimum: number | null;
}> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PERSONAL_DEBTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalDebts(
  debts: Array<{
    id: string;
    name: string;
    principal: number;
    annualRate: number | null;
    minimum: number | null;
  }>,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PERSONAL_DEBTS_STORAGE_KEY, JSON.stringify(debts));
  } catch {
    // ignore
  }
}

export function useAddDebtMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      principal: number;
      annualRate: number | null;
      minimum: number | null;
    }) => {
      if (familyId) {
        const { error } = await supabase.from("debts").insert({
          family_id: familyId,
          name: payload.name,
          principal_cents: Math.round(payload.principal * 100),
          annual_rate: payload.annualRate,
          minimum_cents: payload.minimum !== null ? Math.round(payload.minimum * 100) : null,
        });
        if (error) throw error;
      } else {
        // Fallback personal sin forzar familia
        const existing = getLocalDebts();
        const newDebt = {
          id: `debt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: payload.name,
          principal: payload.principal,
          annualRate: payload.annualRate,
          minimum: payload.minimum,
        };
        saveLocalDebts([...existing, newDebt]);
      }

      if (userId) {
        addLocalXp(userId, 10);
        addExtraTokens(userId, 15);
        recordPointEvent(userId, {
          tokens: 15,
          xp: 10,
          reason: `Estrategia de deuda: ${payload.name}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts", familyId] });
      queryClient.invalidateQueries({ queryKey: ["debts", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useUpdateDebtMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      principal: number;
      annualRate: number | null;
      minimum: number | null;
    }) => {
      if (familyId && !payload.id.startsWith("debt-")) {
        const { error } = await supabase
          .from("debts")
          .update({
            name: payload.name,
            principal_cents: Math.round(payload.principal * 100),
            annual_rate: payload.annualRate,
            minimum_cents: payload.minimum !== null ? Math.round(payload.minimum * 100) : null,
          })
          .eq("id", payload.id);
        if (error) throw error;
      }

      // Actualizar también en local si existía
      const local = getLocalDebts();
      const updated = local.map((d) =>
        d.id === payload.id
          ? {
              ...d,
              name: payload.name,
              principal: payload.principal,
              annualRate: payload.annualRate,
              minimum: payload.minimum,
            }
          : d,
      );
      saveLocalDebts(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts", familyId] });
      queryClient.invalidateQueries({ queryKey: ["debts", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useDeleteDebtMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (id: string) => {
      if (familyId && !id.startsWith("debt-")) {
        const { error } = await supabase.from("debts").delete().eq("id", id);
        if (error) throw error;
      }
      const local = getLocalDebts().filter((d) => d.id !== id);
      saveLocalDebts(local);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts", familyId] });
      queryClient.invalidateQueries({ queryKey: ["debts", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useAddGoalMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (payload: { name: string; target: number; dueDate: string | null }) => {
      let savedOnline = false;
      if (familyId && (typeof navigator === "undefined" || navigator.onLine)) {
        try {
          const { error } = await supabase.from("goals").insert({
            family_id: familyId,
            name: payload.name,
            target_cents: Math.round(payload.target * 100),
            due_date: payload.dueDate,
          });
          if (!error) savedOnline = true;
        } catch {
          savedOnline = false;
        }
      }

      if (!savedOnline) {
        addLocalGoal({
          name: payload.name,
          target: payload.target,
          dueDate: payload.dueDate,
        });
      }

      if (userId) {
        addLocalXp(userId, 20);
        addExtraTokens(userId, 25);
        recordPointEvent(userId, {
          tokens: 25,
          xp: 20,
          reason: `Meta de ahorro creada: ${payload.name}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", familyId] });
      queryClient.invalidateQueries({ queryKey: ["goals", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoalMutation() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useMutation({
    mutationFn: async (id: string) => {
      deleteLocalGoal(id);
      if (
        familyId &&
        !id.startsWith("goal-") &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        try {
          await supabase.from("goals").delete().eq("id", id);
        } catch {
          // Ignorar si está offline
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", familyId] });
      queryClient.invalidateQueries({ queryKey: ["goals", "personal"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
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

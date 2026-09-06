import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./client";
import { useSession } from "./auth";
import type { Progress, Transaction } from "@/lib/ffos/types";
import type { Database } from "./types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FamilyRow = Database["public"]["Tables"]["families"]["Row"];
type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

/** Sin "spent": eso se deriva de las transacciones donde se lo necesite. */
export type BudgetRow = { id: string; name: string; group: string; planned: number };

/** Sin "remaining": se deriva restando los pago_deuda enlazados por debt_id. */
export type DebtRow = {
  id: string;
  name: string;
  principal: number;
  annualRate: number | null;
  minimum: number | null;
};

/** Sin "saved": se deriva sumando los ahorro enlazados por goal_id. */
export type GoalRow = { id: string; name: string; target: number; dueDate: string | null };

export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  achievements: (userId: string) => ["achievements", userId] as const,
  transactions: (userId: string) => ["transactions", userId] as const,
};

export function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    category: row.category,
    amount: row.amount_cents / 100,
    date: row.occurred_on,
    note: row.note ?? undefined,
    shared: row.shared,
    debtId: row.debt_id ?? undefined,
    goalId: row.goal_id ?? undefined,
  };
}

/** El usuario autenticado actual, o null mientras carga/si no hay sesión. */
export function useCurrentUserId(): string | null {
  const { session } = useSession();
  return session?.user.id ?? null;
}

export function useProfileQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? queryKeys.profile(userId) : ["profile", "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useAchievementsQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? queryKeys.achievements(userId) : ["achievements", "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return data.map((row) => row.achievement_id);
    },
  });
}

export function useLessonsDoneQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? ["lessons-done", userId] : ["lessons-done", "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return data.map((row) => row.lesson_id);
    },
  });
}

/** Combina profile + logros + lecciones en el mismo shape que usaba el store local. */
export function useProgressQuery(): { data: Progress | undefined; isPending: boolean } {
  const profile = useProfileQuery();
  const achievements = useAchievementsQuery();
  const lessonsDone = useLessonsDoneQuery();

  const isPending = profile.isPending || achievements.isPending || lessonsDone.isPending;
  if (!profile.data) return { data: undefined, isPending };

  return {
    data: {
      xp: profile.data.xp,
      streak: profile.data.streak,
      lastActive: profile.data.last_active,
      lessonsDone: lessonsDone.data ?? [],
      achievements: achievements.data ?? [],
    },
    isPending,
  };
}

export function useTransactionsQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? queryKeys.transactions(userId) : ["transactions", "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<Transaction[]> => {
      // Sin filtro por user_id a propósito: RLS ya devuelve lo propio más lo
      // que la familia compartió (tx_owner OR tx_family_read, fase 2).
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false });
      if (error) throw error;
      return data.map(fromRow);
    },
  });
}

export function useFamilyQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["family", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<FamilyRow> => {
      const { data, error } = await supabase
        .from("families")
        .select("*")
        .eq("id", familyId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useFamilyMembersQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["family-members", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("family_id", familyId!);
      if (error) throw error;
      return data;
    },
  });
}

export function usePendingInvitationsQuery() {
  const { session } = useSession();
  const email = session?.user.email ?? null;

  return useQuery({
    queryKey: ["pending-invitations", email],
    enabled: !!email,
    queryFn: async (): Promise<InvitationRow[]> => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("to_email", email!)
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
  });
}

export function useBudgetsQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["budgets", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<BudgetRow[]> => {
      const { data, error } = await supabase.from("budgets").select("*").eq("family_id", familyId!);
      if (error) throw error;
      return data.map((b) => ({
        id: b.id,
        name: b.name,
        group: b.bucket,
        planned: b.planned_cents / 100,
      }));
    },
  });
}

export function useDebtsQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["debts", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<DebtRow[]> => {
      const { data, error } = await supabase.from("debts").select("*").eq("family_id", familyId!);
      if (error) throw error;
      return data.map((d) => ({
        id: d.id,
        name: d.name,
        principal: d.principal_cents / 100,
        annualRate: d.annual_rate,
        minimum: d.minimum_cents !== null ? d.minimum_cents / 100 : null,
      }));
    },
  });
}

export function useGoalsQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["goals", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<GoalRow[]> => {
      const { data, error } = await supabase.from("goals").select("*").eq("family_id", familyId!);
      if (error) throw error;
      return data.map((g) => ({
        id: g.id,
        name: g.name,
        target: g.target_cents / 100,
        dueDate: g.due_date,
      }));
    },
  });
}

/** id de miembro -> nombre, para mostrar de quién es un movimiento compartido. */
export function useMemberDisplayNameMap(): Record<string, string> {
  const members = useFamilyMembersQuery();
  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members.data ?? []) map[m.id] = m.display_name;
    return map;
  }, [members.data]);
}

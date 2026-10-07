import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./client";
import { useSession } from "./auth";
import { DEFAULT_LESSONS, getLocalLessonsDone } from "@/lib/ffos/lessonsData";
import { getPersonalBudgets } from "@/lib/ffos/personalBudgets";
import { getLocalXp, getLocalStreak } from "@/lib/ffos/points";
import { getLocalDebts } from "@/lib/supabase/mutations";
import type { Progress, Transaction } from "@/lib/ffos/types";
import type { Database } from "./types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type FamilyRow = Database["public"]["Tables"]["families"]["Row"];
type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

/** Sin "spent": eso se deriva de las transacciones donde se lo necesite. */
export type BudgetRow = {
  id: string;
  name: string;
  group: string;
  planned: number;
  createdBy: string | null;
  isShared: boolean;
};

/** Cuánto le repartió el administrador de un presupuesto a cada miembro. */
export type BudgetAllocationRow = {
  id: string;
  budgetId: string;
  userId: string;
  allocated: number;
};

export type NotificationRow = {
  id: string;
  type: string;
  payload: { level: "warning" | "over"; budgetId: string; budgetName: string; memberId: string };
  readAt: string | null;
  createdAt: string;
};

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

export type SubLesson = {
  id: string;
  title: string;
  subtitle: string;
  concept: string;
  practicalExample: string;
  guardianTip: {
    character: "Toto" | "Nido" | "Chispa";
    tip: string;
  };
  keyTakeaway: string;
};

export type LessonRow = {
  id: string;
  /** Identificador estable del catálogo (ej. "debt_order") — para vincular una pantalla a su lección sin depender del uuid. */
  slug: string;
  minLevel: number;
  title: string;
  body: string;
  question: string;
  options: string[];
  answer: number;
  xp: number;
  subLessons?: SubLesson[];
};

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

/** Contenido editable: viene de la tabla `lessons`, no de un array hardcodeado. */
export function useLessonsQuery() {
  return useQuery({
    queryKey: ["lessons"],
    initialData: DEFAULT_LESSONS,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<LessonRow[]> => {
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("*")
          .order("display_order", { ascending: true });
        if (error || !data || data.length === 0) {
          return DEFAULT_LESSONS;
        }
        const defaultBySlug = new Map(DEFAULT_LESSONS.map((d) => [d.slug, d]));
        const dbLessons = data.map((l) => {
          const def = defaultBySlug.get(l.slug);
          return {
            id: l.id,
            slug: l.slug,
            minLevel: l.min_level,
            title: l.title,
            body: l.body,
            question: l.question,
            options: l.options as string[],
            answer: l.answer,
            xp: l.xp,
            subLessons: def?.subLessons,
          };
        });
        // Merge to make sure all rich content is available
        const knownSlugs = new Set(dbLessons.map((l) => l.slug));
        const additional = DEFAULT_LESSONS.filter((l) => !knownSlugs.has(l.slug));
        return [...dbLessons, ...additional];
      } catch {
        return DEFAULT_LESSONS;
      }
    },
  });
}

export function useLessonsDoneQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? ["lessons-done", userId] : ["lessons-done", "anon"],
    initialData: getLocalLessonsDone,
    queryFn: async (): Promise<string[]> => {
      const local = getLocalLessonsDone();
      try {
        if (!userId) return local;
        const { data, error } = await supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId);
        if (error || !data) return local;
        const dbIds = data.map((row) => row.lesson_id);
        const set = new Set([...dbIds, ...local]);
        // Mapear también los slugs de DEFAULT_LESSONS para compatibilidad total
        for (const def of DEFAULT_LESSONS) {
          if (set.has(def.id) || set.has(`lesson-${def.slug}`)) {
            set.add(def.slug);
            set.add(def.id);
          }
        }
        return Array.from(set);
      } catch {
        return local;
      }
    },
  });
}

/** Combina profile + logros + lecciones en el mismo shape que usaba el store local. */
export function useProgressQuery(): { data: Progress | undefined; isPending: boolean } {
  const userId = useCurrentUserId();
  const profile = useProfileQuery();
  const achievements = useAchievementsQuery();
  const lessonsDone = useLessonsDoneQuery();

  const isPending = profile.isPending || achievements.isPending || lessonsDone.isPending;
  const localDone = getLocalLessonsDone();
  const effectiveDone =
    lessonsDone.data && lessonsDone.data.length > 0 ? lessonsDone.data : localDone;
  const effectiveXp = Math.max(profile.data?.xp ?? 0, getLocalXp(userId));
  const effectiveStreak = Math.max(profile.data?.streak ?? 1, getLocalStreak(userId));

  return {
    data: {
      xp: effectiveXp,
      streak: effectiveStreak,
      lastActive: profile.data?.last_active ?? new Date().toISOString(),
      lessonsDone: effectiveDone,
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
  const userId = useCurrentUserId();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["budgets", userId, familyId],
    enabled: !!userId,
    queryFn: async (): Promise<BudgetRow[]> => {
      const personal = userId ? getPersonalBudgets(userId) : [];
      const personalRows: BudgetRow[] = personal.map((p) => ({
        id: p.id,
        name: p.name,
        group: p.group,
        planned: p.planned,
        createdBy: p.userId,
        isShared: false,
      }));

      if (!familyId) {
        return personalRows;
      }

      try {
        const { data, error } = await supabase
          .from("budgets")
          .select("*")
          .eq("family_id", familyId);
        if (error || !data) return personalRows;

        const sharedRows: BudgetRow[] = data.map((b) => ({
          id: b.id,
          name: b.name,
          group: b.bucket,
          planned: b.planned_cents / 100,
          createdBy: b.created_by,
          isShared: true,
        }));

        return [...sharedRows, ...personalRows];
      } catch {
        return personalRows;
      }
    },
  });
}

/** Reparto por miembro de cada presupuesto de la familia — sin fila acá, ese presupuesto sigue siendo compartido sin repartir. */
export function useBudgetAllocationsQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["budget-allocations", familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<BudgetAllocationRow[]> => {
      const { data, error } = await supabase.from("budget_allocations").select("*");
      if (error) throw error;
      return data.map((a) => ({
        id: a.id,
        budgetId: a.budget_id,
        userId: a.user_id,
        allocated: a.allocated_cents / 100,
      }));
    },
  });
}

export function useNotificationsQuery() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: userId ? ["notifications", userId] : ["notifications", "anon"],
    enabled: !!userId,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .is("read_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((n) => ({
        id: n.id,
        type: n.type,
        payload: n.payload as NotificationRow["payload"],
        readAt: n.read_at,
        createdAt: n.created_at,
      }));
    },
  });
}

export function useDebtsQuery() {
  const profile = useProfileQuery();
  const familyId = profile.data?.family_id ?? null;

  return useQuery({
    queryKey: ["debts", familyId ?? "personal"],
    queryFn: async (): Promise<DebtRow[]> => {
      const local = getLocalDebts();
      if (!familyId) return local;
      try {
        const { data, error } = await supabase.from("debts").select("*").eq("family_id", familyId);
        if (error || !data) return local;
        const dbDebts = data.map((d) => ({
          id: d.id,
          name: d.name,
          principal: d.principal_cents / 100,
          annualRate: d.annual_rate,
          minimum: d.minimum_cents !== null ? d.minimum_cents / 100 : null,
        }));
        const existingIds = new Set(dbDebts.map((d) => d.id));
        const extraLocal = local.filter((d) => !existingIds.has(d.id));
        return [...dbDebts, ...extraLocal];
      } catch {
        return local;
      }
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "./client";
import { useSession } from "./auth";
import type { Progress, Transaction } from "@/lib/ffos/types";
import type { Database } from "./types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  achievements: (userId: string) => ["achievements", userId] as const,
  transactions: (userId: string) => ["transactions", userId] as const,
};

export function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    amount: row.amount_cents / 100,
    date: row.occurred_on,
    note: row.note ?? undefined,
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
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false });
      if (error) throw error;
      return data.map(fromRow);
    },
  });
}

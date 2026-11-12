import { useEffect, useState, useCallback, useRef } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/queries";
import {
  getPendingTransactions,
  removePendingTransaction,
  getOfflineStats,
} from "@/lib/offline-storage";
import { toast } from "sonner";

export async function syncPendingTransactions(
  userId: string,
  queryClient?: QueryClient,
): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine || !userId) {
    return { synced: 0, failed: 0 };
  }

  const pending = getPendingTransactions(userId);
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: item.userId,
        family_id: item.familyId,
        type: item.type,
        category: item.category,
        amount_cents: Math.round(item.amount * 100),
        occurred_on: item.date,
        note: item.note ?? null,
        shared: item.shared,
        debt_id: item.debtId ?? null,
        goal_id: item.goalId ?? null,
      });

      if (!error) {
        removePendingTransaction(userId, item.id);
        synced++;
      } else {
        console.warn("Fallo al sincronizar transacción pendiente:", error);
        failed++;
      }
    } catch (err) {
      console.warn("Error de red al sincronizar:", err);
      failed++;
    }
  }

  if (synced > 0) {
    toast.success(
      synced === 1
        ? "1 movimiento pendiente fue sincronizado con éxito."
        : `${synced} movimientos pendientes fueron sincronizados.`,
    );
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    }
  }

  return { synced, failed };
}

export function useOfflineSync(userId: string | null, queryClient?: QueryClient) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => getOfflineStats(userId).pendingCount);
  const isSyncingRef = useRef(false);

  const updateCount = useCallback(() => {
    setPendingCount(getOfflineStats(userId).pendingCount);
  }, [userId]);

  const syncNow = useCallback(async () => {
    if (!userId || !navigator.onLine || isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      await syncPendingTransactions(userId, queryClient);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
      updateCount();
    }
  }, [userId, queryClient, updateCount]);

  useEffect(() => {
    updateCount();

    const handleOnline = () => {
      // Breve espera para que la conexión se estabilice
      setTimeout(() => {
        syncNow();
      }, 1000);
    };

    const handleUpdate = () => {
      updateCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("uali-pending-tx-updated", handleUpdate);

    // Intentar sincronizar al montar si estamos online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncNow();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("uali-pending-tx-updated", handleUpdate);
    };
  }, [syncNow, updateCount]);

  return {
    isSyncing,
    pendingCount,
    syncNow,
  };
}

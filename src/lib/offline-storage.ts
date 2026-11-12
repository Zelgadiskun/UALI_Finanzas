import type { Transaction } from "@/lib/ffos/types";
import type { GoalRow } from "@/lib/supabase/queries";

export interface PendingTransaction {
  id: string;
  userId: string;
  familyId: string | null;
  type: "gasto" | "ingreso" | "ahorro" | "pago_deuda";
  category: string;
  amount: number;
  date: string;
  note?: string | null;
  shared: boolean;
  debtId?: string | null;
  goalId?: string | null;
  createdAt: string;
}

const PENDING_TX_KEY_PREFIX = "uali_pending_tx_v2_";
const CACHED_TX_KEY_PREFIX = "uali_cached_tx_v2_";
const PERSONAL_GOALS_KEY = "uali_personal_goals_v2";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

// ==========================================
// 1. Transacciones pendientes (Offline Queue)
// ==========================================

export function getPendingTransactions(userId: string): PendingTransaction[] {
  if (!isBrowser() || !userId) return [];
  try {
    const raw = localStorage.getItem(`${PENDING_TX_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingTransaction(tx: PendingTransaction): void {
  if (!isBrowser() || !tx.userId) return;
  try {
    const current = getPendingTransactions(tx.userId);
    const updated = [tx, ...current.filter((item) => item.id !== tx.id)];
    localStorage.setItem(`${PENDING_TX_KEY_PREFIX}${tx.userId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("uali-pending-tx-updated"));
  } catch (err) {
    console.error("Error guardando transacción pendiente:", err);
  }
}

export function removePendingTransaction(userId: string, txId: string): void {
  if (!isBrowser() || !userId) return;
  try {
    const current = getPendingTransactions(userId);
    const updated = current.filter((item) => item.id !== txId);
    localStorage.setItem(`${PENDING_TX_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("uali-pending-tx-updated"));
  } catch (err) {
    console.error("Error eliminando transacción pendiente:", err);
  }
}

export function clearPendingTransactions(userId: string): void {
  if (!isBrowser() || !userId) return;
  try {
    localStorage.removeItem(`${PENDING_TX_KEY_PREFIX}${userId}`);
    window.dispatchEvent(new CustomEvent("uali-pending-tx-updated"));
  } catch {
    // Ignore
  }
}

// ==========================================
// 2. Caché local de respaldo de transacciones
// ==========================================

export function getCachedTransactions(userId: string): Transaction[] {
  if (!isBrowser() || !userId) return [];
  try {
    const raw = localStorage.getItem(`${CACHED_TX_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedTransactions(userId: string, transactions: Transaction[]): void {
  if (!isBrowser() || !userId) return;
  try {
    localStorage.setItem(`${CACHED_TX_KEY_PREFIX}${userId}`, JSON.stringify(transactions));
  } catch {
    // Ignore (e.g. storage quota exceeded)
  }
}

/**
 * Combina transacciones del servidor con las transacciones pendientes
 * guardadas localmente que aún no se sincronizan.
 */
export function mergeWithPendingTransactions(
  userId: string,
  serverList: Transaction[],
): Transaction[] {
  const pending = getPendingTransactions(userId);
  if (pending.length === 0) return serverList;

  const pendingAsTransactions: Transaction[] = pending.map((p) => ({
    id: p.id,
    userId: p.userId,
    type: p.type,
    category: p.category,
    amount: p.amount,
    date: p.date,
    note: p.note ?? undefined,
    shared: p.shared,
    debtId: p.debtId ?? undefined,
    goalId: p.goalId ?? undefined,
  }));

  const existingIds = new Set(serverList.map((t) => t.id));
  const missingPending = pendingAsTransactions.filter((p) => !existingIds.has(p.id));

  return [...missingPending, ...serverList].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

// ==========================================
// 3. Metas de ahorro personales (Offline Goals)
// ==========================================

export function getLocalGoals(): GoalRow[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(PERSONAL_GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalGoals(goals: GoalRow[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PERSONAL_GOALS_KEY, JSON.stringify(goals));
  } catch {
    // Ignore
  }
}

export function addLocalGoal(goal: {
  name: string;
  target: number;
  dueDate: string | null;
}): GoalRow {
  const newGoal: GoalRow = {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: goal.name,
    target: goal.target,
    dueDate: goal.dueDate,
  };
  const current = getLocalGoals();
  saveLocalGoals([...current, newGoal]);
  return newGoal;
}

export function deleteLocalGoal(id: string): void {
  const current = getLocalGoals();
  saveLocalGoals(current.filter((g) => g.id !== id));
}

// ==========================================
// 4. Estadísticas del estado offline
// ==========================================

export function getOfflineStats(userId: string | null) {
  if (!userId) return { pendingCount: 0, hasPending: false };
  const pending = getPendingTransactions(userId);
  return {
    pendingCount: pending.length,
    hasPending: pending.length > 0,
  };
}

import { useSyncExternalStore } from "react";
import { subDays, format as formatDate, addDays, startOfMonth } from "date-fns";
import { LESSONS, levelInfo } from "./gamification";
import { todayISO } from "./format";
import type { BudgetItem, FfosState, Progress, Transaction, TxType } from "./types";

const STORAGE_KEY = "ffos-wallet-v2";

/**
 * Demo dataset shown on first run (and after "Reiniciar datos de demo").
 * Dates are generated relative to today so the month view is never stale.
 */
function seed(): FfosState {
  const monthStart = startOfMonth(new Date());
  const day = (offset: number) => formatDate(addDays(monthStart, offset), "yyyy-MM-dd");

  const transactions: Transaction[] = [
    {
      id: "seed-1",
      type: "ingreso",
      category: "Sueldo",
      amount: 850000,
      date: day(0),
      note: "Sueldo mensual",
    },
    {
      id: "seed-2",
      type: "gasto",
      category: "Comida",
      amount: 45000,
      date: day(2),
      note: "Supermercado",
    },
    { id: "seed-3", type: "gasto", category: "Servicios", amount: 32000, date: day(4) },
    { id: "seed-4", type: "ahorro", category: "Fondo de emergencia", amount: 60000, date: day(5) },
    { id: "seed-5", type: "pago_deuda", category: "Tarjeta", amount: 40000, date: day(7) },
    { id: "seed-6", type: "gasto", category: "Transporte", amount: 18000, date: day(9) },
  ];

  const budget: BudgetItem[] = [
    { id: "b1", name: "Alquiler", group: "Fijos", planned: 250000, spent: 250000 },
    { id: "b2", name: "Comida", group: "Variables", planned: 120000, spent: 45000 },
    { id: "b3", name: "Transporte", group: "Variables", planned: 40000, spent: 18000 },
    { id: "b4", name: "Ocio", group: "Discrecional", planned: 30000, spent: 32000 },
    { id: "b5", name: "Ahorro", group: "Ahorro", planned: 80000, spent: 60000 },
  ];

  const progress: Progress = {
    xp: 0,
    streak: 0,
    lastActive: null,
    lessonsDone: [],
    achievements: [],
  };

  return { transactions, budget, debtTotal: 180000, monthlyIncomePlan: 850000, progress };
}

let state: FfosState = seed();
let hydrated = false;

const stateListeners = new Set<() => void>();
const hydrationListeners = new Set<() => void>();

function notify() {
  for (const fn of stateListeners) fn();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, disabled storage) — state stays in memory only.
  }
}

export function useFfos(): FfosState {
  return useSyncExternalStore(
    (cb) => {
      stateListeners.add(cb);
      return () => stateListeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => {
      hydrationListeners.add(cb);
      return () => hydrationListeners.delete(cb);
    },
    () => hydrated,
    () => false,
  );
}

/** Loads persisted state from localStorage. Client-only; call once on mount. */
export function hydrate() {
  if (hydrated) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as FfosState;
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed already in `state`.
  }
  hydrated = true;
  for (const fn of hydrationListeners) fn();
  notify();
}

export function resetData() {
  state = seed();
  persist();
  notify();
}

export type GameEvent = { xp: number; levelUp: boolean; newAchievements: string[] };

const gameListeners = new Set<(e: GameEvent) => void>();

export function onGameEvent(fn: (e: GameEvent) => void) {
  gameListeners.add(fn);
  return () => gameListeners.delete(fn);
}

function emitGameEvent(e: GameEvent) {
  for (const fn of gameListeners) fn(e);
}

function xpFor(type: TxType): number {
  if (type === "ingreso") return 5;
  if (type === "ahorro" || type === "pago_deuda") return 10;
  return 0;
}

function unlock(progress: Progress, id: string, into: string[]) {
  if (!progress.achievements.includes(id)) {
    progress.achievements.push(id);
    into.push(id);
  }
}

/** Advances the daily streak if today's activity hasn't been counted yet. */
function applyStreak(progress: Progress) {
  const today = todayISO();
  if (progress.lastActive === today) return;
  const yesterday = formatDate(subDays(new Date(), 1), "yyyy-MM-dd");
  progress.streak = progress.lastActive === yesterday ? progress.streak + 1 : 1;
  progress.lastActive = today;
}

export function addTransaction(payload: Omit<Transaction, "id">): GameEvent {
  const isFirstTx = state.transactions.length === 0;
  const tx: Transaction = {
    ...payload,
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
  };

  const progress: Progress = {
    ...state.progress,
    achievements: [...state.progress.achievements],
  };
  const beforeLevel = levelInfo(progress.xp).level;

  applyStreak(progress);
  const xpGained = xpFor(tx.type);
  progress.xp += xpGained;

  const newAchievements: string[] = [];
  if (isFirstTx) unlock(progress, "first_tx", newAchievements);
  if (progress.streak >= 7) unlock(progress, "week_streak", newAchievements);
  if (tx.type === "ahorro") unlock(progress, "saver", newAchievements);
  if (tx.type === "pago_deuda") unlock(progress, "debt_slayer", newAchievements);

  const afterLevel = levelInfo(progress.xp).level;

  state = { ...state, transactions: [...state.transactions, tx], progress };
  persist();
  notify();

  const event: GameEvent = { xp: xpGained, levelUp: afterLevel > beforeLevel, newAchievements };
  emitGameEvent(event);
  return event;
}

export function updateTransaction(id: string, patch: Partial<Omit<Transaction, "id">>) {
  state = {
    ...state,
    transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  };
  persist();
  notify();
}

export function deleteTransaction(id: string) {
  state = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
  persist();
  notify();
}

export function completeLesson(lessonId: string): GameEvent | null {
  if (state.progress.lessonsDone.includes(lessonId)) return null;
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return null;

  const progress: Progress = {
    ...state.progress,
    lessonsDone: [...state.progress.lessonsDone, lessonId],
    achievements: [...state.progress.achievements],
  };
  const beforeLevel = levelInfo(progress.xp).level;
  progress.xp += lesson.xp;
  const afterLevel = levelInfo(progress.xp).level;

  const newAchievements: string[] = [];
  if (state.progress.lessonsDone.length === 0) unlock(progress, "first_lesson", newAchievements);

  state = { ...state, progress };
  persist();
  notify();

  const event: GameEvent = { xp: lesson.xp, levelUp: afterLevel > beforeLevel, newAchievements };
  emitGameEvent(event);
  return event;
}

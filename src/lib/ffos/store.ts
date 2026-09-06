import { useSyncExternalStore } from "react";
import type { BudgetItem, TxType } from "./types";

const STORAGE_KEY = "ffos-wallet-v2";

/**
 * Movimientos y progreso reales viven en Supabase desde la fase de cuentas
 * (src/lib/supabase/*) — lo único que sigue acá es presupuesto/deuda/ingreso
 * planificado, porque son entidades familiares (fase de Familia) que todavía
 * no se migraron. Este tipo no es el Transaction real: es solo lo que la
 * demo de deudas necesita para sumar pagos.
 */
type DemoTransaction = { type: TxType; amount: number };

type DemoState = {
  transactions: DemoTransaction[];
  budget: BudgetItem[];
  debtTotal: number;
  monthlyIncomePlan: number;
};

function seed(): DemoState {
  const transactions: DemoTransaction[] = [
    { type: "ingreso", amount: 850000 },
    { type: "gasto", amount: 45000 },
    { type: "gasto", amount: 32000 },
    { type: "ahorro", amount: 60000 },
    { type: "pago_deuda", amount: 40000 },
    { type: "gasto", amount: 18000 },
  ];

  const budget: BudgetItem[] = [
    { id: "b1", name: "Alquiler", group: "Fijos", planned: 250000, spent: 250000 },
    { id: "b2", name: "Comida", group: "Variables", planned: 120000, spent: 45000 },
    { id: "b3", name: "Transporte", group: "Variables", planned: 40000, spent: 18000 },
    { id: "b4", name: "Ocio", group: "Discrecional", planned: 30000, spent: 32000 },
    { id: "b5", name: "Ahorro", group: "Ahorro", planned: 80000, spent: 60000 },
  ];

  return { transactions, budget, debtTotal: 180000, monthlyIncomePlan: 850000 };
}

let state: DemoState = seed();
let hydrated = false;

const stateListeners = new Set<() => void>();

function notify() {
  for (const fn of stateListeners) fn();
}

export function useFfos(): DemoState {
  return useSyncExternalStore(
    (cb) => {
      stateListeners.add(cb);
      return () => stateListeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

/** Loads persisted state from localStorage. Client-only; call once on mount. */
export function hydrate() {
  if (hydrated) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) as DemoState;
  } catch {
    // Corrupt or inaccessible storage — fall back to the seed already in `state`.
  }
  hydrated = true;
  notify();
}

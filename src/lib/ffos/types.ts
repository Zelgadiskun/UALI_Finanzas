export type TxType = "ingreso" | "gasto" | "pago_deuda" | "ahorro";

export const TX_TYPES: { value: TxType; label: string }[] = [
  { value: "ingreso", label: "Ingreso" },
  { value: "gasto", label: "Gasto" },
  { value: "pago_deuda", label: "Pago deuda" },
  { value: "ahorro", label: "Ahorro" },
];

export const CATEGORIES: Record<TxType, string[]> = {
  ingreso: ["Sueldo", "Extra", "Regalo", "Otro"],
  gasto: ["Comida", "Transporte", "Servicios", "Salud", "Entretenimiento", "Otro"],
  pago_deuda: ["Tarjeta", "Préstamo", "Otro"],
  ahorro: ["Fondo de emergencia", "Meta", "Otro"],
};

export type Transaction = {
  id: string;
  userId: string;
  type: TxType;
  category: string;
  amount: number;
  /** ISO yyyy-MM-dd */
  date: string;
  note?: string | undefined;
  /** Visible para el resto de la familia, no solo para quien lo cargó. */
  shared: boolean;
  /** A qué deuda amortiza este pago, si type es "pago_deuda". */
  debtId?: string | undefined;
  /** A qué meta aporta este ahorro, si type es "ahorro". */
  goalId?: string | undefined;
};

export type Progress = {
  xp: number;
  streak: number;
  /** ISO yyyy-MM-dd of the last day a transaction was registered, or null */
  lastActive: string | null;
  lessonsDone: string[];
  achievements: string[];
};

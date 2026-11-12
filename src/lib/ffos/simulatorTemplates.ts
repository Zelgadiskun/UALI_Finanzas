/**
 * Puente entre el Laboratorio de Simulacros (Toto / Chispa / Nido)
 * y la Billetera Real (/presupuesto, /ahorro, /deudas).
 *
 * Permite aplicar estructuras practicadas en el simulador como plantillas
 * editables sin alterar movimientos históricos reales.
 */

export type SimulatorTemplateId =
  | "rule_50_30_20"
  | "proportional_equity"
  | "emergency_shield_3m"
  | "debt_snowball_extra";

export interface SimulatorTemplateConfig {
  id: SimulatorTemplateId;
  title: string;
  description: string;
  mentor: "Nido" | "Chispa" | "Toto";
  appliedAt?: string;
}

const TEMPLATE_STORAGE_KEY = "uali_simulator_templates_v3";

export const SIMULATOR_TEMPLATES: Record<SimulatorTemplateId, SimulatorTemplateConfig> = {
  rule_50_30_20: {
    id: "rule_50_30_20",
    title: "Plantilla 50 / 30 / 20 (Practicada en Simulador)",
    description:
      "Distribuye automáticamente tu ingreso mensual en 50% Necesidades, 30% Gustos conscientes y 20% Fondo de Paz.",
    mentor: "Nido",
  },
  proportional_equity: {
    id: "proportional_equity",
    title: "Acuerdo Proporcional 60 / 40 (Chispa)",
    description:
      "Equilibra los gastos compartidos del hogar o equipo según la capacidad real de ingreso de cada integrante.",
    mentor: "Chispa",
  },
  emergency_shield_3m: {
    id: "emergency_shield_3m",
    title: "Meta Fondo de Paz (3 Meses Base)",
    description:
      "Crea tu reserva de tranquilidad para convertir imprevistos técnicos o familiares en trámites de 0% interés.",
    mentor: "Nido",
  },
  debt_snowball_extra: {
    id: "debt_snowball_extra",
    title: "Acelerador Bola de Nieve / Avalancha",
    description:
      "Simula cuánto tiempo e intereses reduces al sumar un abono extra fijo mensual a tus deudas activas.",
    mentor: "Toto",
  },
};

export function getAppliedTemplates(): Partial<Record<SimulatorTemplateId, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markTemplateApplied(id: SimulatorTemplateId): void {
  if (typeof window === "undefined") return;
  try {
    const current = getAppliedTemplates();
    current[id] = new Date().toISOString();
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

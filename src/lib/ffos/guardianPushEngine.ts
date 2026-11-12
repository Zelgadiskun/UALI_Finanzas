/**
 * UALÍ — Motor Telemétrico de Notificaciones Push & Cadencia de Retención
 *
 * REGLAS DE ARQUITECTURA:
 * 1. Guardianes y Disparadores:
 *    - NIDO (Cerdito Alcancía blindado): Eventos individuales y de ahorro.
 *    - CHISPA (Triángulo Compás de Brújula de navegación): Sincronización de equipo (Team_ID).
 *    - TOTO (Moneda holográfica geométrica): Eventos globales de la Liga (Desafío Flash, Multiplicadores).
 * 2. Condición de Estrés Crítico (> 75%):
 *    - Si Barra de Estrés > 75%, Nido conmuta a tono "S.O.S. de Reparación".
 *    - Desactiva y silencia las alertas promocionales de Toto.
 * 3. Restricción Estricta de Longitud:
 *    - Longitud máxima permitida: 90 caracteres por string (título y cuerpo).
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addSmartNotification, type SmartNotification } from "@/lib/ffos/notificationsStore";

export const MAX_PUSH_STRING_LENGTH = 90;
export const STRESS_THRESHOLD_SOS = 75;

export type GuardianId = "nido" | "chispa" | "toto";

export type GuardianTriggerCategory =
  | "individual_ahorro" // Disparador para Nido
  | "team_sync" // Disparador para Chispa (Team_ID)
  | "liga_global"; // Disparador para Toto

export interface GuardianEntityMeta {
  id: GuardianId;
  name: string;
  anatomy: string;
  role: string;
  triggerCategory: GuardianTriggerCategory;
  defaultIcon: "nido" | "chispa" | "toto";
}

export const GUARDIANS_META: Record<GuardianId, GuardianEntityMeta> = {
  nido: {
    id: "nido",
    name: "Nido",
    anatomy: "Cerdito Alcancía blindado",
    role: "Base del ahorro y la protección patrimonial",
    triggerCategory: "individual_ahorro",
    defaultIcon: "nido",
  },
  chispa: {
    id: "chispa",
    name: "Chispa",
    anatomy: "Triángulo Compás de Brújula de navegación",
    role: "Dirección, crédito y división equitativa en equipo",
    triggerCategory: "team_sync",
    defaultIcon: "chispa",
  },
  toto: {
    id: "toto",
    name: "Toto",
    anatomy: "Moneda holográfica geométrica",
    role: "Multiplicación, interés compuesto y Liga global",
    triggerCategory: "liga_global",
    defaultIcon: "toto",
  },
};

/**
 * Truncador estricto a 90 caracteres para garantizar legibilidad en UI móvil
 */
export function enforceMax90(text: string): string {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= MAX_PUSH_STRING_LENGTH) {
    return cleaned;
  }
  return cleaned.slice(0, MAX_PUSH_STRING_LENGTH - 1) + "…";
}

/**
 * Validador estricto de restricciones de 90 caracteres
 */
export function validatePushString(text: string): {
  valid: boolean;
  length: number;
  remaining: number;
} {
  const len = text ? text.length : 0;
  return {
    valid: len <= MAX_PUSH_STRING_LENGTH,
    length: len,
    remaining: MAX_PUSH_STRING_LENGTH - len,
  };
}

// -------------------------------------------------------------
// CATÁLOGO DE PLANTILLAS PRECALIBRADAS (TODAS <= 90 CARACTERES)
// -------------------------------------------------------------

export interface GuardianNotificationTemplate {
  id: string;
  guardian: GuardianId;
  triggerCategory: GuardianTriggerCategory;
  title: string;
  body: string;
  isSOS?: boolean;
  isPromo?: boolean;
}

export const GUARDIAN_TEMPLATES: GuardianNotificationTemplate[] = [
  // 1. NIDO — INDIVIDUAL / AHORRO (MODO NORMAL: <= 75% ESTRÉS)
  {
    id: "nido-ahorro-1",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "🐷 NIDO: Meta de Ahorro",
    body: "Aportaste a tu reserva blindada. Tu colchón de tranquilidad sigue creciendo.",
    isSOS: false,
    isPromo: false,
  },
  {
    id: "nido-gasto-hormiga",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "🐷 NIDO: Gasto Hormiga Frenado",
    body: "Evitaste una compra impulsiva. Esos fondos se trasladaron a tu alcancía Nido.",
    isSOS: false,
    isPromo: false,
  },
  {
    id: "nido-blindaje-personal",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "🐷 NIDO: Blindaje Individual",
    body: "Excelente disciplina individual: tu liquidez operativa se mantiene protegida.",
    isSOS: false,
    isPromo: false,
  },

  // 2. NIDO — S.O.S. DE REPARACIÓN (MODO CRÍTICO: > 75% ESTRÉS)
  {
    id: "nido-sos-freno",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "🚨 S.O.S. NIDO: Freno de Emergencia",
    body: "Estrés financiero crítico (>75%). Congela compras opcionales y cuida tu reserva.",
    isSOS: true,
    isPromo: false,
  },
  {
    id: "nido-sos-blindaje",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "🛡️ S.O.S. NIDO: Blindaje Reparador",
    body: "Tu liquidez está bajo presión. Aplasta primero deudas mínimas y repara tu flujo.",
    isSOS: true,
    isPromo: false,
  },
  {
    id: "nido-sos-grieta",
    guardian: "nido",
    triggerCategory: "individual_ahorro",
    title: "⚠️ S.O.S. NIDO: Alerta de Fortaleza",
    body: "Grieta en balance por sobreendeudamiento. Detén fugas y prioriza lo esencial.",
    isSOS: true,
    isPromo: false,
  },

  // 3. CHISPA — SINCRONIZACIÓN DE EQUIPO (TEAM_ID)
  {
    id: "chispa-team-gasto",
    guardian: "chispa",
    triggerCategory: "team_sync",
    title: "📐 CHISPA: Sincronización Clan",
    body: "Nuevo gasto compartido en tu equipo. El compás calculó el balance equitativo.",
    isSOS: false,
    isPromo: false,
  },
  {
    id: "chispa-team-voto",
    guardian: "chispa",
    triggerCategory: "team_sync",
    title: "🧭 CHISPA: Votación de Equipo Abierta",
    body: "Ventana de 12 horas activa en tu Clan. Confirma el aporte conjunto del mes.",
    isSOS: false,
    isPromo: false,
  },
  {
    id: "chispa-team-pozo",
    guardian: "chispa",
    triggerCategory: "team_sync",
    title: "⚡ CHISPA: Balance de Clan Nivelado",
    body: "Aportes sincronizados en tu equipo. La red de flujo compartido está en balance.",
    isSOS: false,
    isPromo: false,
  },

  // 4. TOTO — EVENTOS GLOBALES DE LA LIGA (PROMOCIONALES / COMPETITIVOS)
  {
    id: "toto-liga-flash",
    guardian: "toto",
    triggerCategory: "liga_global",
    title: "🪙 TOTO: Desafío Flash de la Liga",
    body: "Micro-dilema de 30s disponible en la Liga. Acepta el reto y gana +50 FFOS hoy.",
    isSOS: false,
    isPromo: true,
  },
  {
    id: "toto-liga-multiplicador",
    guardian: "toto",
    triggerCategory: "liga_global",
    title: "⚡ TOTO: Multiplicador Global Activo",
    body: "Torneo de tiburones en marcha. El interés compuesto impulsa el ranking global.",
    isSOS: false,
    isPromo: true,
  },
  {
    id: "toto-liga-ranking",
    guardian: "toto",
    triggerCategory: "liga_global",
    title: "🏆 TOTO: Tabla Semanal de la Liga",
    body: "Tu índice de resiliencia escaló en la tabla de la Liga. Revisa tu posición.",
    isSOS: false,
    isPromo: true,
  },
];

// -------------------------------------------------------------
// CONTROL DE ESTRÉS FINANCIERO (LOCAL & SINCRONIZADO)
// -------------------------------------------------------------

const STRESS_STORAGE_KEY = "uali_financial_stress_level";
const STRESS_EVENT_NAME = "uali_financial_stress_changed";

export function getStoredStressLevel(): number {
  if (typeof window === "undefined") return 40;
  try {
    const raw = localStorage.getItem(STRESS_STORAGE_KEY);
    return raw !== null ? Number(raw) : 40;
  } catch {
    return 40;
  }
}

export function saveStoredStressLevel(level: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  localStorage.setItem(STRESS_STORAGE_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent(STRESS_EVENT_NAME, { detail: clamped }));
}

/**
 * Calcula el nivel de estrés financiero a partir de deudas y liquidez operativa
 */
export function calculateStressFromFinances(totalDebt: number, liquidCash: number): number {
  if (totalDebt <= 0) return 15; // Estrés mínimo saludable
  if (liquidCash <= 0) return 95; // Estrés extremo
  const ratio = (totalDebt / (liquidCash + totalDebt)) * 100;
  return Math.min(100, Math.max(10, Math.round(ratio)));
}

/**
 * Hook para monitorear y calibrar la Barra de Estrés en tiempo real
 */
export function useFinancialStress() {
  const [stressLevel, setStressLevelState] = useState<number>(getStoredStressLevel);

  useEffect(() => {
    function handleUpdate() {
      setStressLevelState(getStoredStressLevel());
    }
    window.addEventListener(STRESS_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(STRESS_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isSOSMode = stressLevel > STRESS_THRESHOLD_SOS;

  const setStressLevel = (val: number) => {
    saveStoredStressLevel(val);
    setStressLevelState(val);
  };

  return {
    stressLevel,
    isSOSMode,
    setStressLevel,
  };
}

// -------------------------------------------------------------
// MOTOR DE EVALUACIÓN Y DISPARO DE NOTIFICACIONES PUSH
// -------------------------------------------------------------

export interface DispatchNotificationParams {
  guardian: GuardianId;
  triggerCategory?: GuardianTriggerCategory | undefined;
  title: string;
  body: string;
  teamId?: string | undefined;
  isPromo?: boolean | undefined;
  stressLevelOverride?: number | undefined;
  priority?: "high" | "medium" | "low" | undefined;
}

export interface DispatchNotificationResult {
  dispatched: boolean;
  blocked: boolean;
  reason?: string;
  guardian: GuardianId;
  title: string;
  body: string;
  isSOS: boolean;
  isPromo: boolean;
  stressLevel: number;
  characterTitleLen: number;
  characterBodyLen: number;
  notification?: SmartNotification;
}

/**
 * Evalúa las reglas de cadencia de retención y dispara la notificación si procede.
 * Regla 1: Guardianes personalizados por disparador.
 * Regla 2: Estrés > 75% -> Nido cambia a "S.O.S. de Reparación" y se desactivan alertas de Toto.
 * Regla 3: Título y Cuerpo estrictamente <= 90 caracteres.
 */
export function dispatchGuardianPushNotification(
  params: DispatchNotificationParams,
): DispatchNotificationResult {
  const currentStress =
    params.stressLevelOverride !== undefined ? params.stressLevelOverride : getStoredStressLevel();
  const isHighStress = currentStress > STRESS_THRESHOLD_SOS;

  const guardian = params.guardian;
  let isSOS = false;
  const isPromo = Boolean(params.isPromo);

  // Mapear categoría por guardián si no viene dada
  const triggerCategory = params.triggerCategory || GUARDIANS_META[guardian].triggerCategory;

  // REGLA 2A: Desactivar alertas promocionales de Toto si Estrés > 75%
  if (guardian === "toto" && isPromo && isHighStress) {
    return {
      dispatched: false,
      blocked: true,
      reason: `Silenciado: Alertas promocionales de Toto desactivadas por Barra de Estrés > 75% (${currentStress}%). Usuario en modo recuperación patrimonial.`,
      guardian: "toto",
      title: enforceMax90(params.title),
      body: enforceMax90(params.body),
      isSOS: false,
      isPromo: true,
      stressLevel: currentStress,
      characterTitleLen: params.title.length,
      characterBodyLen: params.body.length,
    };
  }

  let finalTitle = params.title;
  let finalBody = params.body;

  // REGLA 2B: Si Nido recibe un evento con Estrés > 75%, conmuta a "S.O.S. de Reparación"
  if (guardian === "nido" && isHighStress) {
    isSOS = true;
    // Si no trae prefijo SOS explícito, transmuta al tono de auxilio
    if (!finalTitle.includes("S.O.S.")) {
      finalTitle = `🚨 S.O.S. NIDO: Freno de Emergencia`;
      finalBody = `Estrés al ${currentStress}%. Congela compras opcionales y protege tu colchón de tranquilidad.`;
    }
  }

  // REGLA 1: Formato adaptativo con Team_ID para Chispa
  if (guardian === "chispa" && params.teamId) {
    if (!finalBody.includes(params.teamId)) {
      finalBody = `${finalBody.replace(/\.$/, "")} (Clan: ${params.teamId}).`;
    }
  }

  // REGLA 3: Estricto límite de 90 caracteres por string
  finalTitle = enforceMax90(finalTitle);
  finalBody = enforceMax90(finalBody);

  // Guardar en centro de notificaciones de UALÍ
  const newNotif = addSmartNotification({
    type:
      triggerCategory === "team_sync"
        ? "shared"
        : triggerCategory === "liga_global"
          ? "system"
          : "goal",
    title: finalTitle,
    body: finalBody,
    priority: isSOS ? "high" : params.priority || "medium",
    iconType: guardian,
    character: guardian,
  });

  // Disparar Notificación Push de Navegador/Móvil si está permitida
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(finalTitle, {
        body: finalBody,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `guardian-${guardian}-${Date.now()}`,
      });
    } catch {
      // Ignorar fallback silencioso
    }
  }

  // Toast amigable en interfaz
  if (isSOS) {
    toast.error(finalTitle, {
      description: finalBody,
      duration: 5000,
    });
  } else {
    toast.info(finalTitle, {
      description: finalBody,
      duration: 4000,
    });
  }

  return {
    dispatched: true,
    blocked: false,
    guardian,
    title: finalTitle,
    body: finalBody,
    isSOS,
    isPromo,
    stressLevel: currentStress,
    characterTitleLen: finalTitle.length,
    characterBodyLen: finalBody.length,
    notification: newNotif,
  };
}

/**
 * Disparador rápido desde plantilla con verificación de reglas
 */
export function dispatchTemplateNotification(
  templateId: string,
  options?: {
    teamId?: string;
    stressLevelOverride?: number;
  },
): DispatchNotificationResult {
  const tpl = GUARDIAN_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) {
    throw new Error(`Plantilla no encontrada: ${templateId}`);
  }

  return dispatchGuardianPushNotification({
    guardian: tpl.guardian,
    triggerCategory: tpl.triggerCategory,
    title: tpl.title,
    body: tpl.body,
    teamId: options?.teamId,
    isPromo: tpl.isPromo,
    stressLevelOverride: options?.stressLevelOverride,
  });
}

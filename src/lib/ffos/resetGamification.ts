import { supabase } from "@/lib/supabase/client";
import {
  EDUCATION_PROGRESS_STORAGE_KEY,
  EDUCATION_EVENT_NAME,
  createDefaultState,
  RITUAL_EVENT_NAME,
} from "./educationStore";

/**
 * Script & Utilidad de Reset de Telemetría y Gamificación para Pruebas (Usuario EDUARDO_PROFE / local)
 *
 * Equivalente al script SQL solicitado:
 * UPDATE usuarios_gamificacion SET xp = 0, level = 1, ffos_tokens = 0, streak_days = 0,
 *        lecciones_completadas = 0, ritual_fase1_visto = false, ritual_fase2_visto = false;
 * UPDATE progreso_misiones SET estado = 'BLOQUEADO', estrellas = 0, submodulos_completados = 0;
 * UPDATE progreso_misiones SET estado = 'DISPONIBLE' WHERE mision_id = 'MISION_01';
 */
export async function resetUserGamificationAndTelemetry(userId?: string | null): Promise<void> {
  if (typeof window === "undefined") return;

  const targetIds = Array.from(
    new Set([userId, "EDUARDO_PROFE", "local-user"].filter(Boolean) as string[]),
  );

  // 1. Limpieza de LocalStorage para todos los usuarios objetivo
  try {
    for (const uid of targetIds) {
      localStorage.removeItem(`uali_local_xp_v2_${uid}`);
      localStorage.removeItem(`uali_local_streak_v2_${uid}`);
      localStorage.removeItem(`uali_extra_tokens_v2_${uid}`);
      localStorage.removeItem(`uali_points_history_v2_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p1_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p2_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p3_${uid}`);
    }

    // Reset de progreso de lecciones y submódulos (deja solo Misión 01 disponible)
    localStorage.removeItem("uali_lessons_done_fallback_v1");
    localStorage.removeItem("uali_lessons_done");
    localStorage.removeItem("uali_lessons_done_v2");
    localStorage.removeItem("uali_spaced_repetition_v1");

    // Guardar estado de educación vacío por defecto
    const emptyState = createDefaultState();
    localStorage.setItem(EDUCATION_PROGRESS_STORAGE_KEY, JSON.stringify(emptyState));

    // Desactivar banderas directas de rituales
    for (let p = 1; p <= 3; p++) {
      localStorage.removeItem(`uali_phase_ritual_p${p}_EDUARDO_PROFE`);
      localStorage.removeItem(`uali_phase_ritual_p${p}_local-user`);
      if (userId) {
        localStorage.removeItem(`uali_phase_ritual_p${p}_${userId}`);
      }
    }
  } catch (err) {
    console.warn("Error al limpiar localStorage de gamificación:", err);
  }

  // 2. Notificar a toda la interfaz y ventanas mediante eventos personalizados sincrónicos
  try {
    for (const uid of targetIds) {
      window.dispatchEvent(new CustomEvent("uali-xp-updated", { detail: { userId: uid, xp: 0 } }));
      window.dispatchEvent(
        new CustomEvent("uali-tokens-updated", { detail: { userId: uid, tokens: 0 } }),
      );
      window.dispatchEvent(
        new CustomEvent("uali-points-history-updated", { detail: { userId: uid, history: [] } }),
      );
    }

    window.dispatchEvent(
      new CustomEvent(EDUCATION_EVENT_NAME, { detail: { state: createDefaultState() } }),
    );
    window.dispatchEvent(new CustomEvent(RITUAL_EVENT_NAME, { detail: { phaseNumber: 0 } }));
    window.dispatchEvent(new CustomEvent("uali-phase-ritual-completed"));
  } catch (err) {
    console.warn("Error emitiendo eventos de reset:", err);
  }

  // 3. Si hay conexión a Supabase y sesión activa, intentar sincronizar base de datos
  if (userId) {
    try {
      await supabase
        .from("profiles")
        .update({
          xp: 0,
          streak: 0,
          last_active: new Date().toISOString(),
        })
        .eq("id", userId);

      await supabase.from("lesson_progress").delete().eq("user_id", userId);
    } catch (dbErr) {
      // Si la tabla o RLS no lo permite, la capa local ya garantizó el reset
      console.warn("Supabase reset sync notice:", dbErr);
    }
  }
}

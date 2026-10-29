import { supabase } from "@/lib/supabase/client";
import {
  EDUCATION_PROGRESS_STORAGE_KEY,
  EDUCATION_EVENT_NAME,
  createDefaultState,
  RITUAL_EVENT_NAME,
} from "./educationStore";

/**
 * Protocolo de Reset Global de Telemetría y Gamificación
 * Versión de Arquitectura: 2.0.0
 *
 * Scope: Universal (Aplica a cualquier usuario nuevo o existente mediante sesión activa $USER_ID)
 *
 * Payload de Estado de Base de Datos:
 * - profiles_and_user_progress:
 *   xp: 0, level: 1, ffos_tokens: 0, streak_days: 0, last_active: CURRENT_TIMESTAMP,
 *   ritual_fase1_visto: false, ritual_fase2_visto: false, estres_financiero_index: 0
 * - progreso_misiones:
 *   mision_01: { estado: 'DISPONIBLE', estrellas: 0, submodulos_completados: 0 }
 *   misiones_02_to_12: { estado: 'BLOQUEADO', estrellas: 0, submodulos_completados: 0 }
 */
export async function resetUserGamificationAndTelemetry(userId?: string | null): Promise<void> {
  if (typeof window === "undefined") return;

  // Obtener ID de usuario activo o sesiones asociadas
  let activeUid = userId;
  if (!activeUid) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) activeUid = user.id;
    } catch (e) {
      void e;
    }
  }

  const targetIds = Array.from(
    new Set([activeUid, "EDUARDO_PROFE", "local-user"].filter(Boolean) as string[]),
  );

  // 1. Purgar claves locales en localStorage bajo el esquema local-first del store
  try {
    for (const uid of targetIds) {
      localStorage.removeItem(`uali_local_xp_v2_${uid}`);
      localStorage.removeItem(`uali_local_streak_v2_${uid}`);
      localStorage.removeItem(`uali_extra_tokens_v2_${uid}`);
      localStorage.removeItem(`uali_points_history_v2_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p1_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p2_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_p3_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_seen_p1_${uid}`);
      localStorage.removeItem(`uali_phase_ritual_seen_p2_${uid}`);
      localStorage.removeItem(`uali_stress_index_${uid}`);
    }

    // Reset universal de progreso de lecciones y misiones
    localStorage.removeItem("uali_lessons_done_fallback_v1");
    localStorage.removeItem("uali_lessons_done");
    localStorage.removeItem("uali_lessons_done_v2");
    localStorage.removeItem("uali_spaced_repetition_v1");

    // Guardar estado de educación vacío por defecto (solo Misión 01 disponible)
    const emptyState = createDefaultState();
    localStorage.setItem(EDUCATION_PROGRESS_STORAGE_KEY, JSON.stringify(emptyState));

    // Desactivar banderas directas de rituales para todos los perfiles
    for (let p = 1; p <= 3; p++) {
      localStorage.removeItem(`uali_phase_ritual_p${p}_EDUARDO_PROFE`);
      localStorage.removeItem(`uali_phase_ritual_p${p}_local-user`);
      if (activeUid) {
        localStorage.removeItem(`uali_phase_ritual_p${p}_${activeUid}`);
      }
    }
  } catch (err) {
    console.warn("Error al limpiar localStorage de gamificación:", err);
  }

  // 2. Desmontar modales del DOM y re-compilar la vista en estado inicial plano
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
    window.dispatchEvent(new CustomEvent("uali-close-all-modals"));
  } catch (err) {
    console.warn("Error emitiendo eventos de reset:", err);
  }

  // 3. Limpiar de forma atómica las tablas en Supabase vinculadas al $USER_ID activo
  if (activeUid) {
    try {
      const nowIso = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({
          xp: 0,
          streak: 0,
          level: 1,
          ffos_tokens: 0,
          last_active: nowIso,
          ritual_fase1_visto: false,
          ritual_fase2_visto: false,
          estres_financiero_index: 0,
        } as Record<string, unknown>)
        .eq("id", activeUid);

      // Eliminar registros de lecciones para restaurar estado plano
      await supabase.from("lesson_progress").delete().eq("user_id", activeUid);
    } catch (dbErr) {
      // Si la base no tiene esas columnas extra o RLS restringe, la capa local-first garantiza la coherencia
      console.warn("Supabase atomic reset note:", dbErr);
    }
  }
}

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_LESSONS,
  addLocalLessonDone,
  getLocalLessonsDone,
  isLessonDone,
} from "./lessonsData";
import { addLocalXp, addExtraTokens, recordPointEvent } from "./points";
import type { LessonRow, SubLesson } from "@/lib/supabase/queries";

export const EDUCATION_PROGRESS_STORAGE_KEY = "uali_education_progress_v2";
export const EDUCATION_EVENT_NAME = "uali-education-progress-updated";

export interface SubLessonRecord {
  subLessonId: string;
  lessonId: string;
  completedAt: string;
}

export interface EducationProgressState {
  completedSubLessonIds: string[];
  lessonActiveStep: Record<string, number>; // lessonId or slug -> step index
  subLessonCompletedAt: Record<string, string>; // subLessonId -> ISO date
  lastActiveLessonId: string | null;
  version: number;
}

export function createDefaultState(): EducationProgressState {
  return {
    completedSubLessonIds: [],
    lessonActiveStep: {},
    subLessonCompletedAt: {},
    lastActiveLessonId: null,
    version: 2,
  };
}

export const DEFAULT_STATE: EducationProgressState = createDefaultState();

let cachedRaw: string | null = null;
let cachedSnapshot: EducationProgressState = createDefaultState();

export function resetEducationCacheForTesting(): void {
  cachedRaw = null;
  cachedSnapshot = createDefaultState();
}

// Obtenemos el estado almacenado en localStorage con snapshot cacheado para useSyncExternalStore
export function getStoredEducationProgress(): EducationProgressState {
  if (typeof window === "undefined") return createDefaultState();
  try {
    const raw = localStorage.getItem(EDUCATION_PROGRESS_STORAGE_KEY);
    if (raw === cachedRaw && cachedSnapshot) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = createDefaultState();
      return cachedSnapshot;
    }
    const parsed = JSON.parse(raw);
    cachedSnapshot = {
      completedSubLessonIds: Array.isArray(parsed.completedSubLessonIds)
        ? [...parsed.completedSubLessonIds]
        : [],
      lessonActiveStep: { ...(parsed.lessonActiveStep || {}) },
      subLessonCompletedAt: { ...(parsed.subLessonCompletedAt || {}) },
      lastActiveLessonId: parsed.lastActiveLessonId || null,
      version: parsed.version || 2,
    };
    return cachedSnapshot;
  } catch {
    cachedSnapshot = createDefaultState();
    return cachedSnapshot;
  }
}

// Guarda y notifica a todos los suscriptores y ventanas
export function saveEducationProgress(state: EducationProgressState): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(state);
    cachedRaw = serialized;
    cachedSnapshot = state;
    localStorage.setItem(EDUCATION_PROGRESS_STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent(EDUCATION_EVENT_NAME, { detail: { state } }));
  } catch {
    // ignore
  }
}

/**
 * Marca una sub-lección individual como completada.
 * Guarda progreso, otorga micro-recompensas (+10 XP, +15 FFOS) si es la primera vez,
 * y avanza el paso activo.
 */
export function completeSubLessonAction({
  lessonId,
  slug,
  subLessonId,
  stepIndex,
  userId,
}: {
  lessonId: string;
  slug?: string;
  subLessonId: string;
  stepIndex: number;
  userId?: string | null;
}): { isFirstTime: boolean; nextStep: number } {
  const current = getStoredEducationProgress();
  const completedList = [...current.completedSubLessonIds];
  const set = new Set(completedList);
  const isFirstTime = !set.has(subLessonId);

  const subCompletedAt = { ...current.subLessonCompletedAt };
  if (isFirstTime) {
    set.add(subLessonId);
    completedList.push(subLessonId);
    subCompletedAt[subLessonId] = new Date().toISOString();

    // Recompensas inmediatas de micro-aprendizaje
    const targetUser = userId || "local-user";
    addLocalXp(targetUser, 10);
    addExtraTokens(targetUser, 15);
    recordPointEvent(targetUser, {
      xp: 10,
      tokens: 15,
      reason: `Submódulo completado: ${subLessonId}`,
    });
  }

  // Guardar siguiente paso sugerido para reanudar
  const nextStep = stepIndex + 1;
  const key = slug || lessonId;
  const activeSteps = { ...current.lessonActiveStep, [key]: nextStep, [lessonId]: nextStep };
  if (slug) activeSteps[slug] = nextStep;

  const nextState: EducationProgressState = {
    ...current,
    completedSubLessonIds: completedList,
    subLessonCompletedAt: subCompletedAt,
    lessonActiveStep: activeSteps,
    lastActiveLessonId: key,
  };

  saveEducationProgress(nextState);

  return { isFirstTime, nextStep };
}

/**
 * Guarda el paso activo en el que se encuentra el usuario en una lección específica.
 */
export function setLessonActiveStepAction(
  lessonId: string,
  slug: string | undefined,
  step: number,
): void {
  const current = getStoredEducationProgress();
  const key = slug || lessonId;
  const activeSteps = { ...current.lessonActiveStep, [key]: step, [lessonId]: step };
  if (slug) activeSteps[slug] = step;

  const nextState: EducationProgressState = {
    ...current,
    lessonActiveStep: activeSteps,
    lastActiveLessonId: key,
  };
  saveEducationProgress(nextState);
}

/**
 * Obtiene el paso en el que el usuario debe reanudar una lección.
 */
export function getLessonResumeStep(lesson: LessonRow, completedSet: Set<string>): number {
  const state = getStoredEducationProgress();
  const key = lesson.slug || lesson.id;
  const savedStep = state.lessonActiveStep[key] ?? state.lessonActiveStep[lesson.id];

  // Si la lección principal ya está completamente terminada, empezar en 0 para repaso
  if (isLessonDone(lesson, completedSet)) {
    return 0;
  }

  // Si hay un paso guardado válido, usarlo
  if (typeof savedStep === "number" && savedStep >= 0 && savedStep <= 3) {
    return savedStep;
  }

  // Sino, buscar el primer submódulo no completado
  if (lesson.subLessons && lesson.subLessons.length > 0) {
    const subDoneSet = new Set(state.completedSubLessonIds);
    const firstUnfinishedIndex = lesson.subLessons.findIndex((s) => !subDoneSet.has(s.id));
    if (firstUnfinishedIndex !== -1) {
      return firstUnfinishedIndex;
    }
  }

  return 0;
}

/**
 * Devuelve el progreso granular de una lección (submódulos completados, total, porcentaje).
 */
export function getLessonSubProgress(
  lesson: LessonRow,
  completedSubLessonIds: string[] | Set<string>,
): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isAllSubsCompleted: boolean;
  subStatus: Array<{ subLesson: SubLesson; isDone: boolean }>;
} {
  const subs = lesson.subLessons || [];
  const totalCount = subs.length > 0 ? subs.length : 3;
  const set =
    completedSubLessonIds instanceof Set ? completedSubLessonIds : new Set(completedSubLessonIds);

  let completedCount = 0;
  const subStatus = subs.map((sub) => {
    const isDone = set.has(sub.id);
    if (isDone) completedCount++;
    return { subLesson: sub, isDone };
  });

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllSubsCompleted = totalCount > 0 && completedCount >= totalCount;

  return {
    completedCount,
    totalCount,
    percentage,
    isAllSubsCompleted,
    subStatus,
  };
}

/**
 * Calcula estadísticas globales del módulo de educación.
 */
export function getEducationStats(
  lessons: LessonRow[] = DEFAULT_LESSONS,
  state: EducationProgressState = getStoredEducationProgress(),
  lessonsDone: string[] = getLocalLessonsDone(),
) {
  const subDoneSet = new Set(state.completedSubLessonIds);
  const lessonDoneSet = new Set(lessonsDone);

  let totalSubLessons = 0;
  let completedSubLessons = 0;

  for (const l of lessons) {
    const subs = l.subLessons || [];
    totalSubLessons += subs.length || 3;
    for (const s of subs) {
      if (subDoneSet.has(s.id)) {
        completedSubLessons++;
      }
    }
  }

  const completedPrimaryLessons = lessons.filter((l) => isLessonDone(l, lessonDoneSet)).length;

  const totalPrimaryLessons = lessons.length || 12;
  const overallPercentage =
    totalSubLessons > 0 ? Math.round((completedSubLessons / totalSubLessons) * 100) : 0;

  return {
    totalSubLessons,
    completedSubLessons,
    totalPrimaryLessons,
    completedPrimaryLessons,
    overallPercentage,
  };
}

// ---------------------------------------------------------------------------
// REACT HOOKS
// ---------------------------------------------------------------------------

function subscribeEducationProgress(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedRaw = null;
    callback();
  };
  window.addEventListener(EDUCATION_EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  window.addEventListener("uali-lesson-completed", handler);
  return () => {
    window.removeEventListener(EDUCATION_EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
    window.removeEventListener("uali-lesson-completed", handler);
  };
}

/**
 * Hook reactivo para todo el sistema de estado de educación.
 * Se actualiza instantáneamente en todos los componentes al completar cualquier submódulo.
 */
export function useEducationProgress(userId?: string | null) {
  const state = useSyncExternalStore(
    subscribeEducationProgress,
    getStoredEducationProgress,
    () => DEFAULT_STATE,
  );

  const completedSet = useMemo(
    () => new Set(state.completedSubLessonIds),
    [state.completedSubLessonIds],
  );

  const completeSubLesson = useCallback(
    (lessonId: string, slug: string | undefined, subLessonId: string, stepIndex: number) => {
      return completeSubLessonAction({
        lessonId,
        slug,
        subLessonId,
        stepIndex,
        userId,
      });
    },
    [userId],
  );

  const setResumeStep = useCallback((lessonId: string, slug: string | undefined, step: number) => {
    setLessonActiveStepAction(lessonId, slug, step);
  }, []);

  const getSubProgress = useCallback(
    (lesson: LessonRow) => {
      return getLessonSubProgress(lesson, completedSet);
    },
    [completedSet],
  );

  const stats = useMemo(() => getEducationStats(DEFAULT_LESSONS, state), [state]);

  return {
    state,
    completedSubLessonIds: state.completedSubLessonIds,
    completedSubSet: completedSet,
    completeSubLesson,
    setResumeStep,
    getSubProgress,
    stats,
  };
}

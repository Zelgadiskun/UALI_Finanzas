import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useCompleteLessonMutation } from "@/lib/supabase/mutations";
import { type ConfidenceLevel, getSpacedReview, recordSpacedReview } from "@/lib/ffos/lessonsData";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { useEducationProgress, getLessonResumeStep } from "@/lib/ffos/educationStore";
import type { LessonRow } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export function LessonSheet({
  lesson,
  done,
  onClose,
}: {
  lesson: LessonRow;
  done: boolean;
  onClose: () => void;
}) {
  const { completedSubSet, completeSubLesson, setResumeStep } = useEducationProgress();

  const subLessons =
    lesson.subLessons && lesson.subLessons.length > 0
      ? lesson.subLessons
      : [
          {
            id: `${lesson.id}-sub1`,
            title: "1. Concepto Fundamental",
            subtitle: "La regla de oro para tu dinero",
            concept: lesson.body,
            practicalExample:
              "Aplica este concepto separando el dinero al inicio del mes y revisando tus cuentas semanalmente.",
            guardianTip: {
              character: "Toto" as const,
              tip: "Un pequeño hábito hoy previene grandes dolores de cabeza mañana.",
            },
            keyTakeaway: "La claridad y la constancia construyen tranquilidad financiera.",
          },
        ];

  // Steps: 0..N-1 = Sublecciones, N = Quiz interactivo, N+1 = Repaso / Celebración
  // Reanuda inteligentemente en el último submódulo pendiente o guardado
  const [activeStep, setActiveStep] = useState<number>(() => {
    return getLessonResumeStep(
      lesson,
      new Set(done ? ([lesson.id, lesson.slug].filter(Boolean) as string[]) : []),
    );
  });

  const [picked, setPicked] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const completeMutation = useCompleteLessonMutation();
  const spacedInfo =
    getSpacedReview(lesson.id) || (lesson.slug ? getSpacedReview(lesson.slug) : null);

  const currentSub = subLessons[Math.min(activeStep, subLessons.length - 1)];

  // Guardar posición de reanudación al cambiar de paso
  function changeStep(newStep: number) {
    setActiveStep(newStep);
    setResumeStep(lesson.id, lesson.slug, newStep);
  }

  // Avanzar de sub-lección marcando la actual como completada en el state system
  function handleAdvanceSubLesson() {
    if (activeStep < subLessons.length) {
      const current = subLessons[activeStep];
      if (current) {
        const { isFirstTime } = completeSubLesson(lesson.id, lesson.slug, current.id, activeStep);
        if (isFirstTime) {
          toast.success("¡Submódulo completado! ✨", {
            description: "+10 XP y +15 Puntos FFOS añadidos a tu cuenta.",
          });
        }
      }
    }
    changeStep(activeStep + 1);
  }

  async function handleAnswer(i: number) {
    if (picked !== null && picked === lesson.answer) return;
    setPicked(i);
    if (i !== lesson.answer) return;

    setIsSubmitting(true);
    try {
      // Marcar también el último submódulo como completado
      if (currentSub) {
        completeSubLesson(lesson.id, lesson.slug, currentSub.id, activeStep);
      }

      if (!done) {
        const event = await completeMutation.mutateAsync({
          lessonId: lesson.id,
          slug: lesson.slug,
          xp: lesson.xp,
        });
        toast.success("¡Lección primaria completada! ⭐⭐⭐", {
          description: `+${event.xp || lesson.xp} XP y +50 Puntos FFOS asignados a tu cuenta.`,
        });
        if (event.levelUp) {
          toast.success("¡Subiste de nivel! 🎉 Gran explorador financiero.");
        }
      }
      setTimeout(() => {
        changeStep(subLessons.length + 1); // Confidence screen
        setIsSubmitting(false);
      }, 700);
    } catch {
      setIsSubmitting(false);
      changeStep(subLessons.length + 1);
    }
  }

  function handleConfidence(level: ConfidenceLevel) {
    const updated = recordSpacedReview(lesson.id, level);
    if (lesson.slug) recordSpacedReview(lesson.slug, level);
    toast.success("Repetición espaciada programada", {
      description: `Próximo repaso en ${updated.intervalDays} ${updated.intervalDays === 1 ? "día" : "días"}.`,
    });
    onClose();
  }

  return (
    <BottomSheet open onClose={onClose} title={lesson.title}>
      <div className="space-y-4 pb-3">
        {/* Progress Stepper Pills con estado individual */}
        <div className="flex items-center justify-between gap-1.5 pb-1">
          <div className="flex items-center gap-1.5 flex-1">
            {subLessons.map((sub, idx) => {
              const isSubDone = completedSubSet.has(sub.id) || done;
              const isCurrent = activeStep === idx;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => changeStep(idx)}
                  className={cn(
                    "flex-1 h-2.5 rounded-full transition-all relative flex items-center justify-center",
                    isSubDone
                      ? "bg-emerald-500 shadow-xs"
                      : isCurrent
                        ? "bg-amber-400 ring-2 ring-amber-400/40"
                        : "bg-secondary border border-border/60",
                  )}
                  title={`Submódulo ${idx + 1}: ${sub.title} ${isSubDone ? "(Completado)" : ""}`}
                />
              );
            })}
            {/* Quiz step pill */}
            <button
              type="button"
              onClick={() => changeStep(subLessons.length)}
              className={cn(
                "flex-1 h-2.5 rounded-full transition-all",
                done || activeStep > subLessons.length
                  ? "bg-emerald-500 shadow-xs"
                  : activeStep === subLessons.length
                    ? "bg-amber-400 ring-2 ring-amber-400/40"
                    : "bg-secondary border border-border/60",
              )}
              title="Quiz interactivo"
            />
          </div>

          <span className="text-[11px] font-bold text-muted-foreground shrink-0 pl-1">
            {activeStep < subLessons.length ? (
              <span className="flex items-center gap-1">
                <span>
                  Submódulo {activeStep + 1}/{subLessons.length}
                </span>
                {completedSubSet.has(currentSub.id) && (
                  <span className="text-emerald-400 font-extrabold text-[10px]">✓</span>
                )}
              </span>
            ) : activeStep === subLessons.length ? (
              "Quiz final"
            ) : (
              "¡Dominada!"
            )}
          </span>
        </div>

        {/* 1. VISTA DE SUB-LECCIONES (0 a subLessons.length - 1) */}
        {activeStep < subLessons.length && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Sub-lesson Title Header con Status Pill */}
            <div className="rounded-2xl bg-secondary/40 border border-border/80 p-3.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-wider uppercase text-amber-400">
                  Submódulo {activeStep + 1} de {subLessons.length}
                </span>
                <h3 className="text-base font-extrabold text-foreground mt-0.5">
                  {currentSub.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{currentSub.subtitle}</p>
              </div>

              {completedSubSet.has(currentSub.id) ? (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  Completado
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-black text-[10px] border border-amber-500/30">
                  En curso
                </span>
              )}
            </div>

            {/* Concepto Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <BookOpen className="size-4" />
                <span>Concepto Clave</span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground">{currentSub.concept}</p>
            </div>

            {/* Caso Práctico Real */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Lightbulb className="size-4" />
                <span>En la vida real</span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-200">
                {currentSub.practicalExample}
              </p>
            </div>

            {/* Guardian Tip Card */}
            {currentSub.guardianTip && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#1E2034] to-purple-500/10 p-3.5 flex items-center gap-3">
                <div className="shrink-0 size-12 flex items-center justify-center">
                  {currentSub.guardianTip.character === "Toto" && (
                    <TotoCharacter className="size-11" />
                  )}
                  {currentSub.guardianTip.character === "Nido" && (
                    <NidoCharacter className="size-11" />
                  )}
                  {currentSub.guardianTip.character === "Chispa" && (
                    <ChispaCharacter className="size-11" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-300">
                    Consejo de {currentSub.guardianTip.character}
                  </span>
                  <p className="text-xs text-foreground mt-0.5 leading-snug font-medium">
                    "{currentSub.guardianTip.tip}"
                  </p>
                </div>
              </div>
            )}

            {/* Regla de Oro / Key Takeaway */}
            <div className="rounded-xl bg-secondary/60 border border-border/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-2">
              <Star className="size-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span>{currentSub.keyTakeaway}</span>
            </div>

            {/* Action Navigation Buttons */}
            <div className="flex gap-2 pt-2">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => changeStep(activeStep - 1)}
                  className="h-11 px-3.5 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary flex items-center gap-1.5 transition active:scale-95"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAdvanceSubLesson}
                className="btn-3d flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-extrabold text-primary-foreground shadow-md transition active:scale-95"
              >
                <span>
                  {activeStep === subLessons.length - 1
                    ? "¡Completar submódulo e ir al Quiz! (+50 FFOS)"
                    : `Completar y ver Submódulo ${activeStep + 2} →`}
                </span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. VISTA DE QUIZ (activeStep === subLessons.length) */}
        {activeStep === subLessons.length && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl bg-secondary/40 border border-border/80 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span className="text-xs font-extrabold text-foreground">
                  Desafío Final de la Lección
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                +{lesson.xp || 25} XP • +50 FFOS
              </span>
            </div>

            <p className="font-display text-sm font-bold text-foreground leading-snug">
              {lesson.question}
            </p>

            <ul className="space-y-2">
              {lesson.options.map((option, i) => {
                const isPicked = picked === i;
                const correct = i === lesson.answer;
                return (
                  <li key={option}>
                    <button
                      onClick={() => handleAnswer(i)}
                      disabled={isSubmitting || (picked !== null && correct === false && !isPicked)}
                      className={cn(
                        "w-full rounded-2xl border p-3.5 text-left text-xs font-semibold transition-all flex items-center justify-between gap-2",
                        isPicked &&
                          correct &&
                          "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold",
                        isPicked && !correct && "border-red-500 bg-red-500/15 text-red-300",
                        !isPicked && "border-border bg-card hover:bg-secondary/50",
                      )}
                    >
                      <span>{option}</span>
                      {isPicked && correct && (
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {picked !== null && picked !== lesson.answer && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-2">
                <HelpCircle className="size-4 shrink-0 text-red-400" />
                <span>No es esa opción. ¡Revisa los conceptos y vuelve a intentarlo!</span>
              </div>
            )}

            <button
              onClick={() => changeStep(0)}
              type="button"
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 pt-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver a leer las sub-lecciones</span>
            </button>
          </div>
        )}

        {/* 3. VISTA DE CONFIANZA / REPASO ESPACIADO */}
        {activeStep > subLessons.length && (
          <div className="space-y-4 pb-2 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg">
              <CheckCircle2 className="size-8" />
            </div>

            <div>
              <div className="flex justify-center gap-1 mb-1">
                <Star className="size-4 text-amber-400 fill-amber-400" />
                <Star className="size-4 text-amber-400 fill-amber-400" />
                <Star className="size-4 text-amber-400 fill-amber-400" />
              </div>
              <h3 className="font-display text-base font-extrabold text-foreground">
                ¡Lección Dominada con Éxito!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Todos los submódulos completados y guardados. ¿Qué tan fácil te resultó este tema?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleConfidence("dificil")}
                type="button"
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-center transition-all hover:bg-red-500/20 active:scale-95"
              >
                <span className="block text-base">🔴</span>
                <span className="mt-1 block text-xs font-extrabold text-red-400">Me costó</span>
                <span className="block text-[10px] text-muted-foreground">Repasar mañana</span>
              </button>

              <button
                onClick={() => handleConfidence("bien")}
                type="button"
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center transition-all hover:bg-amber-500/20 active:scale-95"
              >
                <span className="block text-base">🟡</span>
                <span className="mt-1 block text-xs font-extrabold text-amber-400">Bien</span>
                <span className="block text-[10px] text-muted-foreground">En 2-3 días</span>
              </button>

              <button
                onClick={() => handleConfidence("facil")}
                type="button"
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center transition-all hover:bg-emerald-500/20 active:scale-95"
              >
                <span className="block text-base">🟢</span>
                <span className="mt-1 block text-xs font-extrabold text-emerald-400">Fácil</span>
                <span className="block text-[10px] text-muted-foreground">En 1 semana</span>
              </button>
            </div>

            {spacedInfo && (
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground mt-2">
                <RotateCcw className="size-3 text-primary" />
                <span>Historial: Repasada {spacedInfo.repetitionCount} veces</span>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

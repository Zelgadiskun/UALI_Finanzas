import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useCompleteLessonMutation } from "@/lib/supabase/mutations";
import { type ConfidenceLevel, getSpacedReview, recordSpacedReview } from "@/lib/ffos/lessonsData";
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
  const [step, setStep] = useState<"read" | "quiz" | "confidence">("read");
  const [picked, setPicked] = useState<number | null>(null);
  const completeMutation = useCompleteLessonMutation();
  const spacedInfo = getSpacedReview(lesson.id);

  async function handleAnswer(i: number) {
    setPicked(i);
    if (i !== lesson.answer) return;

    if (!done) {
      try {
        const event = await completeMutation.mutateAsync({
          lessonId: lesson.id,
          xp: lesson.xp,
        });
        toast.success("¡Lección completada!", {
          description: `+${event.xp || lesson.xp} XP ganados`,
        });
        if (event.levelUp) toast.success("¡Subiste de nivel! 🎉");
      } catch {
        toast.error("No se pudo guardar la lección. Probá de nuevo.");
      }
      setTimeout(() => setStep("confidence"), 600);
    } else {
      setTimeout(() => setStep("confidence"), 600);
    }
  }

  function handleConfidence(level: ConfidenceLevel) {
    const updated = recordSpacedReview(lesson.id, level);
    toast.success("Repetición espaciada actualizada", {
      description: `Próximo repaso en ${updated.intervalDays} ${updated.intervalDays === 1 ? "día" : "días"}.`,
    });
    onClose();
  }

  return (
    <BottomSheet open onClose={onClose} title={lesson.title}>
      {step === "read" && (
        <div className="space-y-4 pb-2">
          <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
            <p className="text-sm leading-relaxed text-foreground">{lesson.body}</p>
          </div>

          {done && spacedInfo && (
            <div className="flex items-center gap-2 rounded-xl bg-primary-soft/50 px-3 py-2 text-[12px] font-medium text-primary">
              <RotateCcw className="size-3.5" />
              <span>
                Repasada {spacedInfo.repetitionCount}{" "}
                {spacedInfo.repetitionCount === 1 ? "vez" : "veces"} · Próximo repaso:{" "}
                {new Date(spacedInfo.nextReviewAt).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {done ? (
              <>
                <button
                  onClick={onClose}
                  type="button"
                  className="h-11 flex-1 rounded-2xl border border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => setStep("quiz")}
                  type="button"
                  className="btn-3d flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary text-xs font-semibold text-primary-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Repasar con Quiz</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setStep("quiz")}
                type="button"
                className="btn-3d flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
              >
                <span>¡Entendido! Hacer el quiz</span>
                <Sparkles className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {step === "quiz" && (
        <div className="space-y-4 pb-2">
          <p className="font-display text-base font-bold text-foreground">{lesson.question}</p>
          <ul className="space-y-2">
            {lesson.options.map((option, i) => {
              const isPicked = picked === i;
              const correct = i === lesson.answer;
              return (
                <li key={option}>
                  <button
                    onClick={() => handleAnswer(i)}
                    disabled={picked !== null && correct === false && !isPicked}
                    className={cn(
                      "w-full rounded-2xl border p-3.5 text-left text-sm font-medium transition-all",
                      isPicked &&
                        correct &&
                        "border-accent bg-accent-soft text-accent font-semibold",
                      isPicked && !correct && "border-danger bg-danger-soft text-danger",
                      !isPicked && "border-border bg-card hover:bg-secondary/40",
                    )}
                  >
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>

          {picked !== null && picked !== lesson.answer && (
            <p className="text-[12px] font-medium text-danger">
              No es esa opción. ¡Relee y vuelve a intentarlo!
            </p>
          )}

          <button
            onClick={() => setStep("read")}
            type="button"
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            ← Volver a leer la lección
          </button>
        </div>
      )}

      {step === "confidence" && (
        <div className="space-y-4 pb-2 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <CheckCircle2 className="size-7" />
          </div>

          <div>
            <h3 className="font-display text-base font-bold">¡Respuesta correcta!</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              ¿Qué tan fresco tenías este concepto en tu memoria?
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleConfidence("dificil")}
              type="button"
              className="rounded-2xl border border-danger/30 bg-danger-soft/60 p-3 text-center transition-all hover:bg-danger-soft active:scale-95"
            >
              <span className="block text-base">🔴</span>
              <span className="mt-1 block text-xs font-bold text-danger">Me costó</span>
              <span className="block text-[10px] text-muted-foreground">Mañana</span>
            </button>

            <button
              onClick={() => handleConfidence("bien")}
              type="button"
              className="rounded-2xl border border-warning/30 bg-warning-soft/60 p-3 text-center transition-all hover:bg-warning-soft active:scale-95"
            >
              <span className="block text-base">🟡</span>
              <span className="mt-1 block text-xs font-bold text-warning">Bien</span>
              <span className="block text-[10px] text-muted-foreground">En 2-3 días</span>
            </button>

            <button
              onClick={() => handleConfidence("facil")}
              type="button"
              className="rounded-2xl border border-accent/30 bg-accent-soft/60 p-3 text-center transition-all hover:bg-accent-soft active:scale-95"
            >
              <span className="block text-base">🟢</span>
              <span className="mt-1 block text-xs font-bold text-accent">Fácil</span>
              <span className="block text-[10px] text-muted-foreground">En 1 semana</span>
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

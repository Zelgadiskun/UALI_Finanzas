import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "./BottomSheet";
import { useCompleteLessonMutation } from "@/lib/supabase/mutations";
import type { LessonRow } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

/**
 * Enseñar antes de evaluar: primero el contenido, con un paso explícito
 * para avanzar, recién después la pregunta — nunca las dos cosas juntas en
 * la misma pantalla. Antes se mostraban body+pregunta a la vez, lo que en
 * la práctica dejaba adivinar sin leer.
 */
export function LessonSheet({
  lesson,
  done,
  onClose,
}: {
  lesson: LessonRow;
  done: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"read" | "quiz">("read");
  const [picked, setPicked] = useState<number | null>(null);
  const completeMutation = useCompleteLessonMutation();

  async function answer(i: number) {
    setPicked(i);
    if (i !== lesson.answer) return;
    if (!done) {
      try {
        const event = await completeMutation.mutateAsync({ lessonId: lesson.id });
        toast.success("Lección completada", { description: `+${event.xp} XP` });
        if (event.levelUp) toast.success("¡Subiste de nivel!");
      } catch {
        toast.error("No se pudo guardar la lección. Probá de nuevo.");
      }
    }
    setTimeout(onClose, 900);
  }

  return (
    <BottomSheet open onClose={onClose} title={lesson.title}>
      {step === "read" ? (
        <div className="space-y-4 pb-2">
          <p className="text-sm leading-relaxed text-muted-foreground">{lesson.body}</p>
          {done && (
            <p className="text-[12px] text-muted-foreground">
              Ya completaste esta lección — repasala las veces que quieras.
            </p>
          )}
          <button
            onClick={() => (done ? onClose() : setStep("quiz"))}
            className="btn-3d h-11 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            {done ? "Cerrar" : "Entendido, sigamos"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          <p className="text-sm font-semibold">{lesson.question}</p>
          <ul className="space-y-2">
            {lesson.options.map((o, i) => {
              const isPicked = picked === i;
              const correct = i === lesson.answer;
              return (
                <li key={o}>
                  <button
                    onClick={() => answer(i)}
                    disabled={picked !== null && correct === false && !isPicked}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left text-sm",
                      isPicked && correct && "border-accent bg-accent-soft",
                      isPicked && !correct && "border-danger bg-danger-soft",
                      !isPicked && "border-border",
                    )}
                  >
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
          {picked !== null && picked !== lesson.answer && (
            <p className="text-[12px] text-danger">No es esa. Volvé a leer y probá de nuevo.</p>
          )}
          <button
            onClick={() => setStep("read")}
            className="text-[12px] font-medium text-muted-foreground"
          >
            ← Volver a leer
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

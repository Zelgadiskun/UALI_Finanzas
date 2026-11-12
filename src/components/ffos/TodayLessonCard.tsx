import { BookOpen, ChevronRight } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import type { LessonRow } from "@/lib/supabase/queries";

/**
 * Antes, la única puerta a una lección era Inicio -> LevelBar -> hoja de
 * progreso -> scroll hasta "Ruta de aprendizaje" — tres pasos para algo que
 * se supone que enseña todos los días. Esto la pone al frente, en el mismo
 * lugar donde ya se mira el balance.
 *
 * El contador "X de Y" existe porque el progreso de aprendizaje era
 * invisible fuera de la propia lección — en una app que se vende como
 * educativa antes que financiera, eso no puede ser menos visible que el
 * balance.
 */
export function TodayLessonCard({
  lesson,
  completed,
  total,
  onOpen,
}: {
  lesson: LessonRow;
  completed: number;
  total: number;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-transform active:scale-[0.99]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-info-soft text-info">
        <BookOpen className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          Lección de hoy
        </p>
        <p className="truncate font-display text-base font-bold">{lesson.title}</p>
        {total > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <ProgressBar
              value={(completed / total) * 100}
              state="ok"
              height={4}
              className="max-w-24"
            />
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {completed} de {total}
            </span>
          </div>
        )}
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </button>
  );
}

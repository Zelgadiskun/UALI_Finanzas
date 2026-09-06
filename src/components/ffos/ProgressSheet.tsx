import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { ProgressBar } from "./ProgressBar";
import { LessonSheet } from "./LessonSheet";
import { ACHIEVEMENTS, levelInfo } from "@/lib/ffos/gamification";
import { useLessonsQuery, type LessonRow } from "@/lib/supabase/queries";
import type { Progress } from "@/lib/ffos/types";
import { cn } from "@/lib/utils";
import { Award, BookOpen, Check, Lock } from "lucide-react";

export function ProgressSheet({
  open,
  onClose,
  progress,
}: {
  open: boolean;
  onClose: () => void;
  progress: Progress;
}) {
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const info = levelInfo(progress.xp);
  const lessonsQuery = useLessonsQuery();
  const lessons = lessonsQuery.data ?? [];

  return (
    <>
      <BottomSheet open={open && !lesson} onClose={onClose} title="Tu progreso">
        <div className="space-y-5 pb-2">
          <section className="rounded-xl border border-border p-4">
            <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
              Nivel {info.level}
            </p>
            <p className="text-lg font-bold">{info.name}</p>
            <ProgressBar value={info.pct} state="ok" className="mt-3" />
            <p className="mt-2 text-[12px] text-muted-foreground">
              {progress.xp} XP acumulados
              {info.next ? ` · faltan ${info.xpToNext} para ${info.next.name}` : " · nivel máximo"}
            </p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <BookOpen className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Ruta de aprendizaje
            </h3>
            <ul className="space-y-2">
              {lessons.map((l) => {
                const done = progress.lessonsDone.includes(l.id);
                const locked = info.level < l.minLevel;
                return (
                  <li key={l.id}>
                    <button
                      disabled={locked}
                      onClick={() => setLesson(l)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left",
                        locked && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full",
                          done
                            ? "bg-accent-soft text-accent"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {locked ? (
                          <Lock className="size-4" strokeWidth={1.75} />
                        ) : done ? (
                          <Check className="size-4" strokeWidth={2} />
                        ) : (
                          <BookOpen className="size-4" strokeWidth={1.75} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{l.title}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {locked
                            ? `Se desbloquea en nivel ${l.minLevel}`
                            : done
                              ? "Completada"
                              : `30 segundos · +${l.xp} XP`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Award className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Logros
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const done = progress.achievements.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={cn("rounded-xl border border-border p-3", !done && "opacity-45")}
                  >
                    <p className="text-[13px] font-semibold">{a.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </BottomSheet>

      {lesson && (
        <LessonSheet
          lesson={lesson}
          done={progress.lessonsDone.includes(lesson.id)}
          onClose={() => setLesson(null)}
        />
      )}
    </>
  );
}

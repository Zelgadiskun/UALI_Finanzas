import { useState, useMemo } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { isLessonDueForReview, getSpacedReview } from "@/lib/ffos/lessonsData";
import type { LessonRow } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type Filter = "all" | "available" | "review" | "completed";

export function LearningPathSection({
  lessons,
  lessonsDone,
  userLevel,
  onOpenLesson,
}: {
  lessons: LessonRow[];
  lessonsDone: string[];
  userLevel: number;
  onOpenLesson: (lesson: LessonRow, isDone: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const completedSet = useMemo(() => new Set(lessonsDone), [lessonsDone]);

  const items = useMemo(() => {
    return lessons.map((l) => {
      const isDone = completedSet.has(l.id) || completedSet.has(l.slug);
      const isLocked = l.minLevel > userLevel;
      const isDue = isDone && isLessonDueForReview(l.id);
      const spaced = isDone ? getSpacedReview(l.id) : null;
      return {
        lesson: l,
        isDone,
        isLocked,
        isDue,
        spaced,
      };
    });
  }, [lessons, completedSet, userLevel]);

  const dueCount = useMemo(() => items.filter((i) => i.isDue).length, [items]);
  const availableCount = useMemo(
    () => items.filter((i) => !i.isDone && !i.isLocked).length,
    [items],
  );
  const completedCount = useMemo(() => items.filter((i) => i.isDone).length, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "available") return items.filter((i) => !i.isDone && !i.isLocked);
    if (filter === "review") return items.filter((i) => i.isDue);
    if (filter === "completed") return items.filter((i) => i.isDone);
    return items;
  }, [items, filter]);

  if (lessons.length === 0) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <BookOpen className="size-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold text-foreground">
                Ruta de Aprendizaje
              </h2>
              {dueCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
                  <RotateCcw className="size-3" />
                  {dueCount} {dueCount === 1 ? "repaso" : "repasos"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {completedCount} de {lessons.length} dominadas · Repetición espaciada
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          type="button"
          className="flex items-center gap-1 rounded-xl border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <span>{expanded ? "Menos" : "Ver todas"}</span>
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Progress mini bar */}
      <div className="mt-3">
        <ProgressBar value={(completedCount / lessons.length) * 100} height={6} state="ok" />
      </div>

      {/* Collapsed Preview or Expanded List */}
      {!expanded ? (
        <div className="mt-3 space-y-2">
          {filteredItems.slice(0, 2).map(({ lesson, isDone, isLocked, isDue }) => (
            <button
              key={lesson.id}
              onClick={() => !isLocked && onOpenLesson(lesson, isDone)}
              disabled={isLocked}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]",
                isDue && "border-warning/50 bg-warning-soft/20",
                !isDue && isDone && "border-border/60 bg-secondary/30",
                !isDone &&
                  !isLocked &&
                  "border-primary/30 bg-primary-soft/20 hover:bg-primary-soft/40",
                isLocked && "border-border/40 opacity-50",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-foreground">{lesson.title}</span>
                  {isDue && (
                    <span className="shrink-0 rounded-md bg-warning/20 px-1.5 py-0.5 text-[9px] font-extrabold text-warning">
                      ⚡ Repasar hoy
                    </span>
                  )}
                  {isDone && !isDue && (
                    <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent">
                      ✓ Dominada
                    </span>
                  )}
                  {!isDone && !isLocked && (
                    <span className="shrink-0 rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary">
                      +{lesson.xp} XP
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{lesson.body}</p>
              </div>

              <span className="shrink-0 text-xs font-bold text-primary">
                {isLocked ? (
                  <Lock className="size-4 text-muted-foreground" />
                ) : isDue ? (
                  "Repasar →"
                ) : isDone ? (
                  "Ver →"
                ) : (
                  "Aprender →"
                )}
              </span>
            </button>
          ))}
          {lessons.length > 2 && (
            <button
              onClick={() => setExpanded(true)}
              type="button"
              className="w-full text-center text-xs font-semibold text-primary hover:underline pt-1"
            >
              Explorar las {lessons.length} lecciones y repasos disponibles ↓
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => setFilter("all")}
              type="button"
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors",
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              Todas ({lessons.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              type="button"
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors",
                filter === "available"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              Nuevas ({availableCount})
            </button>
            <button
              onClick={() => setFilter("review")}
              type="button"
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors",
                filter === "review"
                  ? "bg-warning text-warning-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              ⚡ Por repasar ({dueCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              type="button"
              className={cn(
                "rounded-xl px-2.5 py-1 text-[11px] font-bold transition-colors",
                filter === "completed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              Completadas ({completedCount})
            </button>
          </div>

          {/* Expanded Lesson Cards */}
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {filteredItems.map(({ lesson, isDone, isLocked, isDue, spaced }) => (
              <button
                key={lesson.id}
                onClick={() => !isLocked && onOpenLesson(lesson, isDone)}
                disabled={isLocked}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]",
                  isDue && "border-warning/50 bg-warning-soft/20",
                  !isDue && isDone && "border-border/60 bg-secondary/30",
                  !isDone &&
                    !isLocked &&
                    "border-primary/30 bg-primary-soft/20 hover:bg-primary-soft/40",
                  isLocked && "border-border/40 opacity-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-foreground">
                      {lesson.title}
                    </span>
                    {isLocked && (
                      <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        Nivel {lesson.minLevel}
                      </span>
                    )}
                    {isDue && (
                      <span className="shrink-0 rounded-md bg-warning/20 px-1.5 py-0.5 text-[9px] font-extrabold text-warning">
                        ⚡ Toca repasar
                      </span>
                    )}
                    {isDone && !isDue && (
                      <span className="shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent">
                        ✓ Dominada
                      </span>
                    )}
                    {!isDone && !isLocked && (
                      <span className="shrink-0 rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        +{lesson.xp} XP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {lesson.body}
                  </p>
                  {spaced && (
                    <p className="mt-1 text-[10px] font-medium text-primary">
                      Repasada {spaced.repetitionCount}x · Intervalo: {spaced.intervalDays}d
                    </p>
                  )}
                </div>

                <div className="shrink-0 pl-2 text-right">
                  {isLocked ? (
                    <Lock className="size-4 text-muted-foreground" />
                  ) : isDue ? (
                    <span className="rounded-xl bg-warning px-2.5 py-1 text-[11px] font-bold text-warning-foreground shadow-xs">
                      Repasar
                    </span>
                  ) : isDone ? (
                    <span className="rounded-xl border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      Repasar
                    </span>
                  ) : (
                    <span className="btn-3d rounded-xl bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-xs">
                      Aprender
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

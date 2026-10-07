import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { ProgressBar } from "./ProgressBar";
import { LessonSheet } from "./LessonSheet";
import { ACHIEVEMENTS, levelInfo } from "@/lib/ffos/gamification";
import { useLessonsQuery, type LessonRow } from "@/lib/supabase/queries";
import { useUserPoints } from "@/lib/ffos/points";
import type { Progress } from "@/lib/ffos/types";
import { cn } from "@/lib/utils";
import { Award, BookOpen, Check, Lock, Sparkles, Flame, Clock } from "lucide-react";

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
  const lessonsQuery = useLessonsQuery();
  const lessons = lessonsQuery.data ?? [];
  const { ffosTokens, xp, streak, levelData, pointsHistory } = useUserPoints();

  return (
    <>
      <BottomSheet open={open && !lesson} onClose={onClose} title="Tu progreso & Puntos FFOS">
        <div className="space-y-4 pb-2">
          {/* Tarjeta de Puntos FFOS & Nivel */}
          <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Fichas Oficiales UALÍ
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-amber-300 font-sans tracking-tight">
                    {ffosTokens}
                  </span>
                  <span className="text-xs font-bold text-amber-400/80">Puntos FFOS</span>
                </div>
              </div>
              <div className="size-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-base shadow-xs">
                F
              </div>
            </div>

            {/* Desglose didáctico de cómo suman los puntos */}
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-border/60 text-center">
              <div className="p-1.5 rounded-xl bg-secondary/60">
                <span className="text-[9px] text-muted-foreground block font-medium">
                  XP (+50%)
                </span>
                <span className="text-xs font-black text-foreground">+{Math.round(xp * 0.5)}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-secondary/60">
                <span className="text-[9px] text-muted-foreground block font-medium">
                  Racha (+5)
                </span>
                <span className="text-xs font-black text-amber-400">+{streak * 5}</span>
              </div>
              <div className="p-1.5 rounded-xl bg-secondary/60">
                <span className="text-[9px] text-muted-foreground block font-medium">
                  Base Ualí
                </span>
                <span className="text-xs font-black text-teal-400">+50</span>
              </div>
            </div>
          </section>

          {/* Nivel y XP */}
          <section className="rounded-2xl border border-border p-4 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
                  Nivel {levelData.level}
                </p>
                <p className="text-base font-black text-foreground">{levelData.name}</p>
              </div>
              <span className="text-xs font-extrabold text-teal-400">{xp} XP</span>
            </div>
            <ProgressBar value={levelData.pct} state="ok" className="mt-2.5" />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {levelData.next
                ? `Faltan ${levelData.xpToNext} XP para ${levelData.next.name}`
                : "¡Nivel máximo alcanzado!"}
            </p>
          </section>

          {/* Historial reciente de puntos sumados */}
          {pointsHistory.length > 0 && (
            <section className="rounded-2xl border border-border/80 p-3.5 bg-card">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-foreground">
                <Clock className="size-3.5 text-teal-400" />
                <span>Historial de Puntos Sumados</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {pointsHistory.slice(0, 5).map((pe) => (
                  <div
                    key={pe.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 text-xs"
                  >
                    <span className="text-muted-foreground font-medium truncate max-w-[200px]">
                      {pe.reason}
                    </span>
                    <span className="font-black text-amber-300 shrink-0">
                      +{pe.tokens} FFOS {pe.xp > 0 ? `· +${pe.xp} XP` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ruta de aprendizaje */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <BookOpen className="size-3.5 text-teal-400" strokeWidth={2} aria-hidden="true" />
              <span>Ruta de aprendizaje</span>
            </h3>
            <ul className="space-y-2">
              {lessons.map((l) => {
                const done = progress.lessonsDone.includes(l.id);
                const locked = levelData.level < l.minLevel;
                return (
                  <li key={l.id}>
                    <button
                      disabled={locked}
                      onClick={() => setLesson(l)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border border-border/80 p-3 text-left transition active:scale-[0.99]",
                        locked ? "opacity-50" : "hover:border-teal-500/40",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-xl",
                          done
                            ? "bg-teal-500/20 text-teal-400"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {locked ? (
                          <Lock className="size-3.5" strokeWidth={2} />
                        ) : done ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : (
                          <BookOpen className="size-3.5" strokeWidth={2} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold text-foreground">
                          {l.title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {locked
                            ? `Nivel ${l.minLevel}`
                            : done
                              ? "Completada"
                              : `+${l.xp} XP · +50 FFOS`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Logros */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <Award className="size-3.5 text-amber-400" strokeWidth={2} aria-hidden="true" />
              <span>Logros Desbloqueables</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const done = progress.achievements.includes(a.id);
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "rounded-2xl border border-border/80 p-3 bg-card",
                      !done && "opacity-45",
                    )}
                  >
                    <p className="text-xs font-bold text-foreground">{a.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                      {a.description}
                    </p>
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

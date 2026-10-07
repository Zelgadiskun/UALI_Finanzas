import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Flame,
  Handshake,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { LessonSheet } from "@/components/ffos/LessonSheet";
import { levelInfo } from "@/lib/ffos/gamification";
import { useUserPoints } from "@/lib/ffos/points";
import { getActiveLesson, isLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import {
  useLessonsQuery,
  useProfileQuery,
  useProgressQuery,
  type LessonRow,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "UALI Finanzas — Ruta de Aprendizaje Financiero";
const description =
  "Ruta de habilidades y progreso gamificado con Chispa, Nido y Toto: 12 lecciones interactivas con sub-módulos, desafíos flash y logros.";

export const Route = createFileRoute("/aprender")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AprenderRoute,
});

export function AprenderRoute() {
  const profile = useProfileQuery();
  const progressQuery = useProgressQuery();
  const lessonsQuery = useLessonsQuery();
  const { completedSubSet, getSubProgress, stats } = useEducationProgress(profile.data?.id);

  const [openLesson, setOpenLesson] = useState<{ lesson: LessonRow; done: boolean } | null>(null);
  const [triviaAnswered, setTriviaAnswered] = useState<number | null>(null);

  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const progress = progressQuery.data;
  const lessonsDone = useMemo(() => progress?.lessonsDone ?? [], [progress?.lessonsDone]);
  const completedSet = useMemo(() => new Set(lessonsDone), [lessonsDone]);

  const { ffosTokens, xp: xpCurrent, streak, levelData, awardPoints } = useUserPoints();
  const xpNextThreshold = (levelData.level + 1) * 250;
  const xpInLevel = xpCurrent % 250;
  const xpProgressPct = Math.min(100, Math.round((xpInLevel / 250) * 100));

  // Encontrar la lección activa sugerida (la primera no completada)
  const activeLesson = useMemo(() => {
    return getActiveLesson(lessons, lessonsDone);
  }, [lessons, lessonsDone]);

  // Contar cuántas lecciones están completadas
  const completedCount = useMemo(() => {
    return lessons.filter((l) => isLessonDone(l, completedSet)).length;
  }, [lessons, completedSet]);

  // Fases organizadas de las 12 lecciones
  const phases = useMemo(() => {
    const p1 = lessons.slice(0, 4);
    const p2 = lessons.slice(4, 8);
    const p3 = lessons.slice(8, 12);
    return [
      {
        id: "phase-1",
        number: 1,
        title: "Fundamentos y Hábitos Clave",
        subtitle: "Aprende con Nido a blindar tu dinero y presupuestar a cero",
        guardian: "Nido",
        lessons: p1,
      },
      {
        id: "phase-2",
        number: 2,
        title: "Trabajo en Equipo y Tarjetas",
        subtitle: "Domina con Chispa los gastos compartidos y el crédito inteligente",
        guardian: "Chispa",
        lessons: p2,
      },
      {
        id: "phase-3",
        number: 3,
        title: "Multiplicación y Libertad",
        subtitle: "Estrategias de Toto para eliminar deudas e invertir con interés compuesto",
        guardian: "Toto",
        lessons: p3,
      },
    ];
  }, [lessons]);

  async function handleTriviaSelect(optionIndex: number) {
    if (triviaAnswered !== null) return;
    setTriviaAnswered(optionIndex);
    if (optionIndex === 0) {
      await awardPoints({ xpToAdd: 25, tokensToAdd: 50, reason: "Trivia diaria UALÍ" });
      toast.success("¡Respuesta Correcta! 🎉", {
        description: "+50 FFOS y +25 XP añadidos a tu saldo.",
      });
    } else {
      toast.error("¡Casi! La regla de oro es pagarte a ti primero.", {
        description: "Separar el ahorro al inicio garantiza que no se gaste en impulsos.",
      });
    }
  }

  // Helper para asignar iconos por lección
  function getLessonIcon(slug: string, index: number) {
    switch (slug) {
      case "intro":
        return <Calculator className="size-6" />;
      case "needs_wants":
        return <Scale className="size-6" />;
      case "emergency":
        return <ShieldCheck className="size-6" />;
      case "savings_basics":
        return <DollarSign className="size-6" />;
      case "team_finances":
        return <Users className="size-6" />;
      case "roommates_split":
        return <Handshake className="size-6" />;
      case "credit_cards":
        return <CreditCard className="size-6" />;
      case "debt_order":
        return <TrendingDown className="size-6" />;
      case "snowball":
        return <Zap className="size-6" />;
      case "impulse_spending":
        return <Search className="size-6" />;
      case "investing_101":
        return <TrendingUp className="size-6" />;
      case "inflation_shield":
        return <ShieldCheck className="size-6" />;
      default:
        return <BookOpen className="size-6" />;
    }
  }

  return (
    <main className="px-4 pt-3 pb-24">
      {/* 1. Header de Usuario & Gamificación */}
      <section className="mb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="grid size-10 place-items-center rounded-full overflow-hidden border-2 border-amber-400 bg-slate-800 ring-2 ring-amber-400/20 shadow-md">
                <span className="font-extrabold text-sm text-amber-300">
                  {profile.data?.display_name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-background" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-sm font-bold text-foreground tracking-tight">
                  ¡Aprende, {profile.data?.display_name || "Explorador"}!
                </h1>
                <span className="inline-block text-amber-300 text-xs">✨</span>
              </div>
              <p className="text-[11px] font-medium text-purple-400 flex items-center gap-1">
                <span>Nivel {levelData.level}</span> •{" "}
                <span className="text-muted-foreground">{levelData.title}</span>
              </p>
            </div>
          </div>

          {/* Badges Racha & Monedas FFOS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border/80 text-amber-300 font-bold text-xs shadow-xs">
              <Flame className="size-3.5 fill-amber-400 text-amber-400" />
              <span>{streak}d</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border/80 text-amber-300 font-bold text-xs shadow-xs">
              <span className="size-3.5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[9px] font-black">
                F
              </span>
              <span>{ffosTokens}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Banner Hero: Nivel Actual & XP */}
      <section className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between relative z-10">
          <div className="w-7/12 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-extrabold text-[10px] border border-border uppercase tracking-wider">
                {stats.completedSubLessons} de {stats.totalSubLessons} submódulos (
                {stats.overallPercentage}%)
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              {activeLesson ? activeLesson.title : "¡Todas las lecciones dominadas!"}
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Chispa impulsa tu progreso hacia el Nivel {levelData.level + 1}. {completedCount} de
              12 lecciones principales listas.
            </p>

            {/* Barra de progreso de XP */}
            <div className="mt-2.5">
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden p-0.5 border border-border/60">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-[11px]">
                <span className="font-extrabold text-amber-300">+25 XP por lección</span>
                <span className="font-semibold text-muted-foreground">
                  {xpCurrent} / {xpNextThreshold} XP
                </span>
              </div>
            </div>

            {activeLesson && (
              <button
                type="button"
                onClick={() => setOpenLesson({ lesson: activeLesson, done: false })}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-extrabold text-xs shadow-sm transition active:scale-95 rounded-xl hover:bg-primary/90"
              >
                <span>
                  {(() => {
                    const prog = getSubProgress(activeLesson);
                    return prog.completedCount > 0
                      ? `Continuar (Paso ${Math.min(3, prog.completedCount + 1)})`
                      : "Aprender lección";
                  })()}
                </span>
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </div>

          <div className="w-5/12 flex justify-center items-center">
            <ChispaCharacter className="w-24 h-24" />
          </div>
        </div>
      </section>

      {/* 3. Reto Diario / Decisión de Toto */}
      <section className="rounded-2xl bg-card border border-border/80 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Desafío Flash de Toto
            </h3>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
            +50 FFOS • +25 XP
          </span>
        </div>

        <div className="pt-3">
          <p className="text-xs font-bold text-foreground mb-3 leading-snug">
            ¿Cuál es la primera regla para construir estabilidad financiera familiar?
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleTriviaSelect(0)}
              disabled={triviaAnswered !== null}
              className={cn(
                "w-full p-2.5 rounded-xl border text-xs text-left font-medium flex items-center gap-2.5 transition active:scale-[0.99]",
                triviaAnswered === 0
                  ? "bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold"
                  : "bg-secondary/40 border-border/80 hover:bg-secondary/70 text-foreground",
              )}
            >
              <span className="size-5 rounded-full border border-border text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                A
              </span>
              <span>Pagarte a ti primero separando tu fondo antes de gastar</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriviaSelect(1)}
              disabled={triviaAnswered !== null}
              className={cn(
                "w-full p-2.5 rounded-xl border text-xs text-left font-medium flex items-center gap-2.5 transition active:scale-[0.99]",
                triviaAnswered === 1
                  ? "bg-red-500/15 border-red-500/60 text-red-300"
                  : "bg-secondary/40 border-border/80 hover:bg-secondary/70 text-foreground",
              )}
            >
              <span className="size-5 rounded-full border border-border text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                B
              </span>
              <span>Gastar libremente y guardar solo lo que sobre a fin de mes</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. RUTA DE HABILIDADES DINÁMICA (12 LECCIONES CON SUB-LECCIONES) */}
      <section className="rounded-2xl bg-card border border-border/80 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground">Ruta de Habilidades</h3>
          </div>
          <span className="text-[11px] font-bold text-secondary-foreground bg-secondary border border-border px-2.5 py-0.5 rounded-full">
            {completedCount} de {lessons.length || 12} Completadas
          </span>
        </div>

        {/* Fases dinámicas */}
        <div className="space-y-8 py-2">
          {phases.map((phase) => {
            const phaseCompleted = phase.lessons.filter((l) =>
              isLessonDone(l, completedSet),
            ).length;

            return (
              <div key={phase.id} className="relative flex flex-col items-center">
                {/* Cabecera de Fase */}
                <div className="px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-foreground text-xs font-extrabold flex items-center gap-2 mb-6 shadow-sm">
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span>
                    Fase {phase.number}: {phase.title}
                  </span>
                  <span className="px-1.5 py-0.2 bg-card text-muted-foreground text-[10px] rounded-full border border-border">
                    {phaseCompleted}/{phase.lessons.length}
                  </span>
                </div>

                {/* Grid o Camino con las Lecciones */}
                <div className="w-full space-y-6">
                  {phase.lessons.map((lesson, idx) => {
                    const isDone = isLessonDone(lesson, completedSet);
                    const isActive =
                      activeLesson?.id === lesson.id || activeLesson?.slug === lesson.slug;
                    const subProg = getSubProgress(lesson);
                    const shiftClass =
                      idx % 3 === 0
                        ? "translate-x-0"
                        : idx % 3 === 1
                          ? "translate-x-6 sm:translate-x-12"
                          : "-translate-x-6 sm:-translate-x-12";

                    return (
                      <div
                        key={lesson.id}
                        className={cn(
                          "flex flex-col items-center transition-transform",
                          shiftClass,
                        )}
                      >
                        {isActive && (
                          <div className="animate-bounce bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-full shadow-md text-center mb-2 flex items-center gap-1 text-[11px] tracking-wide">
                            <span>¡CONTINÚA AQUÍ!</span>
                            <span className="text-xs">↓</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setOpenLesson({ lesson, done: isDone })}
                          className={cn(
                            "group relative flex flex-col items-center active:scale-95 transition-transform",
                            !isDone && !isActive && "opacity-75 hover:opacity-100",
                          )}
                        >
                          {/* Nodo Circular con Icono */}
                          <div className="relative flex items-center justify-center">
                            {isActive && (
                              <div className="absolute -inset-2.5 rounded-full bg-purple-500/40 animate-pulse-ring" />
                            )}
                            <div
                              className={cn(
                                "size-16 rounded-full flex items-center justify-center border-2 transition-all shadow-md",
                                isDone
                                  ? "bg-gradient-to-tr from-[#1E968B] to-[#2EC4B6] text-white border-teal-300/40 shadow-teal-500/20"
                                  : isActive
                                    ? "bg-gradient-to-tr from-[#6829D6] to-[#9053DC] text-white border-purple-300 shadow-purple-500/30 scale-105"
                                    : "bg-secondary text-muted-foreground border-border",
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="size-8 text-teal-200" />
                              ) : (
                                getLessonIcon(lesson.slug, idx)
                              )}
                            </div>
                          </div>

                          {/* Estrellas o Indicador Granular de Sub-lecciones */}
                          {isDone ? (
                            <div className="flex items-center gap-1 mt-1.5 bg-card px-2 py-0.5 rounded-full border border-teal-500/30 shadow-xs">
                              <span className="text-amber-400 text-[10px]">★</span>
                              <span className="text-amber-400 text-[10px]">★</span>
                              <span className="text-amber-400 text-[10px]">★</span>
                              <span className="text-[9px] font-black text-teal-400 ml-0.5">
                                3/3
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-full border border-border">
                              {lesson.subLessons?.map((sub, sIdx) => {
                                const isSubDone = completedSubSet.has(sub.id);
                                return (
                                  <span
                                    key={sub.id}
                                    className={cn(
                                      "size-2 rounded-full transition-all",
                                      isSubDone
                                        ? "bg-emerald-500"
                                        : isActive && sIdx === subProg.completedCount
                                          ? "bg-amber-400 ring-1 ring-amber-400/50 animate-pulse"
                                          : "bg-muted-foreground/30",
                                    )}
                                    title={`Submódulo ${sIdx + 1}: ${sub.title}`}
                                  />
                                );
                              })}
                              <span className="text-[9px] font-extrabold text-muted-foreground ml-1">
                                {subProg.completedCount}/3
                              </span>
                            </div>
                          )}

                          {/* Título de la Lección */}
                          <span
                            className={cn(
                              "text-xs font-extrabold mt-1 text-center max-w-[170px] leading-tight",
                              isActive
                                ? "text-foreground"
                                : isDone
                                  ? "text-teal-400"
                                  : "text-muted-foreground",
                            )}
                          >
                            {lesson.title}
                          </span>

                          {/* Botón de acción rápido si es el activo */}
                          {isActive && (
                            <div className="mt-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition">
                              <Play className="size-3 fill-current" />
                              <span>Empezar Lección</span>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. MEDALLAS Y LOGROS CONSEGUIDOS */}
      <section className="rounded-2xl bg-card border border-border/80 p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-amber-400" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Tus Insignias Financieras
            </h3>
          </div>
          <span className="text-[11px] font-bold text-secondary-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border">
            {completedCount >= 1 ? "Activas" : "En progreso"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-secondary text-amber-400 border border-border flex items-center justify-center shrink-0">
              <Flame className="size-4 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Racha Activa</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{streak} días seguidos</p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-secondary text-primary border border-border flex items-center justify-center shrink-0">
              <Sparkles className="size-4 fill-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">Maestría Ualí</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {completedCount} de {lessons.length || 12} 100%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hoja modal de la lección seleccionada */}
      {openLesson && (
        <LessonSheet
          lesson={openLesson.lesson}
          done={openLesson.done}
          onClose={() => setOpenLesson(null)}
        />
      )}
    </main>
  );
}

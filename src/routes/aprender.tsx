import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { TotoFlashChallenge } from "@/components/ffos/TotoFlashChallenge";
import { ZeroBaseBudgetMissionModal } from "@/components/ffos/ZeroBaseBudgetMissionModal";
import { Rule503020MissionModal } from "@/components/ffos/Rule503020MissionModal";
import { EmergencyShieldMissionModal } from "@/components/ffos/EmergencyShieldMissionModal";
import { NidoMechanicalClassifierModal } from "@/components/ffos/NidoMechanicalClassifierModal";
import { ChispaEquityCompassModal } from "@/components/ffos/ChispaEquityCompassModal";
import { ChispaPressureRegulatorModal } from "@/components/ffos/ChispaPressureRegulatorModal";
import { TotoSnowballBreakerModal } from "@/components/ffos/TotoSnowballBreakerModal";
import { TotoPerpetualCogsModal } from "@/components/ffos/TotoPerpetualCogsModal";
import {
  PhaseTransitionRitualModal,
  type PhaseTransitionType,
} from "@/components/ffos/PhaseTransitionRitualModal";
import { LessonSheet } from "@/components/ffos/LessonSheet";
import { levelInfo } from "@/lib/ffos/gamification";
import { useUserPoints } from "@/lib/ffos/points";
import { getActiveLesson, isLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { resetUserGamificationAndTelemetry } from "@/lib/ffos/resetGamification";
import { useQueryClient } from "@tanstack/react-query";
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
  const { completedSubSet, getSubProgress, stats, isRitualDone, recordRitual } =
    useEducationProgress(profile.data?.id);

  const [ritualUpdateTick, setRitualUpdateTick] = useState(0);

  useEffect(() => {
    const handleRitualDone = () => setRitualUpdateTick((t) => t + 1);
    window.addEventListener("uali-phase-ritual-completed", handleRitualDone);
    return () => window.removeEventListener("uali-phase-ritual-completed", handleRitualDone);
  }, []);

  const [openLesson, setOpenLesson] = useState<{ lesson: LessonRow; done: boolean } | null>(null);
  const [mission01Open, setMission01Open] = useState(false);
  const [mission02Open, setMission02Open] = useState(false);
  const [mission03Open, setMission03Open] = useState(false);
  const [mission04Open, setMission04Open] = useState(false);
  const [mission05Open, setMission05Open] = useState(false);
  const [mission06Open, setMission06Open] = useState(false);
  const [mission07Open, setMission07Open] = useState(false);
  const [mission08Open, setMission08Open] = useState(false);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [activeRitualType, setActiveRitualType] = useState<PhaseTransitionType>("phase1_to_2");
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPruebas = async () => {
    setIsResetting(true);
    try {
      await resetUserGamificationAndTelemetry(profile.data?.id);
      await queryClient.invalidateQueries();
      toast.success("Reset de Pruebas Completado", {
        description:
          "Telemetría restablecida: Nivel 1, 0 XP, 0 FFOS acumulados. Fase 2 bloqueada hasta consagrar el Protocolo de Cierre.",
      });
    } catch {
      toast.error("Error al ejecutar el reset");
    } finally {
      setIsResetting(false);
    }
  };

  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const progress = progressQuery.data;
  const lessonsDone = useMemo(() => progress?.lessonsDone ?? [], [progress?.lessonsDone]);
  const completedSet = useMemo(() => new Set(lessonsDone), [lessonsDone]);

  // Chequeo de ejecución de rituales por fase asociado a User_ID
  const isPhase1RitualDone = useMemo(() => isRitualDone(1), [isRitualDone, ritualUpdateTick]);
  const isPhase2RitualDone = useMemo(() => isRitualDone(2), [isRitualDone, ritualUpdateTick]);
  const isPhase3RitualDone = useMemo(() => isRitualDone(3), [isRitualDone, ritualUpdateTick]);

  const { ffosTokens, xp: xpCurrent, streak, levelData, awardPoints } = useUserPoints();

  // FÓRMULA INDEXADA PROPORCIONAL DE XP:
  // Cada nivel responde a su tope acumulado indexado: Nivel 1 = 250, Nivel 2 = 500 XP acumulados, Nivel 3 = 750, etc.
  const currentLevelNumber = levelData.level;
  const xpLevelCap = currentLevelNumber * 250;
  const xpLevelFloor = (currentLevelNumber - 1) * 250;
  const xpInLevel = Math.max(0, xpCurrent - xpLevelFloor);
  const xpProgressPct = Math.min(100, Math.max(0, Math.round((xpInLevel / 250) * 100)));

  // Encontrar la lección activa sugerida (respetando el bloqueo mecánico de ritual)
  const activeLesson = useMemo(() => {
    const allowedLessons = !isPhase1RitualDone
      ? lessons.slice(0, 4)
      : !isPhase2RitualDone
        ? lessons.slice(0, 8)
        : lessons;
    return getActiveLesson(allowedLessons, lessonsDone);
  }, [lessons, lessonsDone, isPhase1RitualDone, isPhase2RitualDone]);

  // Contar cuántas lecciones están completadas
  const completedCount = useMemo(() => {
    return lessons.filter((l) => isLessonDone(l, completedSet)).length;
  }, [lessons, completedSet]);

  // Fases organizadas de las 12 lecciones con Entornos Visuales Evolutivos y Bloqueo Mecánico de Ritual
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
        isLocked: false,
        envTitle: "Entorno Rústico • Forja Antigua",
        envSubtitle: "Piedra, titanio y resguardo elemental",
        containerStyle:
          "border-stone-800/80 bg-gradient-to-b from-stone-950/80 via-stone-900/40 to-stone-950/90",
        badgeStyle: "bg-amber-950/60 border-amber-800/60 text-amber-300",
        ritualType: "phase1_to_2" as PhaseTransitionType,
        ritualHandover: "Relevo: Nido cede el flujo a Chispa",
        ritualDone: isPhase1RitualDone,
      },
      {
        id: "phase-2",
        number: 2,
        title: "Trabajo en Equipo y Tarjetas",
        subtitle: "Domina con Chispa los gastos compartidos y el crédito inteligente",
        guardian: "Chispa",
        lessons: p2,
        isLocked: !isPhase1RitualDone,
        lockReason:
          "Debes completar la Fase 1 y consagrar el Ritual de Relevo (Nido ➔ Chispa) en el Protocolo de Cierre.",
        envTitle: "Entorno Industrial • Dinamos Eléctricos",
        envSubtitle: "Cobre pulido, relés y alta tensión",
        containerStyle:
          "border-purple-800/60 bg-gradient-to-b from-zinc-950/90 via-purple-950/30 to-zinc-950/90",
        badgeStyle: "bg-purple-950/60 border-purple-700/60 text-purple-300",
        ritualType: "phase2_to_3" as PhaseTransitionType,
        ritualHandover: "Relevo: Chispa cede el vector a Toto",
        ritualDone: isPhase2RitualDone,
      },
      {
        id: "phase-3",
        number: 3,
        title: "Multiplicación y Libertad",
        subtitle: "Estrategias de Toto para eliminar deudas e invertir con interés compuesto",
        guardian: "Toto",
        lessons: p3,
        isLocked: !isPhase2RitualDone,
        lockReason:
          "Debes completar la Fase 2 y consagrar el Ritual de Relevo (Chispa ➔ Toto) en el Protocolo de Cierre.",
        envTitle: "Entorno Cuántico • Ciberespacio Holográfico",
        envSubtitle: "Matrices digitales y luz fractal",
        containerStyle:
          "border-cyan-800/60 bg-gradient-to-b from-slate-950/90 via-indigo-950/40 to-slate-950/90",
        badgeStyle: "bg-cyan-950/60 border-cyan-700/60 text-cyan-300",
        ritualType: "phase3_mastery" as PhaseTransitionType,
        ritualHandover: "Consolidación Suprema de la Trinidad",
        ritualDone: isPhase3RitualDone,
      },
    ];
  }, [lessons, isPhase1RitualDone, isPhase2RitualDone, isPhase3RitualDone]);

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
    <main className="px-4 pt-3 pb-28 max-w-md mx-auto w-full">
      {/* 1. Tarjeta Unificada Superior: Perfil, Gamificación, Nivel Actual & XP */}
      <section className="relative overflow-hidden rounded-2xl bg-card border border-border/80 p-4.5 shadow-sm mb-4">
        {/* Cabecera del usuario: Avatar, Saludo, Racha & Tokens FFOS */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="grid size-11 place-items-center rounded-full overflow-hidden border-2 border-amber-400 bg-slate-800 ring-2 ring-amber-400/20 shadow-md">
                <span className="font-black text-base text-amber-300">
                  {profile.data?.display_name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-background" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  ¡Aprende, {profile.data?.display_name || "Explorador"}!
                </h1>
                <span className="inline-block text-amber-300 text-sm">✨</span>
              </div>
              <p className="text-xs font-bold text-teal-400 flex items-center gap-1 mt-0.5">
                <span>Nivel {levelData.level}</span> •{" "}
                <span className="text-slate-300">{levelData.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón de Reset de Telemetría para Pruebas */}
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetPruebas}
              title="Reset de Telemetría y Gamificación para Pruebas (Usuario EDUARDO_PROFE)"
              className="flex items-center gap-1 h-9 px-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive text-xs font-bold transition active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={cn("size-3.5", isResetting && "animate-spin")} />
              <span className="hidden sm:inline">Reset Pruebas</span>
            </button>

            {/* Badge Unificado: Racha & Monedas FFOS */}
            <div className="flex items-center h-9 px-2.5 rounded-xl bg-secondary/80 border border-border/80 text-amber-300 font-black text-xs shadow-xs shrink-0 divide-x divide-border/80">
              <div className="flex items-center gap-1.5 pr-2">
                <Flame className="size-4 fill-amber-400 text-amber-400" />
                <span>{streak}d</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2">
                <span className="size-4 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[10px] font-black">
                  F
                </span>
                <span>{ffosTokens}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo del Progreso de Lección, XP y Chispa */}
        <div className="flex items-center justify-between relative z-10">
          <div className="w-7/12 pr-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-black text-xs border border-border uppercase tracking-wider">
                {stats.completedSubLessons} de {stats.totalSubLessons} submódulos (
                {stats.overallPercentage}%)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-foreground leading-tight">
              {activeLesson ? activeLesson.title : "¡Todas las lecciones dominadas!"}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-snug font-medium">
              Chispa impulsa tu progreso hacia el Nivel {levelData.level + 1}. {completedCount} de{" "}
              {lessons.length || 12} lecciones listas.
            </p>

            {/* Barra de progreso de XP */}
            <div className="mt-3">
              <div className="w-full bg-secondary h-3 rounded-full overflow-hidden p-0.5 border border-border/60">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-xs font-bold">
                <span className="font-black text-amber-300">+25 XP por lección</span>
                <span className="text-slate-400 font-medium">
                  {xpInLevel} / 250 XP · Nivel {currentLevelNumber} ({xpCurrent} XP total)
                </span>
              </div>
            </div>

            {activeLesson && (
              <button
                type="button"
                onClick={() => setOpenLesson({ lesson: activeLesson, done: false })}
                className="mt-3.5 inline-flex items-center gap-1.5 min-h-[44px] px-4 bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-sm transition active:scale-95 rounded-xl hover:bg-primary/90"
              >
                <span>
                  {(() => {
                    const prog = getSubProgress(activeLesson);
                    return prog.completedCount > 0
                      ? `Continuar (Paso ${Math.min(3, prog.completedCount + 1)})`
                      : "Aprender lección";
                  })()}
                </span>
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>

          <div className="w-5/12 flex justify-center items-center">
            <ChispaCharacter className="w-24 h-24" />
          </div>
        </div>
      </section>

      {/* 3. Reto Diario / Desafío Flash de Toto */}
      <TotoFlashChallenge />

      {/* 3.1. Misión 01: Presupuesto Base Cero (Nido) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/40 p-4 shadow-md mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-black text-[10px] uppercase tracking-wider border border-teal-500/30">
                🎮 Misión 01 • Fase 1 (Nodo 1)
              </span>
              {completedSet.has("mission-01-zero-base") || completedSet.has("intro") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Base Cero Lograda
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              Presupuesto Base Cero: Cada Peso con Destino
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Aprende con Nido a etiquetar cada peso de tu ingreso antes de gastarlo hasta lograr
              que la resta sea exactamente $0.00.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => setMission01Open(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                <Zap className="size-3.5 fill-slate-950" />
                <span>
                  {completedSet.has("mission-01-zero-base") || completedSet.has("intro")
                    ? "Jugar de Nuevo"
                    : "Jugar Misión 01"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+25 XP</span> • <span>+35 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <NidoCharacter className="w-16 h-16" mood="happy" />
          </div>
        </div>
      </section>

      {/* 3.2. Misión 02: La Regla 50 / 30 / 20 (Nido) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 p-4 shadow-md mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                🎮 Misión 02 • Fase 1 (Nodo 2)
              </span>
              {completedSet.has("mission-02-rule-503020") || completedSet.has("needs_wants") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Reparto Equilibrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              La Regla 50 / 30 / 20: El Balance de las Tres Canastas
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Calibra tus ingresos: 50% vital sin asfixia, 30% disfrute presente y 20% futuro para
              blindar tu patrimonio.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => setMission02Open(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                <Zap className="size-3.5 fill-slate-950" />
                <span>
                  {completedSet.has("mission-02-rule-503020") || completedSet.has("needs_wants")
                    ? "Jugar de Nuevo"
                    : "Jugar Misión 02"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+25 XP</span> • <span>+40 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <NidoCharacter className="w-16 h-16" mood="happy" />
          </div>
        </div>
      </section>

      {/* 3.3. Misión 03: El Escudo de Emergencia (Nido) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/40 p-4 shadow-md mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-black text-[10px] uppercase tracking-wider border border-teal-500/30">
                🎮 Misión 03 • Fase 1 (Nodo 3)
              </span>
              {completedSet.has("mission-03-emergency-shield") || completedSet.has("emergency") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Escudo Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Escudo de Emergencia: 3 a 6 Meses de Blindaje Líquido
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Configura de 3 a 6 meses de gastos vitales en cuentas disponibles 24h para absorber
              cualquier imprevisto sin recurrir a deudas.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => setMission03Open(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                <Zap className="size-3.5 fill-slate-950" />
                <span>
                  {completedSet.has("mission-03-emergency-shield") || completedSet.has("emergency")
                    ? "Jugar de Nuevo"
                    : "Jugar Misión 03"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+30 XP</span> • <span>+45 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <NidoCharacter className="w-16 h-16" mood="happy" />
          </div>
        </div>
      </section>

      {/* 3.5. Misión 04: El Clasificador Mecánico (Nido) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/40 p-4 shadow-md mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-black text-[10px] uppercase tracking-wider border border-teal-500/30">
                🎮 Misión 04 • Fase 1
              </span>
              {completedSet.has("mission-04-classifier") || completedSet.has("needs_wants") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Blindaje Superado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Clasificador Mecánico: Necesidades vs. Deseos
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Acepta el reto del Guardián Nido (la alcancía de titanio). Separa el oxígeno vital de
              las luces de bengala usando la tolva de gravedad y desvío táctil.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => setMission04Open(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition active:scale-95"
              >
                <Zap className="size-3.5 fill-slate-950" />
                <span>
                  {completedSet.has("mission-04-classifier") || completedSet.has("needs_wants")
                    ? "Jugar de Nuevo"
                    : "Jugar Misión 04"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+50 XP</span> • <span>+75 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <NidoCharacter className="w-20 h-20" mood="happy" />
          </div>
        </div>
      </section>

      {/* 3.6. Misión 05: El Trazo de la Equidad (Chispa) */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border p-4 shadow-md mb-4 transition-all",
          !isPhase1RitualDone ? "border-slate-800 opacity-80" : "border-purple-500/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px] uppercase tracking-wider border border-purple-500/30">
                🎮 Misión 05 • Fase 2 (Nodo 5)
              </span>
              {!isPhase1RitualDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                  <Lock className="size-3 text-amber-400" />
                  Bloqueada • Requiere Ritual Fase 1
                </span>
              ) : completedSet.has("mission-05-equity") || completedSet.has("team_finances") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Compás Equilibrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Trazo de la Equidad: Acuerdos y División Justa
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Chispa enseña división proporcional con apertura angular del compás. Evita que la
              rigidez 50/50 doble los acuerdos del equipo.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (!isPhase1RitualDone) {
                    toast.error("Misión 05 Bloqueada por Protocolo de Cierre", {
                      description:
                        "Debes consagrar el Ritual de Relevo (Nido ➔ Chispa) en el Protocolo de Cierre de la Fase 1 para desbloquear El Trazo de la Equidad.",
                    });
                    return;
                  }
                  setMission05Open(true);
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs rounded-xl shadow-md transition active:scale-95",
                  !isPhase1RitualDone
                    ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                    : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white",
                )}
              >
                {!isPhase1RitualDone ? (
                  <Lock className="size-3.5 text-amber-400" />
                ) : (
                  <Zap className="size-3.5 fill-current" />
                )}
                <span>
                  {!isPhase1RitualDone
                    ? "Bloqueada por Ritual"
                    : completedSet.has("mission-05-equity") || completedSet.has("team_finances")
                      ? "Jugar de Nuevo"
                      : "Jugar Misión 05"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+30 XP</span> • <span>+45 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <ChispaCharacter className="w-20 h-20" />
          </div>
        </div>
      </section>

      {/* 3.65. Misión 07: El Regulador de Presión — Orden de Ataque de Deudas (Chispa & Toto) */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border p-4 shadow-md mb-4 transition-all",
          !isPhase1RitualDone ? "border-slate-800 opacity-80" : "border-purple-500/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-black text-[10px] uppercase tracking-wider border border-purple-500/30">
                🎮 Misión 07 • Fase 2 (Nodo 7 — ¡CONTINÚA AQUÍ!)
              </span>
              {!isPhase1RitualDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                  <Lock className="size-3 text-amber-400" />
                  Bloqueada • Requiere Ritual Fase 1
                </span>
              ) : completedSet.has("mission-07-pressure-regulator") ||
                completedSet.has("debt_order") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Presión Regulada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Regulador de Presión: Orden de Ataque de Deudas
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Chispa y Toto sintonizan el tablero de interruptores. Desconecta primero los cables
              con el CAT más alto (método avalancha) y neutraliza la fuga de energía.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (!isPhase1RitualDone) {
                    toast.error("Misión 07 Bloqueada por Protocolo de Cierre", {
                      description:
                        "Debes consagrar el Ritual de Relevo (Nido ➔ Chispa) en el Protocolo de Cierre de la Fase 1 para desbloquear El Regulador de Presión.",
                    });
                    return;
                  }
                  setMission07Open(true);
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs rounded-xl shadow-md transition active:scale-95",
                  !isPhase1RitualDone
                    ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                    : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white",
                )}
              >
                {!isPhase1RitualDone ? (
                  <Lock className="size-3.5 text-amber-400" />
                ) : (
                  <Zap className="size-3.5 fill-current" />
                )}
                <span>
                  {!isPhase1RitualDone
                    ? "Bloqueada por Ritual"
                    : completedSet.has("mission-07-pressure-regulator") ||
                        completedSet.has("debt_order")
                      ? "Jugar de Nuevo"
                      : "Jugar Misión 07"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+25 XP</span> • <span>+50 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <ChispaCharacter className="w-20 h-20" />
          </div>
        </div>
      </section>

      {/* 3.66. Misión 08: El Rompehielos — Consolidación de la Bola de Nieve (Toto) */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border p-4 shadow-md mb-4 transition-all",
          !isPhase1RitualDone ? "border-slate-800 opacity-80" : "border-amber-500/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                🎮 Misión 08 • Fase 2 (Nodo 8 — Cierre de Fase 2)
              </span>
              {!isPhase1RitualDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                  <Lock className="size-3 text-amber-400" />
                  Bloqueada • Requiere Ritual Fase 1
                </span>
              ) : completedSet.has("mission-08-snowball-breaker") ||
                completedSet.has("snowball") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Pasivos Triturados
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Rompehielos: La Consolidación de la Bola de Nieve
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Toto compacta los fragmentos de cuotas muertas en una masa maciza de alta velocidad.
              Lanza la moneda pendiente abajo y pulveriza los pasivos restantes en cadena.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (!isPhase1RitualDone) {
                    toast.error("Misión 08 Bloqueada por Protocolo de Cierre", {
                      description:
                        "Debes consagrar el Ritual de Relevo (Nido ➔ Chispa) en el Protocolo de Cierre de la Fase 1 para desbloquear El Rompehielos.",
                    });
                    return;
                  }
                  setMission08Open(true);
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs rounded-xl shadow-md transition active:scale-95",
                  !isPhase1RitualDone
                    ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                    : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950",
                )}
              >
                {!isPhase1RitualDone ? (
                  <Lock className="size-3.5 text-amber-400" />
                ) : (
                  <Zap className="size-3.5 fill-slate-950" />
                )}
                <span>
                  {!isPhase1RitualDone
                    ? "Bloqueada por Ritual"
                    : completedSet.has("mission-08-snowball-breaker") ||
                        completedSet.has("snowball")
                      ? "Jugar de Nuevo"
                      : "Jugar Misión 08"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+30 XP</span> • <span>+45 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <TotoCharacter className="w-20 h-20" />
          </div>
        </div>
      </section>

      {/* 3.7. Misión 06: El Engranaje Perpetuo (Toto) */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border p-4 shadow-md mb-4 transition-all",
          !isPhase2RitualDone ? "border-slate-800 opacity-80" : "border-amber-500/40",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30">
                🎮 Misión 06 • Fase 3 (Nodo 6)
              </span>
              {!isPhase2RitualDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                  <Lock className="size-3 text-amber-400" />
                  Bloqueada • Requiere Ritual Fase 2
                </span>
              ) : completedSet.has("mission-06-perpetual-cogs") ||
                completedSet.has("inflation_shield") ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="size-3" />
                  Inflación Batida
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                  <Zap className="size-3" />
                  Disponible
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
              El Engranaje Perpetuo: Batiendo a la Inflación
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed font-medium">
              Toto hace rodar tu capital acoplando activos modernos (acciones, bienes raíces y
              bonos) en el reloj de engranajes frente al viento gris.
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (!isPhase2RitualDone) {
                    toast.error("Misión 06 Bloqueada por Protocolo de Cierre", {
                      description:
                        "Debes consagrar el Ritual de Relevo (Chispa ➔ Toto) en el Protocolo de Cierre de la Fase 2 para desbloquear El Engranaje Perpetuo.",
                    });
                    return;
                  }
                  setMission06Open(true);
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs rounded-xl shadow-md transition active:scale-95",
                  !isPhase2RitualDone
                    ? "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                    : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950",
                )}
              >
                {!isPhase2RitualDone ? (
                  <Lock className="size-3.5 text-amber-400" />
                ) : (
                  <Zap className="size-3.5 fill-slate-950" />
                )}
                <span>
                  {!isPhase2RitualDone
                    ? "Bloqueada por Ritual"
                    : completedSet.has("mission-06-perpetual-cogs") ||
                        completedSet.has("inflation_shield")
                      ? "Jugar de Nuevo"
                      : "Jugar Misión 06"}
                </span>
              </button>

              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <span>+35 XP</span> • <span>+50 FFOS</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <TotoCharacter className="w-20 h-20" />
          </div>
        </div>
      </section>

      {/* 4. RUTA DE HABILIDADES DINÁMICA (12 LECCIONES CON SUB-LECCIONES) */}
      <section className="rounded-2xl bg-card border border-border/80 p-4.5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" />
            <h3 className="text-sm font-black text-foreground">Ruta de Habilidades</h3>
          </div>
          <span className="text-xs font-extrabold text-secondary-foreground bg-secondary border border-border px-3 py-1 rounded-full">
            {completedCount} de {lessons.length || 12} Completadas
          </span>
        </div>

        {/* Fases dinámicas con Entornos Gráficos Evolutivos */}
        <div className="space-y-8 py-2">
          {phases.map((phase) => {
            const phaseCompleted = phase.lessons.filter((l) =>
              isLessonDone(l, completedSet),
            ).length;

            return (
              <div
                key={phase.id}
                className={cn(
                  "relative flex flex-col items-center rounded-3xl border p-4 sm:p-5 shadow-lg overflow-hidden transition-all",
                  phase.containerStyle,
                )}
              >
                {/* Cabecera de Fase con Entorno Evolutivo */}
                <div className="w-full flex flex-col items-center mb-6">
                  <div
                    className={cn(
                      "px-4 py-1.5 rounded-full border text-xs font-black flex items-center gap-2 shadow-sm",
                      phase.badgeStyle,
                    )}
                  >
                    <span className="size-2 rounded-full bg-current animate-pulse" />
                    <span>
                      Fase {phase.number}: {phase.title}
                    </span>
                    <span className="px-2 py-0.5 bg-black/40 text-current text-xs font-bold rounded-full border border-current/30">
                      {phaseCompleted}/{phase.lessons.length}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
                      {phase.envTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {phase.envSubtitle}
                    </span>
                  </div>

                  {/* Banner de Bloqueo Mecánico de Ritual */}
                  {phase.isLocked && (
                    <div className="w-full mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center gap-2.5 shadow-sm text-left">
                      <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        <Lock className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-amber-300 text-[11px] uppercase tracking-wide block">
                          Bloqueo Mecánico de Ritual
                        </span>
                        <span className="text-[11px] text-amber-200/90 leading-tight block mt-0.5">
                          {phase.lockReason}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grid o Camino con las Lecciones */}
                <div className="w-full space-y-6">
                  {phase.lessons.map((lesson, idx) => {
                    const isDone = isLessonDone(lesson, completedSet);
                    const isActive =
                      !phase.isLocked &&
                      (activeLesson?.id === lesson.id || activeLesson?.slug === lesson.slug);
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
                        {isActive && !phase.isLocked && (
                          <div className="animate-bounce bg-amber-400 text-slate-950 font-black px-3.5 py-1 rounded-full shadow-md text-center mb-2 flex items-center gap-1.5 text-xs tracking-wide">
                            <span>¡CONTINÚA AQUÍ!</span>
                            <span className="text-xs">↓</span>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={phase.isLocked}
                          onClick={() => {
                            if (phase.isLocked) {
                              toast.error("Fase Bloqueada por Protocolo de Cierre", {
                                description: phase.lockReason,
                              });
                              return;
                            }
                            setOpenLesson({ lesson, done: isDone });
                          }}
                          className={cn(
                            "group relative flex flex-col items-center transition-transform",
                            phase.isLocked ? "opacity-60 cursor-not-allowed" : "active:scale-95",
                            !isDone &&
                              !isActive &&
                              !phase.isLocked &&
                              "opacity-75 hover:opacity-100",
                          )}
                        >
                          {/* Nodo Circular con Icono */}
                          <div className="relative flex items-center justify-center">
                            {isActive && !phase.isLocked && (
                              <div className="absolute -inset-2.5 rounded-full bg-purple-500/40 animate-pulse-ring" />
                            )}
                            <div
                              className={cn(
                                "size-16 rounded-full flex items-center justify-center border-2 transition-all shadow-md",
                                phase.isLocked
                                  ? "bg-slate-900/90 text-slate-500 border-slate-700/60 shadow-none cursor-not-allowed"
                                  : isDone
                                    ? "bg-gradient-to-tr from-[#1E968B] to-[#2EC4B6] text-white border-teal-300/40 shadow-teal-500/20"
                                    : isActive
                                      ? "bg-gradient-to-tr from-[#6829D6] to-[#9053DC] text-white border-purple-300 shadow-purple-500/30 scale-105"
                                      : "bg-secondary text-muted-foreground border-border",
                              )}
                            >
                              {phase.isLocked ? (
                                <Lock className="size-6 text-amber-400/80" />
                              ) : isDone ? (
                                <CheckCircle2 className="size-8 text-teal-200" />
                              ) : (
                                getLessonIcon(lesson.slug, idx)
                              )}
                            </div>
                          </div>

                          {/* Estrellas o Indicador de Bloqueo */}
                          {phase.isLocked ? (
                            <div className="mt-2 flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800 text-[10px] font-bold text-slate-400 shadow-xs">
                              <Lock className="size-2.5 text-amber-400" />
                              <span>Requiere Ritual F{phase.number - 1}</span>
                            </div>
                          ) : isDone ? (
                            <div className="flex items-center gap-1 mt-2 bg-card px-2.5 py-0.5 rounded-full border border-teal-500/30 shadow-xs">
                              <span className="text-amber-400 text-xs">★</span>
                              <span className="text-amber-400 text-xs">★</span>
                              <span className="text-amber-400 text-xs">★</span>
                              <span className="text-xs font-black text-teal-400 ml-0.5">3/3</span>
                            </div>
                          ) : (
                            <div className="mt-2 flex items-center gap-1.5 bg-secondary/80 px-2.5 py-0.5 rounded-full border border-border">
                              {lesson.subLessons?.map((sub, sIdx) => {
                                const isSubDone = completedSubSet.has(sub.id);
                                return (
                                  <span
                                    key={sub.id}
                                    className={cn(
                                      "size-2.5 rounded-full transition-all",
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
                              <span className="text-xs font-black text-muted-foreground ml-1">
                                {subProg.completedCount}/3
                              </span>
                            </div>
                          )}

                          {/* Título de la Lección */}
                          <span
                            className={cn(
                              "text-xs sm:text-sm font-extrabold mt-1.5 text-center max-w-[180px] leading-tight",
                              phase.isLocked
                                ? "text-slate-500"
                                : isActive
                                  ? "text-foreground"
                                  : isDone
                                    ? "text-teal-400"
                                    : "text-muted-foreground",
                            )}
                          >
                            {lesson.title}
                          </span>

                          {/* Botón de acción rápido si es el activo */}
                          {isActive && !phase.isLocked && (
                            <div className="mt-2 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition">
                              <Play className="size-3.5 fill-current" />
                              <span>Empezar Lección</span>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* BOTÓN PROTOCOLO DE CIERRE / RITUAL DE EVOLUCIÓN */}
                <div className="w-full mt-6 pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRitualType(phase.ritualType);
                      setRitualModalOpen(true);
                    }}
                    className={cn(
                      "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition active:scale-98 shadow-md",
                      phaseCompleted === phase.lessons.length
                        ? "bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-teal-500/20 border-amber-400/60 text-amber-200 animate-pulse"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">⚡</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider block text-amber-300">
                          Protocolo de Cierre • Fase {phase.number}
                        </span>
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {phase.ritualHandover}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                      {phaseCompleted === phase.lessons.length
                        ? "¡Completada! Ver Ritual"
                        : "Ritual de Evolución"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. MEDALLAS Y LOGROS CONSEGUIDOS */}
      <section className="rounded-2xl bg-card border border-border/80 p-4.5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-amber-400" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
              Tus Insignias Financieras
            </h3>
          </div>
          <span className="text-xs font-black text-secondary-foreground bg-secondary px-3 py-1 rounded-full border border-border">
            {completedCount >= 1 ? "Activas" : "En progreso"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-secondary text-amber-400 border border-border flex items-center justify-center shrink-0">
              <Flame className="size-5 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-foreground leading-tight">
                Racha Activa
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{streak} días seguidos</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-secondary text-primary border border-border flex items-center justify-center shrink-0">
              <Sparkles className="size-5 fill-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-foreground leading-tight">
                Maestría Ualí
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
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

      {/* Modales interactivos de Misiones */}
      <ZeroBaseBudgetMissionModal open={mission01Open} onClose={() => setMission01Open(false)} />

      <Rule503020MissionModal open={mission02Open} onClose={() => setMission02Open(false)} />

      <EmergencyShieldMissionModal open={mission03Open} onClose={() => setMission03Open(false)} />

      <NidoMechanicalClassifierModal open={mission04Open} onClose={() => setMission04Open(false)} />

      <ChispaEquityCompassModal open={mission05Open} onClose={() => setMission05Open(false)} />

      <ChispaPressureRegulatorModal open={mission07Open} onClose={() => setMission07Open(false)} />

      <TotoSnowballBreakerModal open={mission08Open} onClose={() => setMission08Open(false)} />

      <TotoPerpetualCogsModal open={mission06Open} onClose={() => setMission06Open(false)} />

      {/* Modal de Protocolo de Cierre / Ritual de Evolución */}
      <PhaseTransitionRitualModal
        open={ritualModalOpen}
        type={activeRitualType}
        onClose={() => setRitualModalOpen(false)}
        onComplete={() => setRitualModalOpen(false)}
      />
    </main>
  );
}

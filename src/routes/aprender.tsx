import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
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

  // 1. Pestaña activa superior: 'mapa' | 'retos' | 'inventario'
  const [activeTab, setActiveTab] = useState<"mapa" | "retos" | "inventario">("mapa");

  // 2. Control de acordeón para nodos completados
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Escuchar el evento de finalización del ritual para forzar actualización inmediata
  const [ritualUpdateTick, setRitualUpdateTick] = useState(0);
  useEffect(() => {
    const handleRitualDone = () => setRitualUpdateTick((t) => t + 1);
    window.addEventListener("uali-phase-ritual-completed", handleRitualDone);
    return () => window.removeEventListener("uali-phase-ritual-completed", handleRitualDone);
  }, []);

  const [openLesson, setOpenLesson] = useState<{ lesson: LessonRow; done: boolean } | null>(null);

  // Modales de Misiones Prácticas
  const [mission01Open, setMission01Open] = useState(false);
  const [mission02Open, setMission02Open] = useState(false);
  const [mission03Open, setMission03Open] = useState(false);
  const [mission04Open, setMission04Open] = useState(false);
  const [mission05Open, setMission05Open] = useState(false);
  const [mission06Open, setMission06Open] = useState(false);
  const [mission07Open, setMission07Open] = useState(false);
  const [mission08Open, setMission08Open] = useState(false);

  // Modal de Transición de Fases (Ritual de Relevo)
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
  function getLessonIcon(slug: string) {
    switch (slug) {
      case "intro":
        return <Calculator className="size-5" />;
      case "needs_wants":
        return <Scale className="size-5" />;
      case "emergency":
        return <ShieldCheck className="size-5" />;
      case "savings_basics":
        return <DollarSign className="size-5" />;
      case "team_finances":
        return <Users className="size-5" />;
      case "roommates_split":
        return <Handshake className="size-5" />;
      case "credit_cards":
        return <CreditCard className="size-5" />;
      case "debt_order":
        return <TrendingDown className="size-5" />;
      case "snowball":
        return <Zap className="size-5" />;
      case "impulse_spending":
        return <Search className="size-5" />;
      case "investing_101":
        return <TrendingUp className="size-5" />;
      case "inflation_shield":
        return <ShieldCheck className="size-5" />;
      default:
        return <BookOpen className="size-5" />;
    }
  }

  // Mapa de misiones interactivas acopladas directamente a cada lección
  function getLessonMissionInfo(slug: string) {
    switch (slug) {
      case "intro":
        return {
          number: 1,
          title: "Presupuesto Base Cero",
          subtitle: "Cada Peso con Destino",
          reward: "+25 XP • +35 FFOS",
          guardianName: "Nido",
          isDone: completedSet.has("mission-01-zero-base") || completedSet.has("intro"),
          onPlay: () => setMission01Open(true),
          isLocked: false,
        };
      case "needs_wants":
        return {
          number: 2,
          title: "La Regla 50 / 30 / 20",
          subtitle: "Equilibrio Necesidades, Gustos y Ahorro",
          reward: "+30 XP • +40 FFOS",
          guardianName: "Nido",
          isDone: completedSet.has("mission-02-rule-503020") || completedSet.has("needs_wants"),
          onPlay: () => setMission02Open(true),
          isLocked: false,
        };
      case "emergency":
        return {
          number: 3,
          title: "El Escudo de Emergencia",
          subtitle: "Blindaje de Paz Mental (3 a 6 meses)",
          reward: "+35 XP • +50 FFOS",
          guardianName: "Nido",
          isDone: completedSet.has("mission-03-emergency-shield") || completedSet.has("emergency"),
          onPlay: () => setMission03Open(true),
          isLocked: false,
        };
      case "savings_basics":
        return {
          number: 4,
          title: "El Clasificador Mecánico",
          subtitle: "Págate Primero de forma automática",
          reward: "+35 XP • +45 FFOS",
          guardianName: "Nido",
          isDone:
            completedSet.has("mission-04-mechanical-classifier") ||
            completedSet.has("savings_basics"),
          onPlay: () => setMission04Open(true),
          isLocked: false,
        };
      case "team_finances":
        return {
          number: 5,
          title: "El Trazo de la Equidad",
          subtitle: "Finanzas en Equipo y División Proporcional",
          reward: "+40 XP • +50 FFOS",
          guardianName: "Chispa",
          isDone:
            completedSet.has("mission-05-equity-compass") || completedSet.has("team_finances"),
          onPlay: () => {
            if (!isPhase1RitualDone) {
              toast.error("Misión 05 Bloqueada por Protocolo de Cierre", {
                description:
                  "Debes completar la Fase 1 y consagrar el Ritual de Relevo (Nido ➔ Chispa).",
              });
              return;
            }
            setMission05Open(true);
          },
          isLocked: !isPhase1RitualDone,
        };
      case "credit_cards":
        return {
          number: 7,
          title: "El Regulador de Presión",
          subtitle: "Desconexión por CAT y Crédito Inteligente",
          reward: "+45 XP • +55 FFOS",
          guardianName: "Chispa & Toto",
          isDone:
            completedSet.has("mission-07-pressure-regulator") || completedSet.has("credit_cards"),
          onPlay: () => {
            if (!isPhase1RitualDone) {
              toast.error("Misión 07 Bloqueada por Protocolo de Cierre", {
                description:
                  "Debes completar la Fase 1 y consagrar el Ritual de Relevo (Nido ➔ Chispa).",
              });
              return;
            }
            setMission07Open(true);
          },
          isLocked: !isPhase1RitualDone,
        };
      case "debt_order":
        return {
          number: 8,
          title: "El Rompehielos",
          subtitle: "Consolidación de Bola de Nieve y Avalancha",
          reward: "+50 XP • +60 FFOS",
          guardianName: "Toto",
          isDone: completedSet.has("mission-08-snowball-breaker") || completedSet.has("debt_order"),
          onPlay: () => {
            if (!isPhase1RitualDone) {
              toast.error("Misión 08 Bloqueada por Protocolo de Cierre", {
                description:
                  "Debes completar la Fase 1 y consagrar el Ritual de Relevo (Nido ➔ Chispa).",
              });
              return;
            }
            setMission08Open(true);
          },
          isLocked: !isPhase1RitualDone,
        };
      case "snowball":
        return {
          number: 6,
          title: "El Engranaje Perpetuo",
          subtitle: "Multiplicación de Patrimonio e Interés Compuesto",
          reward: "+50 XP • +70 FFOS",
          guardianName: "Toto",
          isDone: completedSet.has("mission-06-perpetual-cogs") || completedSet.has("snowball"),
          onPlay: () => {
            if (!isPhase2RitualDone) {
              toast.error("Misión 06 Bloqueada por Protocolo de Cierre", {
                description:
                  "Debes completar la Fase 2 y consagrar el Ritual de Relevo (Chispa ➔ Toto).",
              });
              return;
            }
            setMission06Open(true);
          },
          isLocked: !isPhase2RitualDone,
        };
      default:
        return null;
    }
  }

  return (
    <main className="px-4 pt-3 pb-28 max-w-md mx-auto w-full">
      {/* 1. TARJETA HERO: Perfil, Nivel, XP y Chispa */}
      <section className="relative overflow-hidden rounded-3xl bg-card border border-border/80 p-4.5 sm:p-5 shadow-sm mb-4">
        {/* Cabecera del usuario: Avatar, Saludo, Racha & Tokens FFOS */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
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
                <span className="text-slate-300">{levelData.name}</span>
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
              className="flex items-center gap-1 h-8 px-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive text-[11px] font-bold transition active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={cn("size-3", isResetting && "animate-spin")} />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Badge Unificado: Racha & Monedas FFOS */}
            <div className="flex items-center h-8 px-2.5 rounded-xl bg-secondary/80 border border-border/80 text-amber-300 font-black text-xs shadow-xs shrink-0 divide-x divide-border/80">
              <div className="flex items-center gap-1.5 pr-2">
                <Flame className="size-3.5 fill-amber-400 text-amber-400" />
                <span>{streak}d</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2">
                <span className="size-3.5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[9px] font-black">
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
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-black text-[10px] border border-border uppercase tracking-wider">
                {stats.completedSubLessons} de {stats.totalSubLessons} submódulos (
                {stats.overallPercentage}%)
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-foreground leading-tight truncate">
              {activeLesson ? activeLesson.title : "¡Todas dominadas!"}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug font-medium line-clamp-1">
              {completedCount} de {lessons.length || 12} lecciones dominadas.
            </p>

            {/* Barra de progreso de XP */}
            <div className="mt-2.5">
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden p-0.5 border border-border/60">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-[11px] font-bold">
                <span className="text-amber-300 font-black">+25 XP / lección</span>
                <span className="text-slate-400 font-medium">
                  {xpInLevel} / 250 XP · Nivel {currentLevelNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="w-5/12 flex justify-center items-center">
            <ChispaCharacter className="w-20 h-20 sm:w-22 sm:h-22" />
          </div>
        </div>
      </section>

      {/* 2. PESTAÑAS SUPERIORES DE CONTROL (TAB LAYOUT: MAPA | RETOS | INVENTARIO) */}
      <nav
        aria-label="Navegación de secciones de aprendizaje"
        className="grid grid-cols-3 p-1 rounded-2xl bg-secondary/80 border border-border/80 mb-4 shadow-xs gap-1"
      >
        <button
          type="button"
          onClick={() => setActiveTab("mapa")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition active:scale-95",
            activeTab === "mapa"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Trophy className="size-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Mapa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("retos")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition active:scale-95 relative",
            activeTab === "retos"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Zap className="size-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Retos</span>
          <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventario")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition active:scale-95",
            activeTab === "inventario"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Award className="size-3.5 text-purple-400 shrink-0" />
          <span className="truncate">Inventario</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* VISTA 1: MAPA DE RUTA (CON ACORDEONES Y NIEBLA DE GUERRA VISUAL) */}
      {/* ============================================================== */}
      {activeTab === "mapa" && (
        <section className="rounded-3xl bg-card border border-border/80 p-4 sm:p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Trophy className="size-4.5 text-amber-400" />
              <div>
                <h3 className="text-sm font-black text-foreground">Mapa de Habilidades</h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Ruta progresiva • 3 Guardianes
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-secondary-foreground bg-secondary border border-border px-2.5 py-0.5 rounded-full shrink-0">
              {completedCount} / {lessons.length || 12}
            </span>
          </div>

          <div className="space-y-6">
            {phases.map((phase) => {
              const phaseCompleted = phase.lessons.filter((l) =>
                isLessonDone(l, completedSet),
              ).length;
              const isPhaseAllDone = phaseCompleted === phase.lessons.length;

              // NIEBLA DE GUERRA VISUAL: Si la fase está bloqueada, se renderiza una tarjeta de contención
              if (phase.isLocked) {
                return (
                  <div
                    key={phase.id}
                    className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950/90 via-slate-900/50 to-slate-950/90 p-4 sm:p-5 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                            <Lock className="size-3 text-amber-400" />
                            Niebla de Guerra • Fase {phase.number}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-slate-200 tracking-tight leading-snug">
                          Próximo Horizonte: {phase.envTitle}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {phase.lockReason}
                        </p>
                        <div className="mt-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300/90 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-xl">
                            <span>⚡ Requisito:</span> Consagra el Protocolo de Cierre de Fase{" "}
                            {phase.number - 1}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-center relative">
                        <div className="opacity-20 grayscale blur-[0.5px]">
                          {phase.number === 2 ? (
                            <ChispaCharacter className="w-16 h-16" />
                          ) : (
                            <TotoCharacter className="w-16 h-16" />
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="size-9 rounded-full bg-slate-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                            <Lock className="size-4.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // FASE ACTIVA O COMPLETADA: Renderiza sus nodos con enfoque de acordeón anti-fatiga
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "relative flex flex-col rounded-3xl border p-4 sm:p-5 shadow-lg overflow-hidden transition-all",
                    phase.containerStyle,
                  )}
                >
                  {/* Cabecera de la Fase */}
                  <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="text-xs font-black text-foreground block">
                          Fase {phase.number}: {phase.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Guardián {phase.guardian} • {phase.envTitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-slate-300">
                      {phaseCompleted}/{phase.lessons.length}
                    </span>
                  </div>

                  {/* LISTADO DE NODOS CON ACORDEÓN PROGRESIVO */}
                  <div className="w-full space-y-2.5">
                    {phase.lessons.map((lesson, idx) => {
                      const globalIdx = (phase.number - 1) * 4 + idx;
                      const isDone = isLessonDone(lesson, completedSet);
                      const isCurrentActive =
                        !phase.isLocked &&
                        (activeLesson?.id === lesson.id || activeLesson?.slug === lesson.slug);

                      // Una lección completada está expandida SOLO si el usuario la seleccionó expresamente
                      // La lección activa siempre está expandida
                      const isExpanded = isCurrentActive || expandedLessonId === lesson.id;

                      const prevLesson = phase.lessons[idx - 1];
                      const isUnlockedInPhase =
                        idx === 0 || (prevLesson ? isLessonDone(prevLesson, completedSet) : true);
                      const isLocked = !isUnlockedInPhase;

                      const subProg = getSubProgress(lesson);
                      const mission = getLessonMissionInfo(lesson.slug);

                      // ==============================================================
                      // RENDERIZADO SIMPLIFICADO 1: Nodo Completado Colapsado (<= 50px)
                      // ==============================================================
                      if (isDone && !isExpanded) {
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => setExpandedLessonId(lesson.id)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-emerald-500/25 cursor-pointer transition active:scale-98 shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CheckCircle2 className="size-4.5 text-emerald-400 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-slate-200 truncate block">
                                  Nodo {globalIdx + 1}: {lesson.title}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                                <span>★</span>
                                <span>★</span>
                                <span>★</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedLessonId(lesson.id);
                                }}
                                className="text-[10px] font-black text-teal-300 bg-teal-950/80 hover:bg-teal-900/80 border border-teal-700/50 px-2 py-0.5 rounded-lg flex items-center gap-1"
                              >
                                <span>Ver</span>
                                <ChevronDown className="size-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // ==============================================================
                      // RENDERIZADO SIMPLIFICADO 2: Nodo Bloqueado dentro de fase activa
                      // ==============================================================
                      if (isLocked && !isExpanded) {
                        return (
                          <div
                            key={lesson.id}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 opacity-60"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Lock className="size-4 text-slate-500 shrink-0" />
                              <span className="text-xs font-semibold text-slate-400 truncate">
                                Nodo {globalIdx + 1}: {lesson.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 shrink-0">
                              Nodo {globalIdx} pendiente
                            </span>
                          </div>
                        );
                      }

                      // ==============================================================
                      // RENDERIZADO COMPLETO: Solo si es la lección activa o expandida
                      // ==============================================================
                      return (
                        <div
                          key={lesson.id}
                          className={cn(
                            "w-full rounded-2xl border p-4 shadow-sm transition-all",
                            isCurrentActive
                              ? "bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border-purple-500/50 shadow-purple-950/20 ring-1 ring-purple-500/30"
                              : isDone
                                ? "bg-slate-900/80 border-teal-500/30"
                                : "bg-secondary/40 border-border/80",
                          )}
                        >
                          {/* Cabecera de la Tarjeta */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Nodo {globalIdx + 1} • Fase {phase.number}
                                </span>

                                {isDone ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                                    <CheckCircle2 className="size-3" />
                                    Dominada (3/3)
                                  </span>
                                ) : isCurrentActive ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30 animate-pulse">
                                    <Zap className="size-3" />
                                    ¡Continúa Aquí!
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground border border-border">
                                    Disponible
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm sm:text-base font-black text-foreground mt-1 leading-snug">
                                {lesson.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Botón para colapsar si ya estaba completada */}
                              {isDone && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedLessonId(null)}
                                  title="Colapsar tarjeta"
                                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800/60 border border-slate-700/60"
                                >
                                  <ChevronUp className="size-3.5" />
                                </button>
                              )}
                              {isDone ? (
                                <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                                  <span>★</span>
                                  <span>★</span>
                                  <span>★</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-300">
                                  +{lesson.xp || 25} XP
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Submódulos visibles en Modo Foco */}
                          <div className="mt-2.5 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                              <span>
                                Submódulos ({subProg.completedCount}/
                                {lesson.subLessons?.length || 3})
                              </span>
                              <span
                                className={cn(
                                  "font-black text-[10px]",
                                  isDone ? "text-teal-400" : "text-amber-300",
                                )}
                              >
                                {isDone
                                  ? "100% Completado"
                                  : `${Math.round((subProg.completedCount / 3) * 100)}%`}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {lesson.subLessons?.map((sub, sIdx) => {
                                const isSubDone = completedSubSet.has(sub.id);
                                const isSubActive = !isDone && sIdx === subProg.completedCount;

                                return (
                                  <div
                                    key={sub.id}
                                    className={cn(
                                      "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors",
                                      isSubDone
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"
                                        : isSubActive
                                          ? "bg-amber-400/15 border border-amber-400/40 text-amber-200 font-bold"
                                          : "bg-secondary/30 border border-border/30 text-muted-foreground",
                                    )}
                                  >
                                    {isSubDone ? (
                                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                                    ) : isSubActive ? (
                                      <div className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                    ) : (
                                      <span className="size-3.5 text-[10px] text-muted-foreground/70 font-bold shrink-0 text-center">
                                        {sIdx + 1}
                                      </span>
                                    )}
                                    <span className="truncate flex-1 font-medium text-[11px]">
                                      {sub.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Lanzador de Misión Práctica (si tiene misión asignada) */}
                          {mission && (
                            <div
                              className={cn(
                                "mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all",
                                mission.isDone
                                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                                  : "bg-gradient-to-r from-teal-950/60 via-slate-900 to-teal-950/60 border-teal-500/40 text-slate-200",
                              )}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <div className="size-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                                  <Zap className="size-3.5 fill-current" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                                      🎮 Misión 0{mission.number}
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-300">
                                      {mission.reward}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {mission.title}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mission.onPlay();
                                }}
                                className={cn(
                                  "shrink-0 px-2.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 transition active:scale-95 shadow-sm",
                                  mission.isDone
                                    ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                    : "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110",
                                )}
                              >
                                {mission.isDone ? (
                                  <>
                                    <RotateCcw className="size-3" />
                                    <span>Rejugar</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="size-3 fill-current" />
                                    <span>Jugar Misión</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Botón de Acción Principal */}
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => setOpenLesson({ lesson, done: isDone })}
                              className={cn(
                                "w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-sm",
                                isCurrentActive
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/30"
                                  : isDone
                                    ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border"
                                    : "bg-secondary/80 hover:bg-secondary text-foreground border border-border",
                              )}
                            >
                              {isDone ? (
                                <>
                                  <RotateCcw className="size-3.5" />
                                  <span>Repasar Lección Teórica</span>
                                </>
                              ) : (
                                <>
                                  <BookOpen className="size-3.5" />
                                  <span>
                                    {subProg.completedCount > 0
                                      ? `Continuar (Paso ${Math.min(3, subProg.completedCount + 1)})`
                                      : "Aprender Lección"}
                                  </span>
                                  <ChevronRight className="size-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PROTOCOLO DE CIERRE / RITUAL DE EVOLUCIÓN */}
                  <div className="w-full mt-4 pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRitualType(phase.ritualType);
                        setRitualModalOpen(true);
                      }}
                      className={cn(
                        "w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition active:scale-98 shadow-sm",
                        isPhaseAllDone
                          ? "bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-teal-500/20 border-amber-400/60 text-amber-200 animate-pulse"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">⚡</span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider block text-amber-300">
                            Protocolo de Cierre • Fase {phase.number}
                          </span>
                          <span className="text-[11px] font-bold text-slate-200 block truncate">
                            {phase.ritualHandover}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                        {isPhaseAllDone ? "¡Ver Ritual!" : "Ritual"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VISTA 2: RETOS DIARIOS (DESAFÍO FLASH DE TOTO DESACOPLADO)     */}
      {/* ============================================================== */}
      {activeTab === "retos" && (
        <section className="space-y-4 mb-4">
          <div className="p-3.5 rounded-2xl bg-secondary/60 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="size-5 text-amber-400" />
              <div>
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
                  Dilemas Rápidos de Toto
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  30 segundos para decidir sin estrés ni indecisión
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl">
              +{streak > 1 ? streak * 5 : 15} FFOS
            </span>
          </div>

          {/* Componente montado exclusivamente en la pestaña de Retos */}
          <TotoFlashChallenge />
        </section>
      )}

      {/* ============================================================== */}
      {/* VISTA 3: INVENTARIO Y MEDALLAS DE RANGO                        */}
      {/* ============================================================== */}
      {activeTab === "inventario" && (
        <section className="rounded-3xl bg-card border border-border/80 p-4.5 sm:p-5 shadow-sm mb-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Award className="size-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-black text-foreground">Inventario y Medallas</h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Tus logros y reliquias financieras
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-secondary-foreground bg-secondary border border-border px-2.5 py-0.5 rounded-full shrink-0">
              {completedCount >= 12 ? "Maestro Supremo" : `${completedCount}/12 Nodos`}
            </span>
          </div>

          {/* Grid de Medallas de Rango */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Racha Activa */}
            <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-secondary text-amber-400 border border-border flex items-center justify-center shrink-0">
                <Flame className="size-5 fill-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-foreground leading-tight truncate">
                  Racha Activa
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">{streak} días seguidos</p>
              </div>
            </div>

            {/* 2. Maestría Ualí */}
            <div className="p-3 rounded-2xl bg-secondary/60 border border-border/60 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-secondary text-teal-400 border border-border flex items-center justify-center shrink-0">
                <Sparkles className="size-5 fill-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-foreground leading-tight truncate">
                  Maestría Ualí
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {completedCount} de {lessons.length || 12} 100%
                </p>
              </div>
            </div>

            {/* 3. Escudo de Nido (Fase 1) */}
            <div
              className={cn(
                "p-3 rounded-2xl border flex items-center gap-3 transition-colors",
                isPhase1RitualDone
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                  : "bg-secondary/60 border-border/60 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "size-9 rounded-xl border flex items-center justify-center shrink-0",
                  isPhase1RitualDone
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-secondary text-muted-foreground border-border",
                )}
              >
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-foreground leading-tight truncate">
                  Forja de Nido
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {isPhase1RitualDone ? "★ Consagrado" : `${Math.min(4, completedCount)}/4 Fase 1`}
                </p>
              </div>
            </div>

            {/* 4. Dinamo de Chispa & Toto (Fases 2 y 3) */}
            <div
              className={cn(
                "p-3 rounded-2xl border flex items-center gap-3 transition-colors",
                isPhase2RitualDone
                  ? "bg-purple-950/20 border-purple-500/40 text-purple-200"
                  : "bg-secondary/60 border-border/60 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "size-9 rounded-xl border flex items-center justify-center shrink-0",
                  isPhase2RitualDone
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-secondary text-muted-foreground border-border",
                )}
              >
                <Trophy className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-foreground leading-tight truncate">
                  Vector Trinidad
                </p>
                <p className="text-[11px] text-slate-400 font-semibold truncate">
                  {isPhase3RitualDone
                    ? "★ Supremo"
                    : isPhase2RitualDone
                      ? "★ Relevo Toto"
                      : isPhase1RitualDone
                        ? "Fase 2 en curso"
                        : "Bloqueado"}
                </p>
              </div>
            </div>
          </div>

          {/* Bóveda de Tokens FFOS */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-400 text-slate-900 font-black flex items-center justify-center text-sm shadow-sm">
                F
              </div>
              <div>
                <p className="text-xs font-black text-amber-200 uppercase tracking-wider">
                  Bóveda de Tokens FFOS
                </p>
                <p className="text-sm font-black text-amber-400 mt-0.5">
                  {ffosTokens} Tokens acumulados
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-300 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
              Racha x{streak}
            </span>
          </div>
        </section>
      )}

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

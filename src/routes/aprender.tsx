import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Compass,
  CreditCard,
  DollarSign,
  Flame,
  Handshake,
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

import { FinancialLifeSimulation } from "@/components/ffos/FinancialLifeSimulation";
import { GuardianDialogueCenter } from "@/components/ffos/GuardianDialogueCenter";
import { EmergencyShieldMinigame } from "@/components/ffos/EmergencyShieldMinigame";
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
import { SkillTree, type SkillNode } from "@/components/ffos/SkillTree";
import { useUserPoints } from "@/lib/ffos/points";
import { getActiveLesson, isLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { resetUserGamificationAndTelemetry } from "@/lib/ffos/resetGamification";
import { useQueryClient } from "@tanstack/react-query";
import { calculateLevelProgress } from "@/lib/ffos/behavioralEngine";
import {
  useLessonsQuery,
  useProfileQuery,
  useProgressQuery,
  type LessonRow,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "Ualí Finanzas — Simulador de Casos y Ruta Práctica";
const description =
  "Laboratorio de simulacros financieros y casos prácticos con Toto (camaleón estratega), Chispa (zorrita de equidad) y Nido (cerdito guardián).";

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
  const { getSubProgress, stats, isRitualDone } = useEducationProgress(profile.data?.id);

  // Por defecto abrimos en el Simulador de Casos o Mapa según parámetro
  const [activeTab, setActiveTab] = useState<"simulador" | "mapa" | "retos" | "inventario">(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const tabParam = p.get("tab");
      if (
        tabParam === "mapa" ||
        tabParam === "simulador" ||
        tabParam === "retos" ||
        tabParam === "inventario"
      ) {
        return tabParam;
      }
    }
    return "simulador";
  });
  const [simulationMode, setSimulationMode] = useState<"roles" | "dialogos" | "escudo">("roles");
  const [mapViewMode, setMapViewMode] = useState<"phase_cards" | "resilience_tree">("phase_cards");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const [ritualUpdateTick, setRitualUpdateTick] = useState(0);
  useEffect(() => {
    const handleRitualDone = () => setRitualUpdateTick((t) => t + 1);
    const handleCloseAll = () => {
      setOpenLesson(null);
      setMission01Open(false);
      setMission02Open(false);
      setMission03Open(false);
      setMission04Open(false);
      setMission05Open(false);
      setMission06Open(false);
      setMission07Open(false);
      setMission08Open(false);
      setRitualModalOpen(false);
    };
    window.addEventListener("uali-phase-ritual-completed", handleRitualDone);
    window.addEventListener("uali-close-all-modals", handleCloseAll);
    return () => {
      window.removeEventListener("uali-phase-ritual-completed", handleRitualDone);
      window.removeEventListener("uali-close-all-modals", handleCloseAll);
    };
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

  const handleSelectSkillNode = (nodo: SkillNode) => {
    switch (nodo.id) {
      case 1:
        setMission01Open(true);
        break;
      case 2:
        setMission03Open(true);
        break;
      case 3:
        setActiveTab("retos");
        break;
      case 4:
        setMission02Open(true);
        break;
      case 5:
        setMission07Open(true);
        break;
      default:
        setMission01Open(true);
    }
  };

  const handleResetPruebas = async () => {
    setIsResetting(true);
    try {
      await resetUserGamificationAndTelemetry(profile.data?.id);
      await queryClient.invalidateQueries();
      toast.success("Progreso de simulación reiniciado", {
        description: "Puedes volver a recorrer los casos y misiones desde el inicio.",
      });
    } catch {
      toast.error("No se pudo reiniciar el progreso");
    } finally {
      setIsResetting(false);
    }
  };

  const lessons = useMemo(() => lessonsQuery.data ?? [], [lessonsQuery.data]);
  const progress = progressQuery.data;
  const lessonsDone = useMemo(() => progress?.lessonsDone ?? [], [progress?.lessonsDone]);
  const completedSet = useMemo(() => new Set(lessonsDone), [lessonsDone]);

  const isPhase1RitualDone = useMemo(() => {
    void ritualUpdateTick;
    return isRitualDone(1);
  }, [isRitualDone, ritualUpdateTick]);
  const isPhase2RitualDone = useMemo(() => {
    void ritualUpdateTick;
    return isRitualDone(2);
  }, [isRitualDone, ritualUpdateTick]);

  const { ffosTokens, xp: xpCurrent, streak, levelData, awardPoints } = useUserPoints();

  const levelProgress = useMemo(() => calculateLevelProgress(xpCurrent), [xpCurrent]);
  const currentLevelNumber = levelProgress.level;
  const xpInLevel = levelProgress.xpIntoLevel;
  const xpProgressPct = Number.isNaN(levelProgress.pct) ? 0 : levelProgress.pct;

  const activeLesson = useMemo(() => {
    return getActiveLesson(lessons, lessonsDone);
  }, [lessons, lessonsDone]);

  const completedCount = useMemo(() => {
    return lessons.filter((l) => isLessonDone(l, completedSet)).length;
  }, [lessons, completedSet]);

  // 3 Etapas claras bajo la regla 70-20-10 (Sin jerga confusa de forjas ni dinamos)
  const phases = useMemo(() => {
    const p1 = lessons.slice(0, 4);
    const p2 = lessons.slice(4, 8);
    const p3 = lessons.slice(8, 12);

    return [
      {
        id: "phase-1",
        number: 1,
        title: "Etapa 1: Calma Personal y Fondo de Paz",
        subtitle: "Domina con Nido (Cerdito Guardián) el flujo mensual y tu reserva de tranquilidad",
        guardian: "Nido",
        lessons: p1,
        isLocked: false,
        ritualType: "phase1_to_2" as PhaseTransitionType,
        ritualDone: isPhase1RitualDone,
      },
      {
        id: "phase-2",
        number: 2,
        title: "Etapa 2: Finanzas en Pareja, Familia y Equipo",
        subtitle: "Aprende con Chispa (Zorrita de Equidad) a dividir gastos y usar crédito sin fricción",
        guardian: "Chispa",
        lessons: p2,
        isLocked: false,
        ritualType: "phase2_to_3" as PhaseTransitionType,
        ritualDone: isPhase2RitualDone,
      },
      {
        id: "phase-3",
        number: 3,
        title: "Etapa 3: Estrategia, Salida de Deudas y Futuro",
        subtitle: "Entrena con Toto (Camaleón Estratega) la bola de nieve y protección ante inflación",
        guardian: "Toto",
        lessons: p3,
        isLocked: false,
        ritualType: "phase3_mastery" as PhaseTransitionType,
        ritualDone: true,
      },
    ];
  }, [lessons, isPhase1RitualDone, isPhase2RitualDone]);

  function getLessonIcon(slug: string) {
    switch (slug) {
      case "intro":
        return <Calculator className="size-4.5" />;
      case "needs_wants":
        return <Scale className="size-4.5" />;
      case "emergency":
        return <ShieldCheck className="size-4.5" />;
      case "savings_basics":
        return <DollarSign className="size-4.5" />;
      case "team_finances":
        return <Users className="size-4.5" />;
      case "roommates_split":
        return <Handshake className="size-4.5" />;
      case "credit_cards":
        return <CreditCard className="size-4.5" />;
      case "debt_order":
        return <TrendingDown className="size-4.5" />;
      case "snowball":
        return <Zap className="size-4.5" />;
      case "impulse_spending":
        return <Search className="size-4.5" />;
      case "investing_101":
        return <TrendingUp className="size-4.5" />;
      case "inflation_shield":
        return <ShieldCheck className="size-4.5" />;
      default:
        return <BookOpen className="size-4.5" />;
    }
  }

  function getLessonMissionInfo(slug: string) {
    switch (slug) {
      case "intro":
        return {
          number: 1,
          title: "Práctica: Presupuesto Base Cero",
          subtitle: "Asigna un propósito claro a cada dólar",
          reward: "+25 XP",
          guardianName: "Nido",
          isDone: completedSet.has("mission-01-zero-base") || completedSet.has("intro"),
          onPlay: () => setMission01Open(true),
        };
      case "needs_wants":
        return {
          number: 2,
          title: "Práctica: Proporción 50 / 30 / 20",
          subtitle: "Equilibra necesidades, gustos y ahorro",
          reward: "+30 XP",
          guardianName: "Nido",
          isDone: completedSet.has("mission-02-rule-503020") || completedSet.has("needs_wants"),
          onPlay: () => setMission02Open(true),
        };
      case "emergency":
        return {
          number: 3,
          title: "Práctica: El Escudo de Tranquilidad",
          subtitle: "Construye de 3 a 6 meses de respaldo",
          reward: "+35 XP",
          guardianName: "Nido",
          isDone: completedSet.has("mission-03-emergency-shield") || completedSet.has("emergency"),
          onPlay: () => setMission03Open(true),
        };
      case "savings_basics":
        return {
          number: 4,
          title: "Práctica: Clasificador de Prioridades",
          subtitle: "Págate primero de forma sencilla",
          reward: "+35 XP",
          guardianName: "Nido",
          isDone:
            completedSet.has("mission-04-mechanical-classifier") ||
            completedSet.has("savings_basics"),
          onPlay: () => setMission04Open(true),
        };
      case "team_finances":
        return {
          number: 5,
          title: "Práctica: La Brújula de Equidad",
          subtitle: "Reparto proporcional en pareja o equipo",
          reward: "+40 XP",
          guardianName: "Chispa",
          isDone:
            completedSet.has("mission-05-equity-compass") || completedSet.has("team_finances"),
          onPlay: () => setMission05Open(true),
        };
      case "credit_cards":
        return {
          number: 7,
          title: "Práctica: Uso Saludable de Crédito",
          subtitle: "Evita intereses rotativos innecesarios",
          reward: "+45 XP",
          guardianName: "Chispa & Toto",
          isDone:
            completedSet.has("mission-07-pressure-regulator") || completedSet.has("credit_cards"),
          onPlay: () => setMission07Open(true),
        };
      case "debt_order":
        return {
          number: 8,
          title: "Práctica: Salida Bola de Nieve",
          subtitle: "Liquida deudas paso a paso",
          reward: "+50 XP",
          guardianName: "Toto",
          isDone: completedSet.has("mission-08-snowball-breaker") || completedSet.has("debt_order"),
          onPlay: () => setMission08Open(true),
        };
      case "snowball":
        return {
          number: 6,
          title: "Práctica: Protección contra Inflación",
          subtitle: "Conserva el valor de tu esfuerzo en el tiempo",
          reward: "+50 XP",
          guardianName: "Toto",
          isDone: completedSet.has("mission-06-perpetual-cogs") || completedSet.has("snowball"),
          onPlay: () => setMission06Open(true),
        };
      default:
        return null;
    }
  }

  return (
    <main className="px-4 sm:px-6 pt-4 pb-28 md:pb-12 max-w-4xl mx-auto w-full space-y-5">
      {/* 1. CABECERA DEL LABORATORIO PRÁCTICO (70·20·10) */}
      <section className="rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <TotoCharacter className="w-16 h-16 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
                  Sandbox Educativo • Cero Riesgo Real
                </span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">
                Simulador de Casos y Escuela Práctica
              </h1>
              <p className="text-xs text-muted-foreground">
                Nivel {levelData.level} ({levelData.name}) • Practica decisiones con Toto, Chispa y Nido sin comprometer tu saldo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetPruebas}
              title="Reiniciar progreso de simulaciones"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className={cn("size-3.5", isResetting && "animate-spin")} />
              <span>Reiniciar</span>
            </button>

            <div className="flex items-center h-8 px-2.5 rounded-xl bg-secondary border border-border text-foreground font-extrabold text-xs divide-x divide-border">
              <div className="flex items-center gap-1 pr-2 text-[#E06D53]">
                <Flame className="size-3.5 fill-[#E06D53]" />
                <span>{streak}d</span>
              </div>
              <div className="flex items-center gap-1 pl-2 text-primary">
                <Sparkles className="size-3.5" />
                <span>{ffosTokens}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-foreground">
                Próximo tema sugerido: {activeLesson ? activeLesson.title : "Todos completados"}
              </span>
              <span className="text-primary tabular-nums">
                {xpInLevel} / 250 XP ({xpProgressPct}%)
              </span>
            </div>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${xpProgressPct}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-primary-soft text-primary shrink-0">
            {completedCount} de {lessons.length || 12} temas dominados ({stats.overallPercentage}%)
          </span>
        </div>
      </section>

      {/* 2. PESTAÑAS PRINCIPALES DE APRENDIZAJE Y SIMULACIÓN */}
      <nav
        aria-label="Secciones del simulador y escuela"
        className="grid grid-cols-4 p-1.5 rounded-2xl bg-card border border-border shadow-2xs gap-1.5"
      >
        <button
          type="button"
          onClick={() => setActiveTab("simulador")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer",
            activeTab === "simulador"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Compass className="size-4 shrink-0" />
          <span className="truncate">Simulador</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mapa")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer",
            activeTab === "mapa"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Trophy className="size-4 shrink-0" />
          <span className="truncate">Ruta ({completedCount}/12)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("retos")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer",
            activeTab === "retos"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Zap className="size-4 shrink-0" />
          <span className="truncate">Retos Flash</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventario")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-extrabold transition cursor-pointer",
            activeTab === "inventario"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Award className="size-4 shrink-0" />
          <span className="truncate">Mentores</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* PESTAÑA 1: SIMULADOR DE CASOS INTERACTIVOS                     */}
      {/* ============================================================== */}
      {activeTab === "simulador" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-card border border-border">
            <span className="text-xs font-extrabold text-foreground px-2">
              Modo de práctica activa:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSimulationMode("roles")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer",
                  simulationMode === "roles"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                Casos de Vida (Roles)
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode("dialogos")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer",
                  simulationMode === "dialogos"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                Mesa de Perspectivas (Nido · Chispa · Toto)
              </button>
              <button
                type="button"
                onClick={() => setSimulationMode("escudo")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer",
                  simulationMode === "escudo"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                Entrenador de Imprevistos
              </button>
            </div>
          </div>

          {simulationMode === "roles" && (
            <FinancialLifeSimulation
              userId={profile.data?.id}
              onRewardClaimed={(earnedXp) => {
                awardPoints(earnedXp, 25);
                toast.success(`¡Simulacro completado! Ganaste +${earnedXp} XP`);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {simulationMode === "dialogos" && (
            <GuardianDialogueCenter
              onRewardEarned={(xpBonus) => {
                awardPoints(xpBonus, 15);
                toast.success(`¡Caso analizado con los 3 mentores! +${xpBonus} XP`);
              }}
            />
          )}

          {simulationMode === "escudo" && (
            <EmergencyShieldMinigame
              onComplete={(xpBonus) => {
                awardPoints(xpBonus, 20);
                toast.success(`¡Práctica de escudo superada! +${xpBonus} XP`);
              }}
            />
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 2: RUTA DE PRÁCTICA POR ETAPAS (NIDO, CHISPA Y TOTO)   */}
      {/* ============================================================== */}
      {activeTab === "mapa" && (
        <section className="rounded-3xl bg-card border border-border p-5 space-y-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl">
              <button
                type="button"
                onClick={() => setMapViewMode("phase_cards")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer",
                  mapViewMode === "phase_cards"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Etapas por Mentor
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode("resilience_tree")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer",
                  mapViewMode === "resilience_tree"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Vista de Nodos
              </button>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Todas las etapas abiertas para explorar a tu ritmo
            </span>
          </div>

          {mapViewMode === "resilience_tree" ? (
            <SkillTree
              userId={profile.data?.id}
              userXP={xpCurrent}
              onSelectNode={(nodo) => handleSelectSkillNode(nodo)}
            />
          ) : (
            <div className="space-y-5">
              {phases.map((phase) => {
                const phaseCompleted = phase.lessons.filter((l) =>
                  isLessonDone(l, completedSet),
                ).length;

                return (
                  <div
                    key={phase.id}
                    className="rounded-2xl bg-secondary/50 border border-border p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 flex items-center justify-center">
                          {phase.guardian === "Nido" ? (
                            <NidoCharacter className="w-12 h-12" />
                          ) : phase.guardian === "Chispa" ? (
                            <ChispaCharacter className="w-12 h-12" />
                          ) : (
                            <TotoCharacter className="w-12 h-12" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-base font-extrabold text-foreground">
                            {phase.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-card border border-border text-primary shrink-0">
                        {phaseCompleted}/{phase.lessons.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {phase.lessons.map((lesson, idx) => {
                        const globalIdx = (phase.number - 1) * 4 + idx;
                        const isDone = isLessonDone(lesson, completedSet);
                        const isExpanded = expandedLessonId === lesson.id || !isDone;
                        const subProg = getSubProgress(lesson);
                        const mission = getLessonMissionInfo(lesson.slug);

                        return (
                          <div
                            key={lesson.id}
                            className="rounded-2xl bg-card border border-border p-4 space-y-3 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={cn(
                                    "size-9 rounded-xl flex items-center justify-center shrink-0",
                                    isDone
                                      ? "bg-primary-soft text-primary"
                                      : "bg-secondary text-foreground",
                                  )}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="size-4.5" />
                                  ) : (
                                    getLessonIcon(lesson.slug)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                                    {globalIdx + 1}. {lesson.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {subProg.completedCount}/{subProg.totalCount} pasos •{" "}
                                    {lesson.durationMinutes || 3} min
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setOpenLesson({ lesson, done: isDone })}
                                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                                >
                                  <Play className="size-3 fill-current" />
                                  <span>{isDone ? "Repasar" : "Abrir"}</span>
                                </button>
                                {isDone && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedLessonId(isExpanded ? null : lesson.id)
                                    }
                                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground"
                                  >
                                    <ChevronDown className="size-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {mission && (
                              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <span className="text-[11px] font-extrabold text-[#E06D53] block">
                                    {mission.title} ({mission.reward})
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block truncate">
                                    {mission.subtitle}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={mission.onPlay}
                                  className="px-3 py-1.5 rounded-xl btn-tactile-terra text-xs font-extrabold shrink-0 cursor-pointer"
                                >
                                  Practicar caso
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 3: RETOS FLASH CON TOTO                                */}
      {/* ============================================================== */}
      {activeTab === "retos" && (
        <section className="rounded-3xl bg-card border border-border p-5 shadow-2xs">
          <TotoFlashChallenge
            userId={profile.data?.id}
            onRewardClaimed={(xpBonus, tokenBonus) => {
              awardPoints(xpBonus, tokenBonus);
            }}
          />
        </section>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 4: GUÍA DE MENTORES (NIDO, CHISPA Y TOTO)              */}
      {/* ============================================================== */}
      {activeTab === "inventario" && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-card border border-border p-5 flex flex-col items-center text-center space-y-3">
            <NidoCharacter className="w-24 h-24" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
              Billetera Personal y Ahorro
            </span>
            <h3 className="font-display text-lg font-extrabold text-foreground">
              Nido (Cerdito Guardián)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Representa la calma financiera, el hábito de pagarte primero y tu Fondo de Paz para que los imprevistos nunca se conviertan en deudas caras.
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 flex flex-col items-center text-center space-y-3">
            <ChispaCharacter className="w-24 h-24" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-warning-soft text-[#E06D53]">
              Hogar, Pareja y Equipo
            </span>
            <h3 className="font-display text-lg font-extrabold text-foreground">
              Chispa (Zorrita de Equidad)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Especialista en acuerdos claros: ayuda a dividir gastos de forma proporcional a los ingresos o 50/50 para cuidar la armonía en casa o en el estudio.
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border p-5 flex flex-col items-center text-center space-y-3">
            <TotoCharacter className="w-24 h-24" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
              Simulador 360° y Estrategia
            </span>
            <h3 className="font-display text-lg font-extrabold text-foreground">
              Toto (Camaleón Estratega)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ágil, observador y adaptable. Dirige el Laboratorio de Simulacros para que pongas a prueba tus decisiones financieras en escenarios virtuales sin riesgo.
            </p>
          </div>
        </section>
      )}

      {/* Modales de Misiones Interactivas */}
      <ZeroBaseBudgetMissionModal open={mission01Open} onClose={() => setMission01Open(false)} />
      <Rule503020MissionModal open={mission02Open} onClose={() => setMission02Open(false)} />
      <EmergencyShieldMissionModal open={mission03Open} onClose={() => setMission03Open(false)} />
      <NidoMechanicalClassifierModal
        open={mission04Open}
        onClose={() => setMission04Open(false)}
      />
      <ChispaEquityCompassModal open={mission05Open} onClose={() => setMission05Open(false)} />
      <TotoPerpetualCogsModal open={mission06Open} onClose={() => setMission06Open(false)} />
      <ChispaPressureRegulatorModal open={mission07Open} onClose={() => setMission07Open(false)} />
      <TotoSnowballBreakerModal open={mission08Open} onClose={() => setMission08Open(false)} />
      <PhaseTransitionRitualModal
        open={ritualModalOpen}
        transitionType={activeRitualType}
        userId={profile.data?.id}
        onClose={() => setRitualModalOpen(false)}
        onCompleted={() => setRitualUpdateTick((t) => t + 1)}
      />

      {openLesson && (
        <LessonSheet
          lesson={openLesson.lesson}
          alreadyDone={openLesson.done}
          onClose={() => setOpenLesson(null)}
        />
      )}
    </main>
  );
}

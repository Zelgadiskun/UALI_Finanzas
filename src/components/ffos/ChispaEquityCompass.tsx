import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Compass,
  Sparkles,
  Zap,
  Users,
  Shield,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Volume2,
  VolumeX,
  X,
  Lock,
  Vote,
  Clock,
} from "lucide-react";
import { ChispaCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

// Web Audio API sintetizador para Chispa
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    return new AudioCtx();
  } catch {
    return null;
  }
}

let sharedAudioCtx: AudioContext | null = null;
function getSharedAudio(): AudioContext | null {
  if (!sharedAudioCtx) sharedAudioCtx = getAudioContext();
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playGearClick() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* audio failure ignored */
  }
}

function playMetalStrain() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* audio failure ignored */
  }
}

function playCompassHarmony() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const chords = [523.25, 659.25, 783.99]; // Acorde C mayor
    chords.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const start = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    /* audio failure ignored */
  }
}

interface ChispaEquityCompassProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function ChispaEquityCompass({ onClose, onCompleted }: ChispaEquityCompassProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();

  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Power-up FFOS «Ángulo de Oro» (50 FFOS)
  const [goldenAngleActive, setGoldenAngleActive] = useState(false);

  // MODO SOLO: Variables de paridad
  // Ingresos del Jugador 1 (Usuario) vs Jugador 2 (Socio virtual)
  const [incomeUser, setIncomeUser] = useState<number>(2000); // $2,000
  const [incomePartner, setIncomePartner] = useState<number>(1000); // $1,000 (Ratio 2:1)
  const totalSharedExpense = 900; // Alquiler + Despensa compartida ($900)

  // Asignación de aporte elegida por el usuario (slider de porcentaje: 0 a 100%)
  // 50% = división rígida 50/50. Proporcional ideal = (2000 / 3000) = 66.7%
  const idealUserRatio = useMemo(() => {
    const totalInc = incomeUser + incomePartner;
    return totalInc > 0 ? (incomeUser / totalInc) * 100 : 50;
  }, [incomeUser, incomePartner]);

  const [userContributionPct, setUserContributionPct] = useState<number>(50); // Empieza en 50/50 por defecto para provocar la tensión inicial

  // Calcular tensión del compás (0 a 100%)
  // Hay tensión alta si se fuerza 50/50 cuando hay asimetría grande, o si se sobrecarga > 85%
  const tensionLevel = useMemo(() => {
    if (goldenAngleActive) return 0;
    const diffFromIdeal = Math.abs(userContributionPct - idealUserRatio);
    // Escala la diferencia: 20% de desvío = 70% de tensión
    return Math.min(100, Math.round(diffFromIdeal * 3.5));
  }, [userContributionPct, idealUserRatio, goldenAngleActive]);

  // Cuánto paga cada uno en dólares
  const userShareDollar = Math.round((totalSharedExpense * userContributionPct) / 100);
  const partnerShareDollar = totalSharedExpense - userShareDollar;

  // MODO EQUIPO / CLAN: Evento Colectivo
  const [clanSelectedOption, setClanSelectedOption] = useState<number | null>(null);
  const [clanTimeRemaining, setClanTimeRemaining] = useState<number>(43200); // 12h simuladas (segundos)

  // Feedback y Diálogos de Chispa
  const chispaDialogue = useMemo(() => {
    if (mode === "solo") {
      if (tensionLevel > 50) {
        if (Math.abs(userContributionPct - 50) < 5) {
          return "¡Mis brazos se están doblando! Dividir en partes iguales cuando los ingresos son tan desiguales no es simetría, ¡es una sobrecarga de tensión para el equipo!";
        }
        if (userContributionPct > 85 || userContributionPct < 15) {
          return "Un solo ángulo está cargando con todo el peso del trazo. Si no abrimos el compás para balancear el esfuerzo, esa punta se va a romper muy pronto.";
        }
        return "El compás rechina bajo fricción angular. Abre o cierra las piernas de Chispa hasta emparejar el esfuerzo relativo.";
      }
      return "¡Trazo armónico y equilibrado! Cuando cada miembro aporta en proporción a su ingreso, la balanza de esfuerzo queda en paz.";
    } else {
      if (clanSelectedOption === 2) {
        return "Perdimos la brújula por división rígida forzada. La tensión financiera en el clan acaba de subir un 55%.";
      }
      if (clanSelectedOption === 3) {
        return "Un solo ángulo está absorbiendo todo el peso. Alivia temporalmente a los demás pero sobrecarga al jugador hasta la ruptura.";
      }
      if (clanSelectedOption === 1) {
        return "¡Excelente consenso! El método proporcional distribuye el aumento de $100 según capacidad real, protegiendo la cohesión del clan.";
      }
      return "El gasto común subió $100. El clan debe votar una solución antes de que expire el temporizador de gobernanza.";
    }
  }, [mode, tensionLevel, userContributionPct, clanSelectedOption]);

  // Activar Power-up «Ángulo de Oro»
  function handleActivateGoldenAngle() {
    if (goldenAngleActive) {
      toast.info("Ángulo de Oro ya está activo");
      return;
    }
    if (ffosTokens < 50) {
      toast.error("Saldo FFOS insuficiente", {
        description: "Necesitas 50 FFOS para desbloquear el Ángulo de Oro.",
      });
      return;
    }
    const spent = spendTokens(50, "Power-up FFOS: Ángulo de Oro (Misión 05)");
    if (spent) {
      setGoldenAngleActive(true);
      setUserContributionPct(Math.round(idealUserRatio));
      if (soundEnabled) playCompassHarmony();
      toast.success("📐 ¡Ángulo de Oro Activado!", {
        description:
          "Algoritmo de cálculo automático ejecutado: paridad proporcional perfecta fijada.",
      });
    }
  }

  // Confirmar resolución en Modo Solo
  async function handleConfirmSolo() {
    if (tensionLevel > 35 && !goldenAngleActive) {
      // Aprendizaje por error / fricción
      if (soundEnabled) playMetalStrain();
      toast.error("¡Rescisión por tensión financiera!", {
        description:
          "El socio virtual no pudo sostener este reparto inflexible y rescindió el acuerdo a los dos turnos.",
      });
      await awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Misión 05: Análisis de colapso por fricción de paridad",
      });
      setGameState("result");
    } else {
      // Victoria limpia
      if (soundEnabled) playCompassHarmony();
      await awardPoints({
        xpToAdd: 30,
        tokensToAdd: 45,
        reason: "Misión 05: Victoria Limpia con Calibración Proporcional",
      });
      addLocalLessonDone("mission-05-equity", "team_finances");
      completeSubLesson("lesson-team-finances", "team_finances", "team-finances-sub-2", 1);
      toast.success("🌟 ¡Victoria Geométrica! Medalla «Geometría Justa» desbloqueada", {
        description: "+30 XP y +45 FFOS añadidos a tu cuenta.",
      });
      setGameState("result");
      if (onCompleted) onCompleted();
    }
  }

  // Confirmar voto en Modo Equipo
  async function handleConfirmTeamVote(option: number) {
    setClanSelectedOption(option);
    if (option === 1) {
      // Opción 1: Proporcional (Recomendada)
      if (soundEnabled) playCompassHarmony();
      await awardPoints({
        xpToAdd: 30,
        tokensToAdd: 45,
        reason: "Misión 05 (Modo Clan): Consenso Proporcional Exitoso",
      });
      addLocalLessonDone("mission-05-equity", "team_finances");
      toast.success("🏛️ ¡Consenso Proporcional Aprobado!", {
        description: "El clan mantiene 0% estrés y suma +20 FFOS a la Bóveda Central.",
      });
      setGameState("result");
      if (onCompleted) onCompleted();
    } else {
      // Opción 2 o 3: Tensión o Sobrecarga
      if (soundEnabled) playMetalStrain();
      await awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Misión 05 (Modo Clan): Experimentación de fricción grupal",
      });
      toast.warning("Fricción en la Batería del Clan", {
        description:
          option === 2
            ? "División rígida 50/50: Estrés subió un 55%."
            : "Absorción unilateral: Sobrecarga extrema en un miembro.",
      });
      setGameState("result");
    }
  }

  function handleRestart() {
    setGameState("playing");
    setUserContributionPct(50);
    setGoldenAngleActive(false);
    setClanSelectedOption(null);
  }

  // Apertura angular de las patas de Chispa en el compás (grados entre 25° y 80°)
  const compassAngle = useMemo(() => {
    // Normaliza de 20% a 80% hacia ángulos visibles
    const ratio = userContributionPct / 100;
    return 20 + ratio * 60;
  }, [userContributionPct]);

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* 1. Cabecera de la Misión */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-inner">
              <Compass className="size-5" />
            </span>
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-purple-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-full">
                Misión 05 • Fase 2
              </span>
              <span className="text-[10px] font-bold text-slate-400">Trabajo en Equipo</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              El Trazo de la Equidad
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de modo: Solo vs Equipo */}
          <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[10px] font-black">
            <button
              type="button"
              onClick={() => {
                setMode("solo");
                setGameState("playing");
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition",
                mode === "solo" ? "bg-purple-600 text-white shadow" : "text-slate-400",
              )}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("team");
                setGameState("playing");
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition",
                mode === "team" ? "bg-purple-600 text-white shadow" : "text-slate-400",
              )}
            >
              Equipo
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pantalla INTRO */}
      {gameState === "intro" && (
        <div className="py-4 space-y-4 text-center">
          <div className="flex justify-center my-2">
            <ChispaCharacter className="w-28 h-28" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-purple-300">
              «El Pivot Proporcional del Compás»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Soy <strong className="text-purple-400">Chispa</strong>, tu brújula y compás de
              paridad. Cortar los gastos 50/50 cuando los ingresos son dispares no es justicia: es
              sobrecarga mecánica que dobla el compás del hogar.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-300">
              <Sparkles className="size-4" />
              <span>Regla del Compás Proporcional</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Ajusta la apertura angular para que quien genere más asuma la cuota que le
              corresponde, dejando el mismo margen de respiro para ambos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-500/25 transition active:scale-[0.98]"
          >
            Comenzar Calibración de Chispa
          </button>
        </div>
      )}

      {/* Pantalla JUEGO EN VIVO: MODO SOLO */}
      {gameState === "playing" && mode === "solo" && (
        <div className="space-y-4">
          {/* Barra de Tensión del Compás */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="flex items-center gap-1.5 text-slate-300">
                <AlertTriangle
                  className={cn(
                    "size-3.5",
                    tensionLevel > 40 ? "text-rose-400 animate-pulse" : "text-emerald-400",
                  )}
                />
                <span>Línea de Tensión del Compás</span>
              </span>
              <span
                className={cn(
                  "font-mono font-bold text-xs",
                  tensionLevel > 40 ? "text-rose-400" : "text-emerald-400",
                )}
              >
                {goldenAngleActive ? "0% (Inmune: Ángulo de Oro)" : `${tensionLevel}% Fricción`}
              </span>
            </div>

            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  tensionLevel > 40
                    ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-rose-500/50"
                    : "bg-gradient-to-r from-teal-400 to-emerald-400 shadow-emerald-500/50",
                )}
                style={{ width: `${tensionLevel}%` }}
              />
            </div>
          </div>

          {/* METÁFORA VISUAL: El Compás y el Pastel Geométrico de Gastos */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 text-center overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
            {/* SVG del Compás Dinámico que se abre o dobla */}
            <div className="relative w-44 h-36 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 160 120">
                {/* Cabeza central de Chispa (Eje del Compás) */}
                <circle
                  cx="80"
                  cy="24"
                  r="14"
                  fill="#7952B3"
                  stroke={tensionLevel > 45 ? "#F43F5E" : "#A855F7"}
                  strokeWidth="3"
                />
                <circle cx="80" cy="24" r="6" fill="#F6BE22" />

                {/* Brazo Izquierdo (Jugador 1 - Usuario) */}
                <path
                  d={
                    tensionLevel > 50
                      ? `M80 24 Q${60 - tensionLevel * 0.15} 60 ${80 - compassAngle} 105`
                      : `M80 24 L${80 - compassAngle} 105`
                  }
                  fill="none"
                  stroke={tensionLevel > 45 ? "#F43F5E" : "#9333EA"}
                  strokeWidth={tensionLevel > 50 ? "5" : "4"}
                  strokeLinecap="round"
                />
                {/* Punta izquierda de anclaje */}
                <circle
                  cx={80 - compassAngle}
                  cy="105"
                  r="5"
                  fill="#F6BE22"
                  stroke="#7952B3"
                  strokeWidth="2"
                />

                {/* Brazo Derecho (Jugador 2 - Socio Virtual) */}
                <path
                  d={
                    tensionLevel > 50
                      ? `M80 24 Q${100 + tensionLevel * 0.15} 60 ${80 + (80 - compassAngle)} 105`
                      : `M80 24 L${80 + (80 - compassAngle)} 105`
                  }
                  fill="none"
                  stroke={tensionLevel > 45 ? "#F43F5E" : "#3B82F6"}
                  strokeWidth={tensionLevel > 50 ? "5" : "4"}
                  strokeLinecap="round"
                />
                {/* Punta derecha de anclaje */}
                <circle
                  cx={80 + (80 - compassAngle)}
                  cy="105"
                  r="5"
                  fill="#60A5FA"
                  stroke="#1E3A8A"
                  strokeWidth="2"
                />

                {/* Arco de Apertura Angular */}
                <path
                  d={`M${80 - compassAngle * 0.5} 70 Q80 82 ${80 + (80 - compassAngle) * 0.5} 70`}
                  fill="none"
                  stroke={tensionLevel > 45 ? "#F43F5E" : "#10B981"}
                  strokeDasharray="3 3"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Pastel Geométrico de Aportes */}
            <div className="w-full max-w-xs mt-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-2.5">
              <div className="flex justify-between items-center text-[11px] font-black mb-1.5">
                <span className="text-purple-300">Tú ({userContributionPct}%)</span>
                <span className="text-slate-400 font-mono">${totalSharedExpense} Total</span>
                <span className="text-sky-300">Socio ({100 - userContributionPct}%)</span>
              </div>
              <div className="h-4 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                <div
                  className="bg-purple-500 h-full rounded-l-lg transition-all"
                  style={{ width: `${userContributionPct}%` }}
                />
                <div
                  className="bg-sky-500 h-full rounded-r-lg transition-all"
                  style={{ width: `${100 - userContributionPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs font-mono font-bold mt-1.5">
                <span className="text-purple-400">${userShareDollar}</span>
                <span className="text-sky-400">${partnerShareDollar}</span>
              </div>
            </div>
          </div>

          {/* SLIDERS DE PARIDAD & APERTURA ANGULAR */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-3">
            {/* Slider 1: Ratio de Ingresos */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300">Tus Ingresos Mensuales</span>
                <span className="text-purple-400 font-mono font-black">${incomeUser}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="4000"
                step="100"
                value={incomeUser}
                onChange={(e) => {
                  setIncomeUser(parseInt(e.target.value, 10));
                  if (soundEnabled) playGearClick();
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300">Ingresos del Socio Virtual</span>
                <span className="text-sky-400 font-mono font-black">${incomePartner}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={incomePartner}
                onChange={(e) => {
                  setIncomePartner(parseInt(e.target.value, 10));
                  if (soundEnabled) playGearClick();
                }}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Slider de Aporte (Ajuste del Compás) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs font-black mb-1">
                <span className="text-amber-300">Apertura del Compás (Tu Aporte)</span>
                <span className="font-mono text-purple-300">{userContributionPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={userContributionPct}
                onChange={(e) => {
                  setUserContributionPct(parseInt(e.target.value, 10));
                  if (soundEnabled) playGearClick();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1">
                <span>Rígido 50/50</span>
                <span className="text-emerald-400 font-black">
                  Ratio Justo: {Math.round(idealUserRatio)}%
                </span>
                <span>Asimétrico 90/10</span>
              </div>
            </div>
          </div>

          {/* Diálogo y Power-up */}
          <div className="flex items-center justify-between gap-3 bg-purple-950/30 border border-purple-800/40 p-3 rounded-2xl">
            <p className="text-xs text-purple-200 leading-snug flex-1 italic">"{chispaDialogue}"</p>
            <button
              type="button"
              onClick={handleActivateGoldenAngle}
              disabled={goldenAngleActive || ffosTokens < 50}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 transition active:scale-95",
                goldenAngleActive
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : ffosTokens >= 50
                    ? "bg-slate-900 border-amber-400/80 text-amber-300 hover:bg-amber-400/10"
                    : "bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed",
              )}
            >
              <Sparkles className="size-3.5 inline mr-1" />
              {goldenAngleActive ? "Ángulo Activo" : "Ángulo Oro (50 F)"}
            </button>
          </div>

          {/* Botón de Confirmación de Acuerdo */}
          <button
            type="button"
            onClick={handleConfirmSolo}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Fijar Acuerdo con Socio Virtual
          </button>
        </div>
      )}

      {/* Pantalla JUEGO EN VIVO: MODO EQUIPO / CLAN */}
      {gameState === "playing" && mode === "team" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                <Vote className="size-4" />
                Votación Asincrónica de Gobernanza
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="size-3" />
                12h restantes
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>¡Ajuste de Cuentas Anual!</strong> El costo de los servicios compartidos
              aumentó un <strong>+$100 mensuales</strong>. La Batería del Clan requiere calibración
              de aportes.
            </p>
          </div>

          {/* Opciones de Votación */}
          <div className="space-y-2.5">
            {/* Opción 1: Proporcional (Recomendada) */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(1)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 hover:bg-emerald-950/30 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-emerald-300 block">
                  Opción 1: Método Proporcional (Recomendado por Chispa)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cada miembro asume según su porcentaje de ingresos reales en UALÍ. Cero tensión en
                  el clan y flujo balanceado.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">
                Óptimo
              </span>
            </button>

            {/* Opción 2: Rígida 50/50 */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(2)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-rose-300 block">
                  Opción 2: División Rígida (50/50)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Todos pagan lo mismo sin importar brecha de ingresos. Sube la tensión en el brazo
                  izquierdo de Chispa un +55%.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black shrink-0">
                Fricción
              </span>
            </button>

            {/* Opción 3: Absorción Unilateral */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(3)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-amber-300 block">
                  Opción 3: Absorción Unilateral (1 solo miembro)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  El de mayores ingresos absorbe el 100% del aumento para evitar hablar. Alivia a
                  los demás pero sobrecarga a un solo jugador.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black shrink-0">
                Riesgo
              </span>
            </button>
          </div>

          <div className="bg-purple-950/30 border border-purple-800/40 p-3 rounded-2xl text-xs text-purple-200 italic">
            "{chispaDialogue}"
          </div>
        </div>
      )}

      {/* Pantalla RESULTADO */}
      {gameState === "result" && (
        <div className="py-6 space-y-4 text-center">
          <div className="flex justify-center">
            <ChispaCharacter className="w-24 h-24" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-100">
              {tensionLevel <= 35 || clanSelectedOption === 1
                ? "¡Calibración Geométrica Exitosa!"
                : "Análisis de Fricción Completado"}
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              {tensionLevel <= 35 || clanSelectedOption === 1
                ? "Has demostrado que la verdadera equidad es proporcional a la capacidad de ingresos, liberando de fricción y resentimiento al equipo."
                : "Experimentaste cómo la división rígida dobla el compás. La inflexibilidad matemática fractura los acuerdos a largo plazo."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose || handleRestart}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Continuar en el Skill Tree
          </button>
        </div>
      )}
    </div>
  );
}

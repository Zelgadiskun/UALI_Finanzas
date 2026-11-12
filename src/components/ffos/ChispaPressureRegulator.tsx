import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Zap,
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Lock,
  Vote,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Gauge,
  Sliders,
} from "lucide-react";
import { ChispaCharacter, TotoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { useDebtsQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

// Web Audio API sintetizador para Chispa y Toto (Relés electromecánicos y descargas)
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

// Sonido: Relé electromecánico limpio (desconexión exitosa)
function playRelayClick() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    /* audio failure ignored */
  }
}

// Sonido: Chispazo y rebote electromecánico (error de orden / cortocircuito)
function playSparkBuzz() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    /* audio failure ignored */
  }
}

// Sonido: Alarma de sobrecarga y sirena
function playSirens() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    /* audio failure ignored */
  }
}

interface CircuitDebt {
  id: string;
  name: string;
  balance: number;
  cat: number; // Costo Anual Total / Tasa de Interés %
  isReal: boolean;
  disconnected: boolean;
  frozenTurns: number;
}

interface ChispaPressureRegulatorProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function ChispaPressureRegulator({ onClose, onCompleted }: ChispaPressureRegulatorProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();
  const debtsQuery = useDebtsQuery();

  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Power-up FFOS «Disyuntor CAT» (50 FFOS)
  const [catBreakerBought, setCatBreakerBought] = useState(false);

  // Barra de estrés del jugador (0% a 100%)
  const [stressBar, setStressBar] = useState<number>(35);

  // Dial de Voltaje: Flujo de efectivo libre seleccionado hacia un cable (1, 2, 3)
  const [selectedCableId, setSelectedCableId] = useState<string | null>(null);

  // Feedback visual de chispazo y sacudida
  const [sparkingCableId, setSparkingCableId] = useState<string | null>(null);
  const [circuitOverloaded, setCircuitOverloaded] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string>("");

  // Modo Equipo: Votación de la cocina compartida
  const [teamVote, setTeamVote] = useState<"opt1" | "opt2" | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(43200); // 12 horas simuladas

  // Generación adaptativa del mapa de pasivos
  const initialCircuits: CircuitDebt[] = useMemo(() => {
    const realDebts = debtsQuery.data ?? [];
    if (realDebts.length >= 3) {
      return realDebts.slice(0, 3).map((d, idx) => ({
        id: d.id,
        name: d.name,
        balance: d.remaining || d.principal || 1500,
        cat: idx === 0 ? 78.5 : idx === 1 ? 42.0 : 18.5,
        isReal: true,
        disconnected: false,
        frozenTurns: 0,
      }));
    }
    // Deudas base del simulador: Tarjeta A (74% CAT), Préstamo B (36% CAT), Crédito de Tienda C (19% CAT)
    return [
      {
        id: "cable-1",
        name: "Tarjeta Platino A",
        balance: 1400,
        cat: 74.8,
        isReal: false,
        disconnected: false,
        frozenTurns: 0,
      },
      {
        id: "cable-2",
        name: "Préstamo Personal B",
        balance: 3200,
        cat: 38.5,
        isReal: false,
        disconnected: false,
        frozenTurns: 0,
      },
      {
        id: "cable-3",
        name: "Crédito de Tienda C",
        balance: 650,
        cat: 19.2,
        isReal: false,
        disconnected: false,
        frozenTurns: 0,
      },
    ];
  }, [debtsQuery.data]);

  const [circuits, setCircuits] = useState<CircuitDebt[]>(initialCircuits);

  // Reiniciar circuitos al cambiar o iniciar
  useEffect(() => {
    setCircuits(initialCircuits);
  }, [initialCircuits]);

  // Cable con mayor temperatura/CAT activo
  const highestCatActive = useMemo(() => {
    const active = circuits.filter((c) => !c.disconnected);
    if (active.length === 0) return null;
    return active.reduce((prev, curr) => (curr.cat > prev.cat ? curr : prev));
  }, [circuits]);

  // Activar compra del fusible Disyuntor CAT (50 FFOS)
  const handleBuyCatBreaker = () => {
    if (catBreakerBought) return;
    if (ffosTokens < 50) {
      toast.error("Saldo insuficiente de FFOS", {
        description: "Necesitas 50 FFOS para desbloquear el Disyuntor CAT.",
      });
      return;
    }
    const ok = spendTokens(50, "Desbloqueo Power-up: Disyuntor CAT (Misión 07)");
    if (!ok) return;

    setCatBreakerBought(true);
    // Congelar intereses del cable más peligroso
    if (highestCatActive) {
      setCircuits((prev) =>
        prev.map((c) => (c.id === highestCatActive.id ? { ...c, frozenTurns: 2 } : c)),
      );
      toast.success("⚡ ¡Fusible Disyuntor CAT activado!", {
        description: `Se han congelado los intereses críticos de ${highestCatActive.name} durante 2 turnos.`,
      });
    }
  };

  // Manejo de la palanca háptica de desconexión
  const handlePullLever = (cable: CircuitDebt) => {
    if (cable.disconnected) return;

    // Regla Metodológica: Avalancha matemática (mayor CAT primero)
    if (highestCatActive && cable.id === highestCatActive.id) {
      // ¡ÉXITO! Desconexión eficiente
      if (soundEnabled) playRelayClick();
      setCircuits((prev) =>
        prev.map((c) => (c.id === cable.id ? { ...c, disconnected: true } : c)),
      );
      setStressBar((s) => Math.max(0, s - 25));
      setLastFeedback(
        `¡Relé desconectado con éxito! Desactivaste ${cable.name} (${cable.cat}% CAT). La fuga de energía se detuvo.`,
      );
      toast.success("🔌 ¡Desconexión limpia y eficiente!", {
        description: `Ataque avalancha acertado. Salvaste cientos en intereses.`,
      });

      // Verificar si todos están desconectados
      const remaining = circuits.filter((c) => c.id !== cable.id && !c.disconnected);
      if (remaining.length === 0) {
        handleVictory();
      }
    } else {
      // ¡ERROR! Intentó desconectar una de menor interés por ser monto bajo
      if (soundEnabled) {
        playSparkBuzz();
        playSirens();
      }
      setSparkingCableId(cable.id);
      setCircuitOverloaded(true);
      setStressBar((s) => Math.min(100, s + 35));
      setLastFeedback(
        `"¡Bzzzt! Estás dirigiendo el voltaje hacia el cable frío. Si no abres mi compás hacia el interruptor con el CAT más alto (${highestCatActive?.cat}% CAT), la red va a causar un cortocircuito general." — Chispa`,
      );

      setTimeout(() => {
        setSparkingCableId(null);
        setCircuitOverloaded(false);
      }, 1400);

      toast.error("⚡ ¡Chispazo naranja en la red!", {
        description:
          "El interruptor rebotó. Desperdiciaste el flujo libre atacando un pasivo frío en vez del CAT más destructivo.",
      });
    }
  };

  // Finalización con éxito de la Misión
  const handleVictory = () => {
    setStressBar(0);
    setGameState("result");

    awardPoints({
      xpToAdd: 25,
      tokensToAdd: 50,
      reason: "Victoria Limpia: Misión 07 — El Regulador de Presión",
    });

    // Guardar lección como completada
    addLocalLessonDone("lesson-debt-order", "debt_order");
    completeSubLesson("lesson-debt-order", "debt-order-sub-1");
    completeSubLesson("lesson-debt-order", "debt-order-sub-2");
    completeSubLesson("lesson-debt-order", "debt-order-sub-3");

    if (onCompleted) onCompleted();
  };

  // Votación en Modo Equipo
  const handleTeamVoteSubmit = (vote: "opt1" | "opt2") => {
    setTeamVote(vote);
    if (vote === "opt1") {
      if (soundEnabled) playRelayClick();
      setStressBar(0);
      setLastFeedback(
        "¡El clan acordó por unanimidad aplicar el flujo grupal a la tarjeta con 60% CAT! Ahorraron miles y consolidaron la red.",
      );
      awardPoints({
        xpToAdd: 25,
        tokensToAdd: 70, // +50 base + 20 bono de sinergia
        reason: "Bono de Sinergia Unánime: Sobrecarga en la Cocina Compartida",
      });
      addLocalLessonDone("lesson-debt-order", "debt_order");
      setGameState("result");
    } else {
      if (soundEnabled) playSparkBuzz();
      setStressBar(85);
      setLastFeedback(
        "El clan pagó el préstamo sin intereses por compromiso social. El sistema cobró comisión del +20% por mora grupal y la barra de estrés se disparó.",
      );
      awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Aprendizaje por error: Misión 07",
      });
      setGameState("result");
    }
  };

  return (
    <div className="relative bg-slate-950 border border-purple-500/40 rounded-3xl p-4 sm:p-6 text-foreground overflow-hidden shadow-2xl max-w-lg mx-auto">
      {/* Fondo temático de laboratorio eléctrico de Chispa */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/25 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Efecto de chispas en pantalla ante cortocircuito */}
      {circuitOverloaded && (
        <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[1px] pointer-events-none z-30 animate-pulse border-4 border-amber-500" />
      )}

      {/* Header Modal con Guardián Chispa & Toto */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-purple-500/30">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
            <Zap className="size-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/60">
                Misión 07 • Fase 2 (Nodo 7)
              </span>
              <span className="text-xs">⚡</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white leading-tight">
              El Regulador de Presión: Orden de Ataque
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Modo Solo vs Modo Equipo */}
      <div className="relative z-10 grid grid-cols-2 gap-2 mt-3 p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode("solo");
            setGameState("intro");
          }}
          className={cn(
            "py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5",
            mode === "solo"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          <span>Modo Solo</span>
          <span className="text-[10px] bg-purple-950 px-1.5 py-0.2 rounded-full border border-purple-400/30">
            CAT
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("team");
            setGameState("intro");
          }}
          className={cn(
            "py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5",
            mode === "team"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          <span>Modo Clan</span>
          <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
            Cocina
          </span>
        </button>
      </div>

      {/* PANTALLA 1: INTRODUCCIÓN */}
      {gameState === "intro" && (
        <div className="relative z-10 py-4 space-y-4">
          <div className="flex items-center gap-4 bg-purple-950/40 p-4 rounded-2xl border border-purple-500/30">
            <div className="shrink-0 flex items-center justify-center">
              <ChispaCharacter className="w-20 h-20" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-purple-200">
                {mode === "solo"
                  ? "Sintonización con Chispa y Toto"
                  : "¡Sobrecarga en la Cocina Compartida!"}
              </h4>
              <p className="text-xs text-slate-300 leading-snug">
                {mode === "solo"
                  ? "Tres cables de alta tensión están sobrecalentados en el tablero. Aprende a aplicar el Flujo Libre (Método Avalancha) desconectando primero la deuda con el Costo Anual Total (CAT) más alto."
                  : "El clan tiene un excedente grupal y deudas colectivas por electrodomésticos. Voten juntos si liquidar el 60% CAT o ceder a la presión social."}
              </p>
            </div>
          </div>

          {/* Recompensas de la misión */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
            <span className="text-slate-400">Recompensas Sprint:</span>
            <span className="text-amber-300 flex items-center gap-2">
              <span>+25 XP</span> • <span>+50 FFOS</span> • <span>★★★</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition"
          >
            <span>Iniciar Diagnóstico de Fricción</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* PANTALLA 2: JUEGO EN VIVO (TABLERO DE INTERRUPTORES) */}
      {gameState === "playing" && mode === "solo" && (
        <div className="relative z-10 py-3 space-y-4">
          {/* Indicadores de Telemetría: Barra de Estrés & Power-Up Fusible */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            {/* Medidor de Estrés */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="size-3 text-orange-400" />
                  Barra de Estrés
                </span>
                <span
                  className={cn(
                    stressBar > 60
                      ? "text-rose-400 animate-pulse"
                      : stressBar > 25
                        ? "text-amber-300"
                        : "text-emerald-400",
                  )}
                >
                  {stressBar}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    stressBar > 60
                      ? "bg-rose-500"
                      : stressBar > 25
                        ? "bg-amber-400"
                        : "bg-emerald-500",
                  )}
                  style={{ width: `${stressBar}%` }}
                />
              </div>
            </div>

            {/* Power-up «Disyuntor CAT» */}
            <button
              type="button"
              disabled={catBreakerBought}
              onClick={handleBuyCatBreaker}
              className={cn(
                "px-2.5 py-1.5 rounded-xl border text-[11px] font-black shrink-0 transition flex items-center gap-1.5",
                catBreakerBought
                  ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                  : "bg-purple-950/60 border-purple-500/40 text-purple-200 hover:bg-purple-900/60",
              )}
            >
              <Sparkles className="size-3 text-amber-400" />
              <span>{catBreakerBought ? "Disyuntor Activo" : "Disyuntor (50 FFOS)"}</span>
            </button>
          </div>

          {/* Tablero con los 3 Cables Chispeantes */}
          <div className="space-y-3">
            {circuits.map((cable, idx) => {
              const isSparking = sparkingCableId === cable.id;
              const isHighest = highestCatActive?.id === cable.id;

              return (
                <div
                  key={cable.id}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                    cable.disconnected
                      ? "bg-emerald-950/30 border-emerald-500/40 opacity-70"
                      : isSparking
                        ? "bg-rose-950/70 border-rose-500 ring-2 ring-rose-500/50"
                        : "bg-slate-900/90 border-slate-800 hover:border-purple-500/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Cable y Termómetro de Interés */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border",
                          cable.disconnected
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : isSparking
                              ? "bg-rose-500/30 text-rose-300 border-rose-500 animate-bounce"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/30",
                        )}
                      >
                        {cable.disconnected ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <span>C{idx + 1}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-black text-white truncate">
                            {cable.name}
                          </h5>
                          {cable.frozenTurns > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 border border-cyan-500/40 text-cyan-300 rounded font-bold">
                              ❄️ Congelado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Saldo: ${cable.balance.toLocaleString()} •{" "}
                          <span
                            className={cn(
                              "font-black",
                              cable.cat > 50
                                ? "text-rose-400"
                                : cable.cat > 25
                                  ? "text-amber-400"
                                  : "text-teal-300",
                            )}
                          >
                            CAT: {cable.cat}% anual
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Palanca Háptica de Desconexión */}
                    <button
                      type="button"
                      disabled={cable.disconnected}
                      onClick={() => handlePullLever(cable)}
                      className={cn(
                        "px-3 py-2 rounded-xl font-black text-xs transition active:scale-95 shadow-md flex items-center gap-1.5 shrink-0",
                        cable.disconnected
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                          : "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950",
                      )}
                    >
                      <Zap className="size-3.5 fill-current" />
                      <span>{cable.disconnected ? "Desconectada" : "Jalar Palanca"}</span>
                    </button>
                  </div>

                  {/* Barra de temperatura térmica del cable */}
                  {!cable.disconnected && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Gauge className="size-3 text-purple-400" />
                        Temperatura de Fricción:
                      </span>
                      <span className="font-bold text-amber-300">
                        {cable.cat > 50
                          ? "🔥 Fuego Crítico (Fuga Máxima)"
                          : cable.cat > 25
                            ? "⚡ Tensión Media"
                            : "❄️ Cable Tibio"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback interactivo de Chispa */}
          {lastFeedback && (
            <div className="p-3 rounded-2xl bg-purple-950/50 border border-purple-500/40 text-xs text-purple-200">
              <p className="font-bold leading-relaxed">{lastFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* PANTALLA 2 (MODO EQUIPO): Votación de la Cocina Compartida */}
      {gameState === "playing" && mode === "team" && (
        <div className="relative z-10 py-3 space-y-4">
          <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-amber-300 uppercase tracking-wider text-[10px]">
                Temporizador Asincrónico Clan
              </span>
              <span className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                <Clock className="size-3.5 text-amber-400" /> 11h 59m restantes
              </span>
            </div>
            <p className="text-slate-300 leading-snug">
              El Clan tiene $1,200 de flujo libre disponible este mes. ¿Hacia dónde se dirige el
              dial de voltaje del grupo?
            </p>
          </div>

          <div className="space-y-3">
            {/* Opción 1: Atacar la tarjeta con 60% CAT */}
            <button
              type="button"
              onClick={() => handleTeamVoteSubmit("opt1")}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-purple-500/40 hover:border-purple-400 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                  Recomendada • Método Avalancha
                </span>
                <span className="text-xs text-amber-300 font-bold">+20 FFOS Bóveda</span>
              </div>
              <h5 className="font-black text-sm text-white mt-1 group-hover:text-purple-300">
                Opción 1: Atacar la Tarjeta del Clan (60% CAT)
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                Cortar de raíz la mayor fuga de intereses compartidos y blindar el presupuesto.
              </p>
            </button>

            {/* Opción 2: Pagar préstamo sin intereses por compromiso social */}
            <button
              type="button"
              onClick={() => handleTeamVoteSubmit("opt2")}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                  Trampa Social • 0% CAT
                </span>
                <span className="text-xs text-rose-400 font-bold">Penalización Mora</span>
              </div>
              <h5 className="font-black text-sm text-white mt-1 group-hover:text-rose-300">
                Opción 2: Pagar el préstamo sin intereses de un amigo
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                Ceder al compromiso social y dejar viva la tarjeta cara (+20% mora grupal).
              </p>
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 3: RESULTADO FINAL / RESUMEN */}
      {gameState === "result" && (
        <div className="relative z-10 py-4 text-center space-y-4">
          <div className="size-16 rounded-full bg-purple-500/20 border-2 border-purple-400 text-purple-300 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-black text-white">
              {stressBar === 0 ? "¡Fuga Desconectada con Éxito!" : "Diagnóstico Finalizado"}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {lastFeedback ||
                "Dominaste el orden de ataque de deudas con el método avalancha. Los pasivos más voraces fueron neutralizados."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-amber-300 flex items-center justify-around">
            <span>Medalla: Ingeniero Eléctrico</span>
            <span>+25 XP</span>
            <span>+50 FFOS</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-sm shadow-lg active:scale-98 transition"
          >
            Continuar en la Ruta de Habilidades
          </button>
        </div>
      )}
    </div>
  );
}

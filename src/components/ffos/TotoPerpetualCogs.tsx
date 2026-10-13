import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  Sparkles,
  Zap,
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
  Vote,
  Wind,
  Coins,
} from "lucide-react";
import { TotoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

// Web Audio API sintetizador para Toto y engranajes
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

function playCogTick() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    /* audio failure ignored */
  }
}

function playWindStorm() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {
    /* audio failure ignored */
  }
}

function playPerpetualResonance() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D mayor brillante
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.09;
      gain.gain.setValueAtTime(0.22, start);
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

interface TotoPerpetualCogsProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function TotoPerpetualCogs({ onClose, onCompleted }: TotoPerpetualCogsProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();

  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Power-up FFOS «Escudo Indexado» (55 FFOS)
  const [indexedShieldActive, setIndexedShieldActive] = useState(false);

  // MODO SOLO: Distribución de los 10,000 créditos
  const totalCapital = 10000;
  const [stocksPct, setStocksPct] = useState<number>(45); // Engranaje Azul: Acciones (+10% nominal)
  const [realEstatePct, setRealEstatePct] = useState<number>(30); // Engranaje Verde: Bienes Raíces (+7.5% nominal)
  const [bondsPct, setBondsPct] = useState<number>(25); // Engranaje Dorado: Bonos (+5.5% nominal)
  // Lo que no suma 100% se considera efectivo inactivo / quieto

  // Dial de Tiempo (1 a 10 años)
  const [yearsTime, setYearsTime] = useState<number>(5);

  const cashPct = Math.max(0, 100 - (stocksPct + realEstatePct + bondsPct));

  // Tasa de inflación simulada: 6.0% anual
  const inflationRate = 0.06;

  // Rendimiento nominal ponderado del portafolio
  const weightedNominalYield = useMemo(() => {
    const yieldStocks = (stocksPct / 100) * 0.1;
    const yieldRE = (realEstatePct / 100) * 0.075;
    const yieldBonds = (bondsPct / 100) * 0.055;
    const yieldCash = (cashPct / 100) * 0.0; // Efectivo = 0%
    return yieldStocks + yieldRE + yieldBonds + yieldCash;
  }, [stocksPct, realEstatePct, bondsPct, cashPct]);

  // Rendimiento real neto (Descontando la inflación)
  const realYield = weightedNominalYield - inflationRate;

  // Valor real de Toto después de X años (Poder adquisitivo)
  const finalRealValue = useMemo(() => {
    // FV = PV * (1 + realYield)^years
    return Math.round(totalCapital * Math.pow(1 + realYield, yearsTime));
  }, [totalCapital, realYield, yearsTime]);

  // Diámetro visual y estado de Toto según rendimiento real
  // Si realYield < 0, Toto se encoge; si realYield > 0, Toto se expande y brilla
  const totoScale = useMemo(() => {
    if (realYield < -0.02) return 0.75; // Encogido
    if (realYield < 0) return 0.88;
    if (realYield > 0.03) return 1.25; // Expandido con brillo
    return 1.05;
  }, [realYield]);

  // MODO EQUIPO / CLAN: Votación de Gobernanza
  const [clanSelectedOption, setClanSelectedOption] = useState<number | null>(null);

  // Feedback y Diálogos de Toto
  const totoDialogue = useMemo(() => {
    if (mode === "solo") {
      if (cashPct >= 80) {
        return "¡Nos estamos encogiendo, explorador! Dejarme quieto en la caja fuerte por miedo al mercado permite que el viento de la inflación me devore sin resistencia.";
      }
      if (stocksPct >= 85) {
        return "Ese engranaje gira demasiado rápido y está vibrando. Si la tormenta cambia de dirección, la maquinaria completa va a salir volando en pedazos.";
      }
      if (realYield > 0.015) {
        return "¡El campo de fuerza esmeralda está activo! El engranaje combinado gira más rápido que el viento gris y nuestro poder de compra se expande.";
      }
      return "Acopla los tres engranajes para ganarle a la tormenta de inflación del 6% anual.";
    } else {
      if (clanSelectedOption === 2) {
        return "La indecisión nos paralizó en seco. El sistema nos arrastró a efectivo por defecto y la carcoma de la inflación nos acaba de arrebatar el 10% del poder de compra colectivo.";
      }
      if (clanSelectedOption === 3) {
        return "Apalancamiento especulativo extremo. Si la tormenta oscila, el fondo entero corre riesgo de liquidación forzada.";
      }
      if (clanSelectedOption === 1) {
        return "¡Brillante consenso mixto! El portafolio diversificado 60/40 crea una coraza impenetrable ante recesiones y alzas de precios.";
      }
      return "La tormenta gris arrecia. El clan debe coordinar la resistencia de sus engranajes compartidos.";
    }
  }, [mode, cashPct, stocksPct, realYield, clanSelectedOption]);

  // Activar Power-up «Escudo Indexado»
  function handleActivateIndexedShield() {
    if (indexedShieldActive) {
      toast.info("Escudo Indexado ya está activo");
      return;
    }
    if (ffosTokens < 55) {
      toast.error("Saldo FFOS insuficiente", {
        description: "Necesitas 55 FFOS para desbloquear el Escudo Indexado.",
      });
      return;
    }
    const spent = spendTokens(55, "Power-up FFOS: Escudo Indexado (Misión 06)");
    if (spent) {
      setIndexedShieldActive(true);
      // Ajusta automáticamente a portafolio óptimo indexado
      setStocksPct(50);
      setRealEstatePct(30);
      setBondsPct(20);
      if (soundEnabled) playPerpetualResonance();
      toast.success("🛡️ ¡Escudo Indexado Activado!", {
        description:
          "Activos vinculados al IPC: volatilidad mitigada y rendimiento real positivo garantizado.",
      });
    }
  }

  // Confirmar resolución en Modo Solo
  async function handleConfirmSolo() {
    if (realYield <= 0 && !indexedShieldActive) {
      // Aprendizaje por error: El efectivo fue devorado por la inflación
      if (soundEnabled) playWindStorm();
      toast.error("¡Pérdida de Poder Adquisitivo!", {
        description: `Tu capital real cayó a $${finalRealValue.toLocaleString()} debido a la inflación acumulada.`,
      });
      await awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Misión 06: Análisis de pérdida real ante inflación",
      });
      setGameState("result");
    } else {
      // Victoria limpia
      if (soundEnabled) playPerpetualResonance();
      await awardPoints({
        xpToAdd: 35,
        tokensToAdd: 50,
        reason: "Misión 06: Victoria Limpia con Motor Antinflación",
      });
      addLocalLessonDone("mission-06-perpetual-cogs", "inflation_shield");
      completeSubLesson("lesson-inflation-shield", "inflation_shield", "inflation-sub-1", 0);
      toast.success("🏆 ¡Victoria de Activos! Medalla «Motor Antinflación» desbloqueada", {
        description: "+35 XP y +50 FFOS acreditados. Rendimiento real por encima de la inflación.",
      });
      setGameState("result");
      if (onCompleted) onCompleted();
    }
  }

  // Confirmar voto en Modo Equipo
  async function handleConfirmTeamVote(option: number) {
    setClanSelectedOption(option);
    if (option === 1) {
      if (soundEnabled) playPerpetualResonance();
      await awardPoints({
        xpToAdd: 35,
        tokensToAdd: 50,
        reason: "Misión 06 (Modo Clan): Consenso Mixto Antinflación",
      });
      addLocalLessonDone("mission-06-perpetual-cogs", "inflation_shield");
      toast.success("⚙️ ¡Portafolio Mixto Aprobado!", {
        description: "El clan disipa la tormenta y suma +25 FFOS a la Bóveda Central.",
      });
      setGameState("result");
      if (onCompleted) onCompleted();
    } else {
      if (soundEnabled) playWindStorm();
      await awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Misión 06 (Modo Clan): Análisis de costo de oportunidad",
      });
      toast.warning("Fuga de Capital en el Clan", {
        description:
          option === 2
            ? "El pánico a efectivo drenó un -10% de valor real."
            : "Apalancamiento excesivo: volatilidad disparada.",
      });
      setGameState("result");
    }
  }

  function handleRestart() {
    setGameState("playing");
    setStocksPct(45);
    setRealEstatePct(30);
    setBondsPct(25);
    setYearsTime(5);
    setIndexedShieldActive(false);
    setClanSelectedOption(null);
  }

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* 1. Cabecera de la Misión */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-inner">
              <Coins className="size-5" />
            </span>
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                Misión 06 • Fase 3
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Multiplicación & Libertad
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-100 tracking-tight">
              El Engranaje Perpetuo
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector Solo vs Equipo */}
          <div className="flex bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[10px] font-black">
            <button
              type="button"
              onClick={() => {
                setMode("solo");
                setGameState("playing");
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg transition",
                mode === "solo" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400",
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
                mode === "team" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400",
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
            <TotoCharacter className="w-28 h-28" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-amber-300">
              «El Transportador de Engranajes de Toto»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Soy <strong className="text-amber-400">Toto</strong>, la moneda holográfica
              geométrica. El dinero en efectivo quieto bajo el colchón o en cuentas inactivas es
              devorado por una tormenta invisible:{" "}
              <span className="text-rose-400 font-bold">la inflación</span>. Haz rodar mi valor
              acoplando los engranajes productivos adecuados.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-left text-xs">
            <div className="bg-blue-950/40 border border-blue-800/40 p-2 rounded-xl">
              <span className="font-black text-sky-300 block">⚙️ Acciones</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Alta velocidad y crecimiento (+10%).
              </p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-xl">
              <span className="font-black text-emerald-300 block">⚙️ Bienes Raíces</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Pesado y constante (+7.5%).</p>
            </div>
            <div className="bg-amber-950/40 border border-amber-800/40 p-2 rounded-xl">
              <span className="font-black text-amber-300 block">⚙️ Bonos</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Renta fija segura (+5.5%).</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition active:scale-[0.98]"
          >
            Iniciar Maquinaria de Engranajes
          </button>
        </div>
      )}

      {/* Pantalla JUEGO EN VIVO: MODO SOLO */}
      {gameState === "playing" && mode === "solo" && (
        <div className="space-y-4">
          {/* Métricas clave: Rendimiento Real vs Inflación */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block">Inflación Anual</span>
              <span className="text-xs font-mono font-black text-rose-400">-6.0%</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block">Rendimiento Real</span>
              <span
                className={cn(
                  "text-xs font-mono font-black",
                  realYield >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {realYield >= 0
                  ? `+${(realYield * 100).toFixed(1)}%`
                  : `${(realYield * 100).toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold block">
                Valor a {yearsTime} años
              </span>
              <span className="text-xs font-mono font-black text-amber-300">
                ${finalRealValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* METÁFORA VISUAL: El Reloj de Engranajes y la Tormenta */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 text-center overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
            {/* Tormenta de Inflación de fondo si realYield < 0 */}
            {realYield <= 0 && (
              <div className="absolute inset-0 bg-slate-800/40 pointer-events-none flex items-center justify-center animate-pulse">
                <div className="text-slate-400 text-xs font-mono font-bold flex items-center gap-1.5 opacity-60">
                  <Wind className="size-4 animate-spin" />
                  <span>Tormenta Gris erosionando efectivo...</span>
                </div>
              </div>
            )}

            {/* Campo de fuerza esmeralda si realYield > 0 */}
            {realYield > 0 && (
              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-2xl ring-2 ring-emerald-500/20" />
            )}

            {/* Representación de Toto en el centro */}
            <div
              className="relative transition-transform duration-500"
              style={{ transform: `scale(${totoScale})` }}
            >
              <TotoCharacter className="w-24 h-24" />
              {realYield > 0.02 && (
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
              )}
            </div>

            <div className="mt-2 text-xs font-black">
              {realYield > 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="size-3.5" />
                  Toto brilla y expande su poder adquisitivo
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="size-3.5" />
                  Toto se oxida y encoge ante el viento gris
                </span>
              )}
            </div>
          </div>

          {/* ACOPLE DE ENGRANAJES: Sliders de Asignación de Activos */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-300">Asignación de Activos ($10,000)</span>
              <span
                className={cn(
                  "font-mono text-xs",
                  cashPct > 30 ? "text-rose-400" : "text-slate-400",
                )}
              >
                {cashPct}% en Efectivo Inactivo
              </span>
            </div>

            {/* Engranaje Azul: Acciones */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-sky-300">⚙️ Engranaje Azul (Acciones +10%)</span>
                <span className="text-sky-400 font-mono font-black">{stocksPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={stocksPct}
                onChange={(e) => {
                  setStocksPct(parseInt(e.target.value, 10));
                  if (soundEnabled) playCogTick();
                }}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Engranaje Verde: Bienes Raíces */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-300">⚙️ Engranaje Verde (Bienes Raíces +7.5%)</span>
                <span className="text-emerald-400 font-mono font-black">{realEstatePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={realEstatePct}
                onChange={(e) => {
                  setRealEstatePct(parseInt(e.target.value, 10));
                  if (soundEnabled) playCogTick();
                }}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Engranaje Dorado: Bonos Soberanos */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-300">⚙️ Engranaje Dorado (Bonos Soberanos +5.5%)</span>
                <span className="text-amber-400 font-mono font-black">{bondsPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={bondsPct}
                onChange={(e) => {
                  setBondsPct(parseInt(e.target.value, 10));
                  if (soundEnabled) playCogTick();
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Dial de Tiempo (1 a 10 años) */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-black mb-1">
                <span className="text-slate-300">Dial Háptico de Tiempo</span>
                <span className="text-amber-300 font-mono">{yearsTime} Años</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={yearsTime}
                onChange={(e) => {
                  setYearsTime(parseInt(e.target.value, 10));
                  if (soundEnabled) playCogTick();
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Diálogo y Power-up Escudo Indexado */}
          <div className="flex items-center justify-between gap-3 bg-amber-950/30 border border-amber-800/40 p-3 rounded-2xl">
            <p className="text-xs text-amber-200 leading-snug flex-1 italic">"{totoDialogue}"</p>
            <button
              type="button"
              onClick={handleActivateIndexedShield}
              disabled={indexedShieldActive || ffosTokens < 55}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 transition active:scale-95",
                indexedShieldActive
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : ffosTokens >= 55
                    ? "bg-slate-900 border-amber-400/80 text-amber-300 hover:bg-amber-400/10"
                    : "bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed",
              )}
            >
              <Shield className="size-3.5 inline mr-1" />
              {indexedShieldActive ? "Escudo Activo" : "Escudo Indexado (55 F)"}
            </button>
          </div>

          {/* Botón de Confirmación de Giro */}
          <button
            type="button"
            onClick={handleConfirmSolo}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Fijar Engranajes y Medir Rendimiento Real
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
                Maquinaria Patrimonial Grupal
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="size-3" />
                12h restantes
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>¡Alerta de Recesión e Inflación Global!</strong> La tormenta gris arrecia. El
              efectivo del Clan corre el riesgo de perder <strong>$400 de poder adquisitivo</strong>{" "}
              en el próximo ciclo.
            </p>
          </div>

          {/* Opciones de Votación del Clan */}
          <div className="space-y-2.5">
            {/* Opción 1: Portafolio Equilibrado */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(1)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 hover:bg-emerald-950/30 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-emerald-300 block">
                  Opción 1: Portafolio Equilibrado (Recomendado por Toto)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  60% acciones indexadas y 40% bonos soberanos. Crea un campo de protección
                  colectivo que disipa la inflación.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">
                Resiliente
              </span>
            </button>

            {/* Opción 2: Liquidación de Pánico */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(2)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-rose-300 block">
                  Opción 2: Liquidación a Efectivo de Pánico
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sacar todo a la caja fuerte por miedo. La inflación devora silenciosamente el
                  capital del clan (-10% valor real).
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black shrink-0">
                Pérdida
              </span>
            </button>

            {/* Opción 3: Apalancamiento Agresivo */}
            <button
              type="button"
              onClick={() => handleConfirmTeamVote(3)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-xs font-black text-amber-300 block">
                  Opción 3: Apalancamiento Agresivo (Préstamo especulativo)
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pedir un crédito a nombre del clan para comprar exclusivamente activos volátiles.
                  Vibración extrema en la maquinaria.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black shrink-0">
                Peligro
              </span>
            </button>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-2xl text-xs text-amber-200 italic">
            "{totoDialogue}"
          </div>
        </div>
      )}

      {/* Pantalla RESULTADO */}
      {gameState === "result" && (
        <div className="py-6 space-y-4 text-center">
          <div className="flex justify-center">
            <TotoCharacter className="w-24 h-24" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-100">
              {realYield > 0 || clanSelectedOption === 1
                ? "¡Maquinaria Antinflación Triunfante!"
                : "Análisis de Erosión de Capital"}
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              {realYield > 0 || clanSelectedOption === 1
                ? "Has demostrado que la diversificación en activos modernos permite a tu moneda expandirse por encima de la inflación acumulada."
                : "Experimentaste cómo el miedo a invertir y el dinero inmóvil destruyen el valor real con mayor severidad que la volatilidad del mercado."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose || handleRestart}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Continuar en el Skill Tree
          </button>
        </div>
      )}
    </div>
  );
}

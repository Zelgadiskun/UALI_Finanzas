import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Zap,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Lock,
  Vote,
  Clock,
  Layers,
  Flame,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { TotoCharacter, ChispaCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { useTransactionsQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

// Web Audio API sintetizador para Toto (Impactos cinéticos, cristal estallando y trituración)
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

// Sonido: Trituración seca de metal y cristal (Éxito del impacto)
function playCrushImpact() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* audio failure ignored */
  }
}

// Sonido: Moneda tambaleando y deteniéndose por falta de inercia
function playWobbleStop() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    /* audio failure ignored */
  }
}

// Sonido: Fusión de fragmento de metal brillante
function playFuseShimmer() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* audio failure ignored */
  }
}

interface DeadQuotaFragment {
  id: string;
  name: string;
  amount: number;
  fused: boolean;
}

interface TotoSnowballBreakerProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function TotoSnowballBreaker({ onClose, onCompleted }: TotoSnowballBreakerProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();
  const txQuery = useTransactionsQuery();

  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Power-up FFOS «Inercia Pura» (60 FFOS)
  const [pureInertiaBought, setPureInertiaBought] = useState(false);

  // Masa y diámetro de Toto acumulada (arrastrar fragmentos de cuotas muertas)
  const [fragments, setFragments] = useState<DeadQuotaFragment[]>([
    { id: "f-1", name: "Cuota Tarjeta A ($85/mes)", amount: 85, fused: false },
    { id: "f-2", name: "Cuota Microcrédito B ($110/mes)", amount: 110, fused: false },
    { id: "f-3", name: "Cuota Mueble C ($65/mes)", amount: 65, fused: false },
  ]);

  // Estado del lanzamiento de la moneda cuesta abajo
  const [isRolling, setIsRolling] = useState(false);
  const [domesCrushed, setDomesCrushed] = useState(0); // 0 a 3 domos de pasivos
  const [totoStalled, setTotoStalled] = useState(false);
  const [stressBar, setStressBar] = useState<number>(75);
  const [lastFeedback, setLastFeedback] = useState<string>("");

  // Modo Equipo: Votación de la Avalancha de Fin de Año
  const [teamVote, setTeamVote] = useState<"opt1" | "opt2" | null>(null);

  // Cantidad de fragmentos fusionados
  const fusedCount = useMemo(() => fragments.filter((f) => f.fused).length, [fragments]);
  const totoDiameterScale = useMemo(() => 1 + fusedCount * 0.28, [fusedCount]);

  // Telemetría Real: Verificar si el usuario registró ahorro o reducción de gastos recientemente
  const hasRecentSavings = useMemo(() => {
    const txs = txQuery.data ?? [];
    return txs.some((t) => t.type === "ahorro" || t.type === "pago_deuda");
  }, [txQuery.data]);

  // Comprar el power-up Inercia Pura por 60 FFOS
  const handleBuyInertia = () => {
    if (pureInertiaBought) return;
    if (ffosTokens < 60) {
      toast.error("Saldo insuficiente de FFOS", {
        description: "Necesitas 60 FFOS para desbloquear la runa de Inercia Pura.",
      });
      return;
    }
    const ok = spendTokens(60, "Desbloqueo Power-up: Inercia Pura (Misión 08)");
    if (!ok) return;

    setPureInertiaBought(true);
    toast.success("🌀 ¡Runa Inercia Pura Activada!", {
      description:
        "La velocidad de trituración de Toto se duplicó y anula penalizaciones intermedias.",
    });
  };

  // Fusionar un fragmento de cuota muerta dentro de Toto
  const handleFuseFragment = (fragId: string) => {
    if (soundEnabled) playFuseShimmer();
    setFragments((prev) => prev.map((f) => (f.id === fragId ? { ...f, fused: true } : f)));
    toast.info("💎 ¡Fragmento compactado!", {
      description: "Toto incrementó su masa, diámetro y tracción cinética.",
    });
  };

  // Gatillo de Lanzamiento: Soltar la moneda cuesta abajo por la rampa
  const handleLaunchToto = () => {
    setIsRolling(true);
    setTotoStalled(false);

    // Condición de éxito: Todos los fragmentos fusionados (o uso de Inercia Pura)
    if (fusedCount === 3 || pureInertiaBought) {
      // Lanzamiento exitoso: tritura los domos uno tras otro
      setTimeout(() => {
        setDomesCrushed(1);
        if (soundEnabled) playCrushImpact();
      }, 500);

      setTimeout(() => {
        setDomesCrushed(2);
        if (soundEnabled) playCrushImpact();
      }, 1000);

      setTimeout(() => {
        setDomesCrushed(3);
        if (soundEnabled) playCrushImpact();
        setIsRolling(false);
        setStressBar(0);
        handleVictory();
      }, 1500);
    } else {
      // Condición de error: Falta de tracción / masa incompleta
      setTimeout(() => {
        setDomesCrushed(1);
        if (soundEnabled) playCrushImpact();
      }, 600);

      setTimeout(() => {
        setIsRolling(false);
        setTotoStalled(true);
        if (soundEnabled) playWobbleStop();
        setStressBar(75);
        setLastFeedback(
          `"¡Me detuve por falta de tracción! Si gastas el dinero liberado en caprichos en lugar de sumarlo a mi masa, la bola de nieve perderá peso y no podrá romper los pasivos." — Toto`,
        );
        toast.error("❄️ La Escarcha de la Estagnación", {
          description: "Toto se detuvo a mitad de la pendiente por falta de masa compactada.",
        });
      }, 1300);
    }
  };

  // Victoria de la lección 8
  const handleVictory = () => {
    setLastFeedback(
      "¡Efecto dominó fulminante! La bola de nieve compactó todos los flujos liberados y trituró los pasivos en cadena.",
    );
    awardPoints({
      xpToAdd: 30,
      tokensToAdd: 45,
      reason: "Victoria Limpia: Misión 08 — El Rompehielos Toto",
    });

    addLocalLessonDone("lesson-snowball", "snowball");
    completeSubLesson("lesson-snowball", "snowball-sub-1");
    completeSubLesson("lesson-snowball", "snowball-sub-2");
    completeSubLesson("lesson-snowball", "snowball-sub-3");

    setGameState("result");
    if (onCompleted) onCompleted();
  };

  // Votación en Modo Equipo
  const handleTeamVoteSubmit = (vote: "opt1" | "opt2") => {
    setTeamVote(vote);
    if (vote === "opt1") {
      if (soundEnabled) playCrushImpact();
      setStressBar(0);
      setLastFeedback(
        "¡Unanimidad del Clan! Todos los pagos mínimos liberados se fusionaron en un solo abono masivo al pasivo común. ¡Ruta de libertad desbloqueada!",
      );
      awardPoints({
        xpToAdd: 30,
        tokensToAdd: 70, // 45 + 25 bono de sinergia
        reason: "Bono de Sinergia Clan: Consolidación de la Bola de Nieve",
      });
      addLocalLessonDone("lesson-snowball", "snowball");
      setGameState("result");
    } else {
      if (soundEnabled) playWobbleStop();
      setStressBar(75);
      setLastFeedback(
        `"La falta de consenso nos fundió los plomos. El temporizador expiró, cada quien se quedó con su parte y perdimos la oportunidad de consolidar el patrimonio del clan." — Chispa`,
      );
      awardPoints({
        xpToAdd: 10,
        tokensToAdd: 15,
        reason: "Aprendizaje por error: Misión 08",
      });
      setGameState("result");
    }
  };

  return (
    <div className="relative bg-slate-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 text-foreground overflow-hidden shadow-2xl max-w-lg mx-auto">
      {/* Fondo temático rampa holográfica de Toto */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header Modal con Guardián Toto */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-amber-500/30">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60">
                Misión 08 • Fase 2 (Nodo 8 — Cierre)
              </span>
              <span className="text-xs">🪙</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white leading-tight">
              El Rompehielos: Consolidación de Bola de Nieve
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
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          <span>Modo Solo</span>
          <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full">
            Inercia
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
              ? "bg-amber-400 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-slate-200",
          )}
        >
          <span>Modo Clan</span>
          <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
            Consolidar
          </span>
        </button>
      </div>

      {/* PANTALLA 1: INTRODUCCIÓN */}
      {gameState === "intro" && (
        <div className="relative z-10 py-4 space-y-4">
          <div className="flex items-center gap-4 bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30">
            <div className="shrink-0 flex items-center justify-center">
              <TotoCharacter className="w-20 h-20" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-200">
                {mode === "solo"
                  ? "La Pendiente de Presión de Toto"
                  : "¡La Avalancha de Fin de Año del Clan!"}
              </h4>
              <p className="text-xs text-slate-300 leading-snug">
                {mode === "solo"
                  ? "Tres domos de pasivos aprisionan tu isla. Fusiona los fragmentos de cuotas muertas en Toto para dotarlo de masa y lánzalo rampa abajo para triturarlos en cadena."
                  : "El Clan tiene una ventana de 12 horas: fusionar todos los pagos mínimos liberados para aplastar el pasivo común o dispersarlos en deseos individuales."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
            <span className="text-slate-400">Recompensas Nodo 8:</span>
            <span className="text-amber-300 flex items-center gap-2">
              <span>+30 XP</span> • <span>+45 FFOS</span> • <span>★★★</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition"
          >
            <span>Subir a la Pendiente de Lanzamiento</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* PANTALLA 2: JUEGO EN VIVO (LA PENDIENTE DE PRESIÓN) */}
      {gameState === "playing" && mode === "solo" && (
        <div className="relative z-10 py-3 space-y-4">
          {/* Telemetría: Barra de Estrés & Power-Up Inercia */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="text-slate-400">Presión de Pasivos</span>
                <span className={stressBar > 50 ? "text-rose-400" : "text-emerald-400"}>
                  {stressBar}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${stressBar}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={pureInertiaBought}
              onClick={handleBuyInertia}
              className={cn(
                "px-2.5 py-1.5 rounded-xl border text-[11px] font-black shrink-0 transition flex items-center gap-1.5",
                pureInertiaBought
                  ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                  : "bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-900/60",
              )}
            >
              <Sparkles className="size-3 text-amber-400" />
              <span>{pureInertiaBought ? "Inercia Activa" : "Inercia (60 FFOS)"}</span>
            </button>
          </div>

          {/* Rampa y Toto holográfico con diámetro dinámico */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 flex flex-col items-center justify-center relative min-h-[170px] overflow-hidden">
            {/* Rampa inclinada visual */}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950 to-transparent border-b-4 border-amber-400/40" />

            {/* Toto con escala de tamaño */}
            <div
              className={cn(
                "relative transition-all duration-500 z-10 flex flex-col items-center justify-center",
                isRolling && "animate-bounce translate-x-12",
                totoStalled && "opacity-60 saturate-50",
              )}
              style={{ transform: `scale(${totoDiameterScale})` }}
            >
              <TotoCharacter className="w-20 h-20" />
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/90 text-amber-300 border border-amber-400/40 mt-1">
                Masa: {fusedCount * 85 + 100} kg
              </span>
            </div>

            {/* Domos de Pasivos abajo en la rampa */}
            <div className="absolute right-3 bottom-2 flex items-center gap-1.5 z-20">
              {[1, 2, 3].map((d) => (
                <div
                  key={d}
                  className={cn(
                    "size-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all",
                    domesCrushed >= d
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300 line-through scale-75"
                      : "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md",
                  )}
                  title={`Domo Pasivo ${d}`}
                >
                  {domesCrushed >= d ? "💥" : `D${d}`}
                </div>
              ))}
            </div>
          </div>

          {/* Fragmentos de Cuotas Muertas para fusionar */}
          <div className="space-y-2">
            <p className="text-xs font-black text-amber-300 uppercase tracking-wide">
              Fragmentos de Cuotas Muertas ({fusedCount}/3 Compactados):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fragments.map((frag) => (
                <button
                  key={frag.id}
                  type="button"
                  disabled={frag.fused || isRolling}
                  onClick={() => handleFuseFragment(frag.id)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition active:scale-95 text-xs font-bold",
                    frag.fused
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 cursor-default"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-400 hover:text-white",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{frag.name}</span>
                    {frag.fused && <CheckCircle2 className="size-3.5 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-amber-400 block mt-0.5">
                    {frag.fused ? "✓ Compactado" : "+ Fusionar a Toto"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón Gatillo de Lanzamiento */}
          <button
            type="button"
            disabled={isRolling}
            onClick={handleLaunchToto}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition"
          >
            <Zap className="size-4 fill-slate-950" />
            <span>
              {fusedCount < 3
                ? `Lanzar con Masa Parcial (${fusedCount}/3)`
                : "¡Lanzar Rompehielos Toto Cuesta Abajo!"}
            </span>
          </button>

          {lastFeedback && (
            <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200">
              <p className="font-bold leading-relaxed">{lastFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* PANTALLA 2 (MODO EQUIPO): Votación de Fin de Año */}
      {gameState === "playing" && mode === "team" && (
        <div className="relative z-10 py-3 space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-black text-amber-300 uppercase tracking-wider text-[10px]">
                Temporizador Asincrónico Clan
              </span>
              <span className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                <Clock className="size-3.5 text-amber-400" /> 11h 59m restantes
              </span>
            </div>
            <p className="text-slate-300 leading-snug">
              ¡La Avalancha de Fin de Año! Los roomies liberaron $450 de pagos mínimos mensuales.
              ¿Qué destino dictamina la votación del Clan?
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleTeamVoteSubmit("opt1")}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                  Recomendada • Bola de Nieve Maciza
                </span>
                <span className="text-xs text-amber-300 font-bold">+25 FFOS Colectivos</span>
              </div>
              <h5 className="font-black text-sm text-white mt-1 group-hover:text-amber-300">
                Opción 1: Fusionar cuotas liberadas en un solo abono masivo común
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                Destruye el siguiente pasivo compartido a velocidad doble sin dispersión.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTeamVoteSubmit("opt2")}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-left transition active:scale-98 shadow-md group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                  Dispersión en Deseos
                </span>
                <span className="text-xs text-rose-400 font-bold">Congela Libertad</span>
              </div>
              <h5 className="font-black text-sm text-white mt-1 group-hover:text-rose-300">
                Opción 2: Repartir el dinero liberado para caprichos individuales
              </h5>
              <p className="text-xs text-slate-400 mt-1">
                La moneda pierde tracción y los pasivos se mantienen aprisionando al Clan.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 3: RESULTADO FINAL / RESUMEN */}
      {gameState === "result" && (
        <div className="relative z-10 py-4 text-center space-y-4">
          <div className="size-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-black text-white">
              ¡Fase 2 Completada con Éxito!
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {lastFeedback ||
                "La bola de nieve de Toto demolió todos los pasivos. ¡Estás listo para consagrar el Protocolo de Cierre de la Fase 2!"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-amber-300 flex items-center justify-around">
            <span>Desbloqueo: Protocolo Cierre 2</span>
            <span>+30 XP</span>
            <span>+45 FFOS</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg active:scale-98 transition"
          >
            Consagrar en la Ruta de Habilidades
          </button>
        </div>
      )}
    </div>
  );
}

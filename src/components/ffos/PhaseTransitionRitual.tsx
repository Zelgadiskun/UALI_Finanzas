import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Compass,
  Coins,
  Zap,
  CheckCircle2,
  Lock,
  Trophy,
  Flame,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  NidoCharacter,
  ChispaCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { useCurrentUserId } from "@/lib/supabase/queries";
import { recordPhaseRitualCompleted } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

// Web Audio API sintetizador táctil para el ritual
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

function playRitualGong() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    /* audio failure ignored */
  }
}

function playElectricSurge() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio failure ignored */
  }
}

function playQuantumHarmonic() {
  const ctx = getSharedAudio();
  if (!ctx) return;
  try {
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  } catch {
    /* audio failure ignored */
  }
}

export type PhaseTransitionType = "phase1_to_2" | "phase2_to_3" | "phase3_mastery";

interface PhaseTransitionRitualProps {
  type: PhaseTransitionType;
  onComplete: () => void;
  onClose?: () => void;
}

export function PhaseTransitionRitual({ type, onComplete, onClose }: PhaseTransitionRitualProps) {
  const userId = useCurrentUserId();
  const [step, setStep] = useState<"greeting" | "transfer" | "evolution">("greeting");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playedMountSound = useRef(false);

  useEffect(() => {
    if (soundEnabled && !playedMountSound.current) {
      playedMountSound.current = true;
      if (type === "phase1_to_2") playRitualGong();
      else if (type === "phase2_to_3") playElectricSurge();
      else playQuantumHarmonic();
    }
  }, [type, soundEnabled]);

  function handleFinalizeRitual() {
    const phaseNum = type === "phase1_to_2" ? 1 : type === "phase2_to_3" ? 2 : 3;
    recordPhaseRitualCompleted(userId, phaseNum, type);
    onComplete();
  }

  function advanceStep() {
    if (step === "greeting") {
      setStep("transfer");
      if (soundEnabled) {
        if (type === "phase1_to_2") playElectricSurge();
        else if (type === "phase2_to_3") playQuantumHarmonic();
        else playQuantumHarmonic();
      }
    } else if (step === "transfer") {
      setStep("evolution");
    } else {
      handleFinalizeRitual();
    }
  }

  // Configuración de texto y arquetipos según la transición
  const config = {
    phase1_to_2: {
      title: "Ritual de Relevo: Del Blindaje a la Red",
      phaseFrom: "Fase 1: Fundamentos y Hábitos Clave",
      phaseTo: "Fase 2: Trabajo en Equipo y Tarjetas",
      envFrom: "Rústico / Forja Antigua de Piedra & Titanio",
      envTo: "Industrial / Dinamos Eléctricos de Cobre Pulido",
      bgStyle:
        "from-stone-950 via-zinc-900 to-purple-950 border-purple-500/40 shadow-purple-500/20",
      speechFromGuardian:
        "«Has blindado tus cimientos y resguardado tu oxígeno vital. Tu alcancía no sufre fugas. Ahora cedo el flujo de energía a Chispa para trazar puentes y sincronizar acuerdos limpios con tu entorno.»",
      speechToGuardian:
        "«¡Recibo el flujo! Mis ángulos de brújula están calibrados. Dejamos atrás la forja de piedra y encendemos los circuitos de la convivencia, las tarjetas y la paridad justa.»",
      fromGuardian: <NidoCharacter className="w-24 h-24" mood="happy" />,
      toGuardian: <ChispaCharacter className="w-24 h-24" />,
      badge: "🛡️ Nido ➔ ⚡ Chispa",
      unlockReward: "Insignia de Relevo: «Dinamo de Cobre»",
    },
    phase2_to_3: {
      title: "Ritual de Relevo: Del Vector a la Expansión",
      phaseFrom: "Fase 2: Trabajo en Equipo y Tarjetas",
      phaseTo: "Fase 3: Multiplicación y Libertad Financiera",
      envFrom: "Industrial / Redes de Vapor y Alta Tensión",
      envTo: "Cuántica / Ciberespacio y Matrices Holográficas",
      bgStyle: "from-purple-950 via-slate-900 to-amber-950 border-amber-500/40 shadow-amber-500/20",
      speechFromGuardian:
        "«Los acuerdos de equipo están equilibrados y las deudas ordenadas sin fricción. Cedo el vector de dirección a Toto para romper el límite lineal e iniciar la fuerza exponencial.»",
      speechToGuardian:
        "«¡Vector recibido en la frecuencia cuántica! Despertamos la maquinaria de engranajes y el interés compuesto. Tu capital ya no camina: empieza a girar a la velocidad de la luz.»",
      fromGuardian: <ChispaCharacter className="w-24 h-24" />,
      toGuardian: <TotoCharacter className="w-24 h-24" />,
      badge: "⚡ Chispa ➔ 🌀 Toto",
      unlockReward: "Insignia de Relevo: «Vector Cuántico»",
    },
    phase3_mastery: {
      title: "Ritual Supremo: Consolidación de la Trinidad UALÍ",
      phaseFrom: "Fase 3: Multiplicación y Libertad",
      phaseTo: "Maestría Absoluta: Bóveda de Libertad Financiera",
      envFrom: "Matrices Cuánticas Digitales",
      envTo: "Trinidad Holográfica Unificada",
      bgStyle: "from-slate-950 via-indigo-950 to-amber-950 border-cyan-500/40 shadow-cyan-500/20",
      speechFromGuardian:
        "«Los tres pilares están completos: Blindaje de Nido, Dirección de Chispa y Multiplicación de Toto. La Bóveda Cuántica de Maestría ha sido sellada y consagrada.»",
      speechToGuardian:
        "«Has derrotado las deudas, neutralizado la inflación y construido tu propia muralla financiera. Ya no eres un aprendiz: eres un Maestro de la Liga.»",
      fromGuardian: (
        <div className="flex items-center gap-2">
          <NidoCharacter className="w-16 h-16" />
          <ChispaCharacter className="w-16 h-16" />
        </div>
      ),
      toGuardian: <TotoCharacter className="w-20 h-20" />,
      badge: "👑 Trinidad Financiera",
      unlockReward: "Insignia Suprema: «Corona de Libertad UALÍ»",
    },
  }[type];

  return (
    <div
      className={cn(
        "relative w-full max-w-lg mx-auto rounded-3xl border p-5 sm:p-6 bg-gradient-to-b text-slate-100 shadow-2xl overflow-hidden transition-all duration-700",
        config.bgStyle,
      )}
    >
      {/* Fondo de partículas y líneas de energía según la transición */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-amber-300 font-mono text-[10px] font-black uppercase tracking-wider">
            {config.badge}
          </span>
          <span className="text-xs font-black text-slate-300">Protocolo de Cierre</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO DEL PASO 1: Despedida y Consagración del Guardián Saliente */}
      {step === "greeting" && (
        <div className="relative z-10 py-3 space-y-4 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center my-2">
            <div className="relative p-2 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-inner">
              {config.fromGuardian}
              <span className="absolute -top-2 -right-2 size-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xs">
                ✓
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {config.phaseFrom} Completada
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
              {config.title}
            </h3>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <p className="text-xs text-slate-200 leading-relaxed italic">
              {config.speechFromGuardian}
            </p>
          </div>

          <button
            type="button"
            onClick={advanceStep}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Iniciar Relevo de Guardianes</span>
            <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* CONTENIDO DEL PASO 2: Transferencia de Flujo & Relevo Dinámico */}
      {step === "transfer" && (
        <div className="relative z-10 py-3 space-y-4 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center gap-4 my-2">
            <div className="opacity-70 scale-90 transition-all">{config.fromGuardian}</div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 text-lg animate-pulse">⚡</span>
              <span className="text-[10px] font-mono font-bold text-slate-400">TRANSFERENCIA</span>
              <div className="h-0.5 w-12 bg-gradient-to-r from-teal-400 via-amber-400 to-purple-400 animate-pulse my-1" />
            </div>
            <div className="scale-110 drop-shadow-xl transition-all">{config.toGuardian}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
              El Nuevo Guardián Toma el Mando
            </span>
            <h4 className="text-base sm:text-lg font-black text-slate-100">
              Despertar de la Nueva Frecuencia
            </h4>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left">
            <p className="text-xs text-slate-200 leading-relaxed italic">
              {config.speechToGuardian}
            </p>
          </div>

          <button
            type="button"
            onClick={advanceStep}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Evolucionar Entorno Gráfico</span>
            <Sparkles className="size-4" />
          </button>
        </div>
      )}

      {/* CONTENIDO DEL PASO 3: Recalibración del Entorno Visual & Consolidación */}
      {step === "evolution" && (
        <div className="relative z-10 py-3 space-y-4 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center my-2">
            <div className="relative p-3 rounded-3xl bg-slate-900/90 border border-amber-500/50 shadow-xl">
              {config.toGuardian}
              <span className="absolute -top-2 -right-2 text-xl animate-bounce">✨</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              {config.unlockReward}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-100">
              Entorno Recalibrado con Éxito
            </h3>
          </div>

          {/* Comparación de evolución de entorno */}
          <div className="grid grid-cols-2 gap-2 text-left text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">
                Entorno Previo
              </span>
              <span className="font-bold text-slate-300 mt-0.5 block">{config.envFrom}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40">
              <span className="text-[9px] text-amber-400 font-bold block uppercase">
                Nuevo Entorno
              </span>
              <span className="font-black text-amber-300 mt-0.5 block">{config.envTo}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinalizeRitual}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4" />
            <span>Consagrar Evolución y Continuar</span>
          </button>
        </div>
      )}
    </div>
  );
}

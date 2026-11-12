import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Coins,
  ShieldCheck,
  RotateCcw,
  Scroll,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HeartHandshake,
  ArrowRight,
  Flame,
} from "lucide-react";
import { NidoCharacter, TotoCharacter } from "@/components/ffos/characters/Characters";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase/client";
import rawDialogues from "@/lib/ffos/babiloniaDialogues.json";

export type PersonajeBabilonia = "Nido" | "Toto" | "Narrador";
export type EmocionBabilonia = "feliz" | "alerta_amigable" | "entusiasta";

export interface OpcionBabilonia {
  texto: string;
  cambio_xp: number;
  cambio_oro: number;
  siguiente_id: string;
}

export interface PasoBabilonia {
  id: string;
  personaje: PersonajeBabilonia;
  texto: string;
  emocion: EmocionBabilonia;
  opciones: OpcionBabilonia[];
}

const DIALOGOS: PasoBabilonia[] = rawDialogues as PasoBabilonia[];

interface BabiloniaFlashcardDialogueProps {
  onComplete?: (resumen: { xpFinal: number; oroFinal: number; pasosRecorridos: number }) => void;
  className?: string;
}

export function BabiloniaFlashcardDialogue({
  onComplete,
  className = "",
}: BabiloniaFlashcardDialogueProps) {
  const [pasoActualId, setPasoActualId] = useState<string>("babilonia_m1_step1");
  const [historialPasos, setHistorialPasos] = useState<string[]>(["babilonia_m1_step1"]);
  const [oro, setOro] = useState<number>(100);
  const [xp, setXp] = useState<number>(0);
  const [ultimoImpacto, setUltimoImpacto] = useState<{ xp: number; oro: number } | null>(null);

  // Encontrar el paso actual en el mapa de diálogos
  const pasoActual = useMemo(() => {
    return DIALOGOS.find((p) => p.id === pasoActualId) || DIALOGOS[0];
  }, [pasoActualId]);

  // Cálculo del progreso con protección Zero-Bug Fallback
  const totalPasosEstimados = 6;
  const progresoRatio = historialPasos.length / totalPasosEstimados;
  const porcentajeCalculado = Math.min(100, Math.round(progresoRatio * 100));

  // Zero-Bug Fallback obligatorio contra valores NaN / null
  const porcentaje = Number(porcentajeCalculado);
  const renderPorcentaje = Number.isNaN(porcentaje) ? 0 : porcentaje;

  const esPasoFinal = pasoActual.opciones.length === 0;

  /**
   * Procesa la decisión tomada en la flashcard:
   * 1. Dispara canvas-confetti inmediatamente si el cambio de XP es positivo.
   * 2. Actualiza el estado visual de React (cero fricción cognitiva para Eduardo).
   * 3. Ejecuta de forma asíncrona supabase.from('user_progress').update() para persistir el avance.
   */
  const handleDecision = async (opcion: OpcionBabilonia) => {
    // Disparo inmediato de confetti si gana XP (refuerzo dopaminérgico instantáneo)
    if (opcion.cambio_xp > 0) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#F59E0B", "#10B981", "#3B82F6", "#FDE047"],
          disableForReducedMotion: true,
        });
      } catch (err) {
        // En caso de entorno SSR o sin canvas, no bloquear el flujo
        console.warn("Confetti skipped:", err);
      }
    }

    // Actualización inmediata de estado local (UI optimista anti-latencia)
    const nuevoOro = Math.max(0, oro + opcion.cambio_oro);
    const nuevoXp = xp + opcion.cambio_xp;
    setOro(nuevoOro);
    setXp(nuevoXp);
    setUltimoImpacto({ xp: opcion.cambio_xp, oro: opcion.cambio_oro });

    // Navegación fluida hacia el siguiente ID
    if (opcion.siguiente_id) {
      setPasoActualId(opcion.siguiente_id);
      setHistorialPasos((prev) => [...prev, opcion.siguiente_id]);
    }

    if (opcion.siguiente_id === "babilonia_m1_concluido" && onComplete) {
      onComplete({
        xpFinal: nuevoXp,
        oroFinal: nuevoOro,
        pasosRecorridos: historialPasos.length + 1,
      });
    }

    // Persistencia asíncrona en Supabase en segundo plano (Zero-Crash / Anti-Cortisol)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id || "demo-eduardo-babilonia";

      await supabase
        .from("user_progress")
        .update({
          xp: nuevoXp,
          oro: nuevoOro,
          current_step_id: opcion.siguiente_id,
          last_decision_xp: opcion.cambio_xp,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } catch (error) {
      // Contención amigable silenciosa para evitar alarmas técnicas en la pantalla
      console.warn("Aviso de sincronización Supabase (modo seguro activo):", error);
    }
  };

  const handleReiniciar = () => {
    setPasoActualId("babilonia_m1_step1");
    setHistorialPasos(["babilonia_m1_step1"]);
    setOro(100);
    setXp(0);
    setUltimoImpacto(null);
  };

  // Renderizado del Avatar según personaje y emoción
  const renderAvatar = () => {
    switch (pasoActual.personaje) {
      case "Nido":
        return (
          <div className="relative flex items-center justify-center">
            {/* Aura cálida de arcilla babilónica */}
            <div className="absolute inset-0 rounded-full bg-amber-600/20 blur-xl animate-pulse" />
            <div className="relative p-2 rounded-2xl bg-gradient-to-b from-amber-900/40 via-amber-950/60 to-slate-900 border border-amber-500/30 shadow-lg shadow-amber-950/50">
              <NidoCharacter
                className="w-20 h-20 sm:w-24 sm:h-24"
                mood={pasoActual.emocion === "alerta_amigable" ? "worried" : "happy"}
              />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
              Consejero de Arcilla
            </span>
          </div>
        );
      case "Toto":
        return (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-600/20 blur-xl animate-pulse" />
            <div className="relative p-2 rounded-2xl bg-gradient-to-b from-blue-900/40 via-blue-950/60 to-slate-900 border border-blue-500/30 shadow-lg shadow-blue-950/50">
              <TotoCharacter className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 backdrop-blur-md">
              Mercader de Babilonia
            </span>
          </div>
        );
      case "Narrador":
      default:
        return (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-600/20 blur-xl" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-slate-900 border border-emerald-500/30 shadow-lg flex items-center justify-center text-emerald-400">
              <Scroll className="w-10 h-10 drop-shadow" />
            </div>
            <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
              Crónica de Ishtar
            </span>
          </div>
        );
    }
  };

  // Badge de emoción anti-cortisol
  const renderBadgeEmocion = () => {
    if (pasoActual.emocion === "alerta_amigable") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
          <span>Contención Protectora</span>
        </div>
      );
    }
    if (pasoActual.emocion === "entusiasta") {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Visión Inspiradora</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Paz y Sabiduría</span>
      </div>
    );
  };

  return (
    <div
      className={`w-full max-w-xl mx-auto p-4 sm:p-6 bg-slate-950 text-slate-100 rounded-3xl border border-amber-900/30 shadow-2xl space-y-6 ${className}`}
    >
      {/* Barra de Estado Superior: Monedas, XP y Fallback Progress */}
      <header className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-amber-400">
            <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-semibold">{oro}</span>
            <span className="text-amber-300/70 text-xs">Oro en Vasija</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Flame className="w-4 h-4 text-indigo-400" />
              <span>{xp} XP</span>
            </div>

            <button
              onClick={handleReiniciar}
              title="Reiniciar misión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de progreso de la misión con Zero-Bug Fallback */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Fase 1: Babilonia</span>
            <span className="font-medium text-amber-300">{renderPorcentaje}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${renderPorcentaje}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </header>

      {/* Contenedor Flashcard con Transición Suave de Entrada */}
      <div className="relative min-h-[310px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={pasoActual.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex flex-col items-center text-center space-y-4"
          >
            {/* Avatar Centrado */}
            <div className="pt-2">{renderAvatar()}</div>

            {/* Identidad del Personaje y Estado Emocional */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-amber-100">
                {pasoActual.personaje === "Narrador"
                  ? "Crónica de Babilonia"
                  : `${pasoActual.personaje} te aconseja`}
              </h3>
              <div>{renderBadgeEmocion()}</div>
            </div>

            {/* Texto de diálogo interactivo (máximo 2 líneas para cero sobrecarga cognitiva) */}
            <div className="w-full px-3 py-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-inner">
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                "{pasoActual.texto}"
              </p>
            </div>

            {/* Feedback flotante del impacto previo si existe */}
            {ultimoImpacto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-xs font-semibold"
              >
                {ultimoImpacto.xp > 0 && (
                  <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    +{ultimoImpacto.xp} XP Sabiduría
                  </span>
                )}
                {ultimoImpacto.oro !== 0 && (
                  <span
                    className={
                      ultimoImpacto.oro > 0
                        ? "text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40"
                        : "text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/40"
                    }
                  >
                    {ultimoImpacto.oro > 0
                      ? `+${ultimoImpacto.oro} Oro`
                      : `${ultimoImpacto.oro} Oro`}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decisiones Rápidas (Máximo 2 opciones tipo Flashcard) */}
      <footer className="space-y-2.5 pt-2">
        {!esPasoFinal ? (
          <div className="grid grid-cols-1 gap-2.5">
            {pasoActual.opciones.map((opcion, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleDecision(opcion)}
                className="group relative w-full text-left p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 hover:from-amber-950/30 hover:to-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-md flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-amber-200 transition-colors">
                    {opcion.texto}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {opcion.cambio_oro > 0 && (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800/40">
                      +{opcion.cambio_oro} Oro
                    </span>
                  )}
                  {opcion.cambio_oro < 0 && (
                    <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-800/40">
                      {opcion.cambio_oro} Oro
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-800/40">
                    +{opcion.cambio_xp} XP
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="text-sm font-semibold">¡Tablilla de Arcilla Conquistada!</p>
              <p className="text-xs text-emerald-300/80 mt-1">
                Eduardo, conservaste {oro} monedas y alcanzaste {xp} XP con serenidad mental.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReiniciar}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-600/30 hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Repetir Aventura Babilónica
            </motion.button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default BabiloniaFlashcardDialogue;

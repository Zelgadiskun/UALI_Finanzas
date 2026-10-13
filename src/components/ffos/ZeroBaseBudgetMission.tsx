import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Calculator,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  HeartHandshake,
  Flame,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

interface ZeroBaseBudgetMissionProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function ZeroBaseBudgetMission({ onClose, onCompleted }: ZeroBaseBudgetMissionProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();

  const totalIncome = 1200;
  const [needs, setNeeds] = useState(0);
  const [wants, setWants] = useState(0);
  const [future, setFuture] = useState(0);

  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [autoLabelActive, setAutoLabelActive] = useState(false);

  const unassigned = Math.max(0, totalIncome - (needs + wants + future));
  const isZeroBaseAchieved = unassigned === 0;

  function handleAutoLabel() {
    if (autoLabelActive) return;
    if (ffosTokens < 30) {
      toast.error("Saldo FFOS insuficiente", {
        description: "Necesitas 30 FFOS para activar el Etiquetado Automático.",
      });
      return;
    }
    const spent = spendTokens(30, "Power-up FFOS: Etiquetado Base Cero");
    if (spent) {
      setAutoLabelActive(true);
      // Asignación perfecta 50/30/20 ($600 / $360 / $240)
      setNeeds(600);
      setWants(360);
      setFuture(240);
      toast.success("⚡ ¡Etiquetado Automático Activado!", {
        description: "Cada dólar ha recibido un destino óptimo. Dinero sin asignar: $0.00.",
      });
    }
  }

  async function handleConfirm() {
    if (unassigned > 0) {
      toast.error("¡Dinero sin asignar detectado!", {
        description: `Tienes $${unassigned} sin nombre ni apellido. Los gastos hormiga lo evaporarán.`,
      });
      return;
    }

    // Victoria
    await awardPoints({
      xpToAdd: 25,
      tokensToAdd: 40,
      reason: "Misión 01: Presupuesto Base Cero completado",
    });

    addLocalLessonDone("mission-01-zero-base", "intro");
    completeSubLesson("lesson-intro", "intro", "intro-sub-1", 0);

    toast.success("🏆 ¡Misión 01 Superada!", {
      description: "Has asignado cada peso con nombre y apellido. +25 XP y +40 FFOS.",
    });

    setGameState("result");
    if (onCompleted) onCompleted();
  }

  function handleRestart() {
    setNeeds(0);
    setWants(0);
    setFuture(0);
    setAutoLabelActive(false);
    setGameState("playing");
  }

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300">
            <Calculator className="size-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-full">
              Misión 01 • Nodo 1
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-100">
              Presupuesto Base Cero
            </h2>
          </div>
        </div>

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

      {gameState === "intro" && (
        <div className="py-4 space-y-4 text-center">
          <div className="flex justify-center my-2">
            <NidoCharacter className="w-24 h-24" mood="saving" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-teal-300">
              «Cada Peso con Nombre y Apellido — El Cerdito Nido»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Nido te enseña que el dinero sin misión se evapora en compras impulsivas. Distribuye
              tu ingreso de <strong>$1,200</strong> en las tres canastas de resguardo hasta que el
              saldo sin asignar sea exactamente <strong>$0.00</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Iniciar Asignación
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="space-y-4">
          {/* Tarjeta de Saldo sin Asignar */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">
                Fondo sin Asignar
              </span>
              <span
                className={cn(
                  "text-xl font-mono font-black",
                  isZeroBaseAchieved ? "text-emerald-400" : "text-amber-400",
                )}
              >
                ${unassigned}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoLabel}
                disabled={autoLabelActive || ffosTokens < 30}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1 transition active:scale-95",
                  autoLabelActive
                    ? "bg-amber-400 text-slate-950 border-amber-300"
                    : ffosTokens >= 30
                      ? "bg-slate-900 border-amber-400/80 text-amber-300 hover:bg-amber-400/10"
                      : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed",
                )}
              >
                <Sparkles className="size-3" />
                <span>Auto-Etiquetar (30 F)</span>
              </button>
            </div>
          </div>

          {/* Tres Canastas */}
          <div className="space-y-3">
            {/* Canasta 1: Necesidades */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-teal-300">1. Necesidades (Techo, Comida, Luz)</span>
                <span className="font-mono text-teal-400">${needs}</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalIncome}
                step="50"
                value={needs}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val + wants + future <= totalIncome) setNeeds(val);
                }}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>

            {/* Canasta 2: Deseos */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-purple-300">2. Deseos (Salidas, Streaming)</span>
                <span className="font-mono text-purple-400">${wants}</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalIncome}
                step="20"
                value={wants}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (needs + val + future <= totalIncome) setWants(val);
                }}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Canasta 3: Futuro / Nido */}
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-amber-300">3. Futuro (Reserva Nido, Deudas)</span>
                <span className="font-mono text-amber-400">${future}</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalIncome}
                step="20"
                value={future}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (needs + wants + val <= totalIncome) setFuture(val);
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-teal-950/30 border border-teal-800/40 p-3 rounded-2xl text-xs text-teal-200 italic">
            {isZeroBaseAchieved
              ? "«¡Perfecto! Todo el ingreso tiene misión. No hay dinero flotante para gastos hormiga.»"
              : "«Ajusta las canastas hasta que la barra superior llegue exactamente a $0.»"}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "w-full py-3.5 font-black text-sm rounded-2xl shadow-lg transition active:scale-98",
              isZeroBaseAchieved
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-teal-500/20"
                : "bg-slate-800 text-slate-400 cursor-not-allowed",
            )}
          >
            Fijar Presupuesto Base Cero
          </button>
        </div>
      )}

      {gameState === "result" && (
        <div className="py-6 space-y-4 text-center">
          <div className="flex justify-center">
            <NidoCharacter className="w-24 h-24" mood="happy" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-100">
              ¡Presupuesto Base Cero Consolidado!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Has asignado el 100% de tus recursos de antemano. Blindaste tu economía contra la
              evaporación involuntaria del sueldo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose || handleRestart}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Continuar en el Skill Tree
          </button>
        </div>
      )}
    </div>
  );
}

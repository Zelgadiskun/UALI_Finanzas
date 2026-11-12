import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Scale,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  PieChart,
  Heart,
  X,
} from "lucide-react";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

interface Rule503020MissionProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function Rule503020Mission({ onClose, onCompleted }: Rule503020MissionProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();

  const totalIncome = 2000;
  const [needsPct, setNeedsPct] = useState(65); // Inicia desbalanceado a propósito
  const [wantsPct, setWantsPct] = useState(25);
  const [futurePct, setFuturePct] = useState(10);

  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [autoCalibrateActive, setAutoCalibrateActive] = useState(false);

  const isBalanced =
    needsPct <= 52 &&
    needsPct >= 48 &&
    wantsPct <= 32 &&
    wantsPct >= 28 &&
    futurePct <= 22 &&
    futurePct >= 18;

  const warningMessage = useMemo(() => {
    if (needsPct > 60)
      return "⚠️ ¡Alerta de asfixia! Las necesidades superan el 60%, dejándote sin margen de maniobra.";
    if (wantsPct > 35)
      return "⚠️ ¡Alerta de exceso! Los deseos superan el 35%, restando protección a tu futuro.";
    if (futurePct < 15)
      return "⚠️ ¡Reserva frágil! Tu futuro tiene menos del 15%. Nido no podrá resistir emergencias.";
    return "✨ ¡Proporción 50/30/20 en equilibrio perfecto! Paz mental y disfrute presentes.";
  }, [needsPct, wantsPct, futurePct]);

  function handleAutoCalibrate() {
    if (autoCalibrateActive) return;
    if (ffosTokens < 35) {
      toast.error("Saldo FFOS insuficiente", {
        description: "Necesitas 35 FFOS para activar la Calibración 50/30/20.",
      });
      return;
    }
    const spent = spendTokens(35, "Power-up FFOS: Calibración 50/30/20");
    if (spent) {
      setAutoCalibrateActive(true);
      setNeedsPct(50);
      setWantsPct(30);
      setFuturePct(20);
      toast.success("📐 ¡Calibración Automática Activada!", {
        description: "Reparto exacto 50/30/20 fijado en tus canastas.",
      });
    }
  }

  async function handleConfirm() {
    if (!isBalanced && !autoCalibrateActive) {
      toast.error("Canastas desequilibradas", {
        description: "Ajusta los sliders hacia 50% Necesidades, 30% Deseos y 20% Futuro.",
      });
      return;
    }

    await awardPoints({
      xpToAdd: 25,
      tokensToAdd: 40,
      reason: "Misión 02: Regla 50/30/20 superada",
    });

    addLocalLessonDone("mission-02-rule-503020", "needs_wants");
    completeSubLesson("lesson-needs-wants", "needs_wants", "needs-wants-sub-2", 1);

    toast.success("🌟 ¡Misión 02 Completada!", {
      description: "Dominaste la regla de oro del presupuesto balanceado. +25 XP y +40 FFOS.",
    });

    setGameState("result");
    if (onCompleted) onCompleted();
  }

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Scale className="size-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
              Misión 02 • Nodo 2
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-100">
              La Regla 50 / 30 / 20
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
            <NidoCharacter className="w-24 h-24" mood="happy" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-amber-300">
              «El Balance de las Tres Canastas»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Ni asfixiarte ahorrando todo ni derrochar sin blindaje. Calibra tus ingresos de{" "}
              <strong>$2,000</strong>: 50% para lo vital, 30% para disfrutar hoy y 20% para tu yo
              del futuro.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Iniciar Calibración 50/30/20
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="space-y-4">
          {/* Barra Visual de las Canastas */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-teal-400">Necesidades {needsPct}%</span>
              <span className="text-purple-400">Deseos {wantsPct}%</span>
              <span className="text-amber-400">Futuro {futurePct}%</span>
            </div>

            <div className="h-4 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
              <div
                className="bg-teal-500 h-full rounded-l-lg transition-all"
                style={{ width: `${needsPct}%` }}
              />
              <div
                className="bg-purple-500 h-full transition-all"
                style={{ width: `${wantsPct}%` }}
              />
              <div
                className="bg-amber-400 h-full rounded-r-lg transition-all"
                style={{ width: `${futurePct}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono font-bold text-slate-400">
              <span>${(totalIncome * needsPct) / 100}</span>
              <span>${(totalIncome * wantsPct) / 100}</span>
              <span>${(totalIncome * futurePct) / 100}</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-teal-300">1. Necesidades (Objetivo: 50%)</span>
                <span className="font-mono text-teal-400">{needsPct}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                value={needsPct}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  const rem = 100 - n;
                  setNeedsPct(n);
                  setWantsPct(Math.round(rem * 0.6));
                  setFuturePct(Math.round(rem * 0.4));
                }}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <p className="text-xs text-slate-300 leading-snug flex-1 italic">{warningMessage}</p>
            <button
              type="button"
              onClick={handleAutoCalibrate}
              disabled={autoCalibrateActive || ffosTokens < 35}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 transition active:scale-95",
                autoCalibrateActive
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : ffosTokens >= 35
                    ? "bg-slate-900 border-amber-400/80 text-amber-300 hover:bg-amber-400/10"
                    : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed",
              )}
            >
              <Sparkles className="size-3 inline mr-1" />
              <span>Calibrar (35 F)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "w-full py-3.5 font-black text-sm rounded-2xl shadow-lg transition active:scale-98",
              isBalanced || autoCalibrateActive
                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/20"
                : "bg-slate-800 text-slate-400",
            )}
          >
            Fijar Reparto 50/30/20
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
              ¡Equilibrio 50/30/20 Desbloqueado!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Tus gastos esenciales están contenidos bajo el 50%, tienes permiso de disfrutar tu 30%
              y tu 20% construye tu tranquilidad futura.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose || (() => setGameState("playing"))}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Continuar en el Skill Tree
          </button>
        </div>
      )}
    </div>
  );
}

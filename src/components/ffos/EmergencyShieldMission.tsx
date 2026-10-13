import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  DollarSign,
  Heart,
  Zap,
  Clock,
  X,
} from "lucide-react";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { useUserPoints } from "@/lib/ffos/points";
import { addLocalLessonDone } from "@/lib/ffos/lessonsData";
import { useEducationProgress } from "@/lib/ffos/educationStore";
import { cn } from "@/lib/utils";

interface EmergencyShieldMissionProps {
  onClose?: () => void;
  onCompleted?: () => void;
}

export function EmergencyShieldMission({ onClose, onCompleted }: EmergencyShieldMissionProps) {
  const { ffosTokens, awardPoints, spendTokens } = useUserPoints();
  const { completeSubLesson } = useEducationProgress();

  const fixedExpensesPerMonth = 800;
  const [monthsCovered, setMonthsCovered] = useState(2); // Inicia en 2 meses (bajo la meta mínima de 3)
  const [storageType, setStorageType] = useState<"liquid" | "locked" | "volatile">("liquid");
  const [gameState, setGameState] = useState<"intro" | "playing" | "result">("intro");
  const [simulatedIncident, setSimulatedIncident] = useState<string | null>(null);
  const [incidentCost, setIncidentCost] = useState<number>(0);
  const [incidentStatus, setIncidentStatus] = useState<"none" | "absorbed" | "failed">("none");
  const [titaniumBoostActive, setTitaniumBoostActive] = useState(false);

  const totalFund = fixedExpensesPerMonth * monthsCovered;
  const isTargetAchieved = monthsCovered >= 3 && storageType === "liquid";

  const storageOptions = [
    {
      id: "liquid",
      name: "Cuenta a la vista / 24h",
      badge: "Recomendado",
      desc: "Líquido de inmediato, sin penalización por retiro y capital seguro.",
      color: "border-teal-500/60 bg-teal-950/30 text-teal-300",
    },
    {
      id: "locked",
      name: "Plazo Fijo Bloqueado a 1 año",
      badge: "Poco flexible",
      desc: "Ganas tasa fija pero no puedes tocarlo ante un imprevisto sin pagar multa.",
      color: "border-amber-500/40 bg-amber-950/20 text-amber-300",
    },
    {
      id: "volatile",
      name: "Acciones Volátiles / Cripto",
      badge: "Alto riesgo",
      desc: "Puede caer un 30% justo el día que necesites pagar una emergencia.",
      color: "border-rose-500/40 bg-rose-950/20 text-rose-300",
    },
  ] as const;

  function handleTitaniumBoost() {
    if (titaniumBoostActive) return;
    if (ffosTokens < 35) {
      toast.error("Saldo FFOS insuficiente", {
        description: "Necesitas 35 FFOS para activar el Refuerzo de Titanio.",
      });
      return;
    }
    const spent = spendTokens(35, "Power-up FFOS: Refuerzo de Titanio");
    if (spent) {
      setTitaniumBoostActive(true);
      setMonthsCovered((prev) => Math.min(6, prev + 2));
      setStorageType("liquid");
      toast.success("🛡️ ¡Refuerzo de Titanio Activado!", {
        description: "+2 meses de cobertura líquida inyectados en Nido.",
      });
    }
  }

  function handleTestIncident() {
    const incidents = [
      { name: "Avería repentina de refrigerador", cost: 350 },
      { name: "Tratamiento dental de urgencia", cost: 450 },
      { name: "Reparación imprevista de frenos del auto", cost: 650 },
    ];
    const picked = incidents[Math.floor(Math.random() * incidents.length)];
    setSimulatedIncident(picked.name);
    setIncidentCost(picked.cost);

    if (totalFund >= picked.cost && storageType === "liquid") {
      setIncidentStatus("absorbed");
      toast.success("🛡️ ¡Impacto Absorbido por Nido!", {
        description: `El fondo pagó $${picked.cost} de contado. Cero deudas y cero estrés.`,
      });
    } else {
      setIncidentStatus("failed");
      toast.error("⚠️ ¡Falla en el Escudo!", {
        description:
          storageType !== "liquid"
            ? "El dinero no está disponible en 24h. Tuviste que usar crédito con interés."
            : "El fondo es insuficiente para cubrir la emergencia de contado.",
      });
    }
  }

  async function handleConfirm() {
    if (!isTargetAchieved && !titaniumBoostActive) {
      toast.error("Blindaje incompleto", {
        description: "Asegura al menos 3 meses de gastos fijos ($2,400) en una cuenta líquida.",
      });
      return;
    }

    await awardPoints({
      xpToAdd: 30,
      tokensToAdd: 45,
      reason: "Misión 03: Escudo de Emergencia superado",
    });

    addLocalLessonDone("mission-03-emergency-shield", "emergency");
    completeSubLesson("lesson-emergency", "emergency", "emergency-sub-1", 0);
    completeSubLesson("lesson-emergency", "emergency", "emergency-sub-2", 1);

    toast.success("🌟 ¡Misión 03 Completada!", {
      description: "Blindaste tu tranquilidad con Nido. +30 XP y +45 FFOS.",
    });

    setGameState("result");
    if (onCompleted) onCompleted();
  }

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-full">
              Misión 03 • Nodo 3
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-100">
              El Escudo de Emergencia
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
            <h3 className="text-base font-black text-teal-300">
              «3 a 6 Meses de Blindaje Líquido»
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Un imprevisto no debe destruir tus planes. Si tus gastos fijos son de{" "}
              <strong>${fixedExpensesPerMonth}/mes</strong>, calibra con Nido tu muralla de
              supervivencia y elige el refugio correcto.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setGameState("playing")}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Calibrar Escudo de Nido
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="space-y-4">
          {/* Tarjeta de Métricas del Escudo */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Gastos básicos mensuales:</span>
              <span className="font-mono font-black text-slate-200">${fixedExpensesPerMonth}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Reserva calculada de Nido:</span>
              <span className="font-mono text-base font-black text-teal-300">
                ${totalFund.toLocaleString()} ({monthsCovered} meses)
              </span>
            </div>

            {/* Barra visual de blindaje */}
            <div className="h-3.5 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-0.5">
              <div
                className={cn(
                  "h-full rounded-lg transition-all duration-300",
                  monthsCovered >= 6
                    ? "bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-300"
                    : monthsCovered >= 3
                      ? "bg-gradient-to-r from-teal-500 to-teal-400"
                      : "bg-amber-500",
                )}
                style={{ width: `${Math.min(100, (monthsCovered / 6) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span className={cn(monthsCovered < 3 && "text-amber-400 font-black")}>
                Frágil (1-2m)
              </span>
              <span
                className={cn(
                  monthsCovered >= 3 && monthsCovered < 6 && "text-teal-300 font-black",
                )}
              >
                Meta Mínima (3m = $2,400)
              </span>
              <span className={cn(monthsCovered >= 6 && "text-emerald-300 font-black")}>
                Titanio (6m = $4,800)
              </span>
            </div>
          </div>

          {/* Slider de Meses */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Meses de Resguardo:</span>
              <span className="font-mono text-teal-300 font-black">{monthsCovered} meses</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={monthsCovered}
              onChange={(e) => setMonthsCovered(parseInt(e.target.value, 10))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          {/* Selección de Refugio del Fondo */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Refugio del Fondo (Dónde vive el dinero):
            </span>
            <div className="grid grid-cols-1 gap-2">
              {storageOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStorageType(opt.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-left transition active:scale-98 flex items-start justify-between gap-2",
                    storageType === opt.id
                      ? opt.color
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{opt.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-current font-bold">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{opt.desc}</p>
                  </div>
                  {storageType === opt.id && (
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-current" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Simulador de Imprevisto */}
          <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-teal-400" />
                <span className="text-xs font-black text-slate-200">Prueba de Tensión</span>
              </div>
              <button
                type="button"
                onClick={handleTestIncident}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 font-black text-xs transition active:scale-95"
              >
                ⚡ Simular Imprevisto
              </button>
            </div>

            {simulatedIncident && (
              <div
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex items-center justify-between",
                  incidentStatus === "absorbed"
                    ? "bg-teal-950/40 border-teal-500/50 text-teal-200"
                    : "bg-rose-950/40 border-rose-500/50 text-rose-200",
                )}
              >
                <span>
                  {simulatedIncident}: <strong>-${incidentCost}</strong>
                </span>
                <span className="font-black text-[10px] uppercase">
                  {incidentStatus === "absorbed" ? "Absorbido ✓" : "Deuda Forzada ✗"}
                </span>
              </div>
            )}
          </div>

          {/* Power-up FFOS */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <p className="text-xs text-slate-300 leading-snug flex-1 italic">
              {isTargetAchieved
                ? "✨ Blindaje óptimo: tienes al menos 3 meses líquidos en Nido."
                : "⚠️ Aumenta a 3+ meses y selecciona Cuenta 24h para resistir emergencias."}
            </p>
            <button
              type="button"
              onClick={handleTitaniumBoost}
              disabled={titaniumBoostActive || ffosTokens < 35}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-black shrink-0 transition active:scale-95",
                titaniumBoostActive
                  ? "bg-teal-400 text-slate-950 border-teal-300"
                  : ffosTokens >= 35
                    ? "bg-slate-900 border-teal-400/80 text-teal-300 hover:bg-teal-400/10"
                    : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed",
              )}
            >
              <Sparkles className="size-3 inline mr-1" />
              <span>Titanio (35 F)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "w-full py-3.5 font-black text-sm rounded-2xl shadow-lg transition active:scale-98",
              isTargetAchieved || titaniumBoostActive
                ? "bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 shadow-teal-500/20"
                : "bg-slate-800 text-slate-400",
            )}
          >
            Fijar Escudo de Emergencia
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
              ¡Escudo de Emergencia Consagrado!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Nido resguarda <strong>${totalFund.toLocaleString()}</strong> de tu dinero en una
              reserva 100% líquida. Los imprevistos ya no son crisis, son simples trámites.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose || (() => setGameState("playing"))}
            className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98"
          >
            Continuar en el Skill Tree
          </button>
        </div>
      )}
    </div>
  );
}

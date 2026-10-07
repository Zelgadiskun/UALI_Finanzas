import React, { useState, useMemo } from "react";
import {
  Calculator,
  CheckCircle2,
  DollarSign,
  Flame,
  HelpCircle,
  Info,
  PiggyBank,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  TotoCharacter,
  NidoCharacter,
  ChispaCharacter,
} from "@/components/ffos/characters/Characters";
import { TutorialModal } from "@/components/ffos/TutorialModal";
import { useSetBudgetsBulkMutation } from "@/lib/supabase/mutations";
import { useUserPoints } from "@/lib/ffos/points";
import { money } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";

interface SmartBudgetAssistantModalProps {
  open: boolean;
  onClose: () => void;
  currentIncome?: number;
  existingBudgets?: { name: string; planned: number; group: string }[];
  onSuccessApply?: () => void;
}

type StrategyType = "50_30_20" | "60_15_25" | "zero_base_custom";

interface CategoryDraft {
  name: string;
  group: "Fijos" | "Variables" | "Discrecional" | "Ahorro";
  bucketType: "necesidades" | "deseos" | "ahorro";
  planned: number;
}

export function SmartBudgetAssistantModal({
  open,
  onClose,
  currentIncome = 1500,
  existingBudgets = [],
  onSuccessApply,
}: SmartBudgetAssistantModalProps) {
  const [income, setIncome] = useState<string>(currentIncome > 0 ? String(currentIncome) : "1500");
  const [strategy, setStrategy] = useState<StrategyType>("50_30_20");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const { awardPoints } = useUserPoints();

  const parsedIncome = Math.max(0, parseFloat(income) || 0);

  // Inicializar o recalcular categorías según la estrategia
  const [categories, setCategories] = useState<CategoryDraft[]>(() => {
    return getDefaultCategoriesForStrategy("50_30_20", parsedIncome);
  });

  const setBudgetsBulkMutation = useSetBudgetsBulkMutation();

  function handleStrategyChange(strat: StrategyType) {
    setStrategy(strat);
    if (strat !== "zero_base_custom") {
      setCategories(getDefaultCategoriesForStrategy(strat, parsedIncome));
    }
  }

  function handleIncomeChange(newVal: string) {
    setIncome(newVal);
    const num = Math.max(0, parseFloat(newVal) || 0);
    if (strategy !== "zero_base_custom") {
      setCategories(getDefaultCategoriesForStrategy(strategy, num));
    }
  }

  function updateCategoryAmount(index: number, newPlanned: number) {
    setCategories((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], planned: Math.max(0, newPlanned) };
      return copy;
    });
    setStrategy("zero_base_custom");
  }

  // Cálculos de totales
  const totalAllocated = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.planned || 0), 0);
  }, [categories]);

  const unassigned = parsedIncome - totalAllocated;
  const isZeroBaseBalanced = Math.abs(unassigned) < 0.01;
  const isOverAllocated = unassigned < -0.01;

  // Distribución por pilares
  const { necesidadesTotal, deseosTotal, ahorroTotal } = useMemo(() => {
    let nec = 0;
    let des = 0;
    let aho = 0;
    for (const c of categories) {
      if (c.bucketType === "necesidades") nec += c.planned;
      else if (c.bucketType === "deseos") des += c.planned;
      else if (c.bucketType === "ahorro") aho += c.planned;
    }
    return {
      necesidadesTotal: nec,
      deseosTotal: des,
      ahorroTotal: aho,
    };
  }, [categories]);

  const necPct = parsedIncome > 0 ? Math.round((necesidadesTotal / parsedIncome) * 100) : 0;
  const desPct = parsedIncome > 0 ? Math.round((deseosTotal / parsedIncome) * 100) : 0;
  const ahoPct = parsedIncome > 0 ? Math.round((ahorroTotal / parsedIncome) * 100) : 0;

  async function handleApplyBudget() {
    if (parsedIncome <= 0) {
      toast.error("Ingresa un monto de ingresos válido antes de continuar.");
      return;
    }

    try {
      const payload = categories.map((c) => ({
        name: c.name,
        group: c.group,
        planned: Math.round(c.planned),
      }));

      await setBudgetsBulkMutation.mutateAsync(payload);
      await awardPoints({ xpToAdd: 50, tokensToAdd: 50, reason: "Presupuesto 0-Base" });
      toast.success("¡Presupuesto Base Cero sincronizado con éxito!", {
        description: `Se han configurado ${categories.length} categorías. +50 XP y +50 FFOS`,
      });

      if (onSuccessApply) {
        onSuccessApply();
      }
      onClose();
    } catch {
      toast.error("Ocurrió un error al guardar tu presupuesto. Inténtalo de nuevo.");
    }
  }

  // Si no está abierto, no renderizar
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl bg-card border border-border/80 shadow-2xl p-5 overflow-hidden max-h-[92vh] flex flex-col justify-between">
        {/* Handle superior móvil */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calculator className="size-5" />
            </div>
            <div>
              <h2 id="assistant-title" className="text-base font-black text-foreground">
                Asistente de Reparto 0-Base
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Divide tus ingresos en porcentajes óptimos sin dejar dinero al azar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="py-1 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30 active:scale-95 transition flex items-center gap-1"
              title="Ver explicación y micro-tutorial 0-Base"
            >
              <HelpCircle className="size-3.5" />
              <span>Manual</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar asistente"
              className="size-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto py-3 space-y-4 pr-0.5">
          {/* 1. Paso 1: Ingreso a repartir este ciclo */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="income-input"
                className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <DollarSign className="size-3.5 text-teal-400" />
                Ingreso disponible para este ciclo
              </label>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-full">
                Sueldo + Remanente
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">
                $
              </span>
              <input
                id="income-input"
                type="number"
                min="0"
                step="50"
                value={income}
                onChange={(e) => handleIncomeChange(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-background border border-border/80 text-lg font-black text-foreground focus:outline-none focus:border-teal-500 transition"
                placeholder="1500.00"
              />
            </div>
          </div>

          {/* 2. Selector de estrategia / plantilla */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
              Estrategia de Reparto
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStrategyChange("50_30_20")}
                className={cn(
                  "p-2.5 rounded-2xl border text-left transition flex flex-col justify-between",
                  strategy === "50_30_20"
                    ? "bg-teal-500/15 border-teal-500/50 shadow-xs"
                    : "bg-card border-border/70 hover:border-border",
                )}
              >
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-teal-400 block">
                    Equilibrado
                  </span>
                  <span className="text-xs font-black text-foreground block mt-0.5">
                    50 / 30 / 20
                  </span>
                </div>
                <span className="text-[9.5px] text-muted-foreground block mt-1 leading-tight">
                  Balance clásico
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStrategyChange("60_15_25")}
                className={cn(
                  "p-2.5 rounded-2xl border text-left transition flex flex-col justify-between",
                  strategy === "60_15_25"
                    ? "bg-amber-500/15 border-amber-500/50 shadow-xs"
                    : "bg-card border-border/70 hover:border-border",
                )}
              >
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-400 block">
                    Acelerador
                  </span>
                  <span className="text-xs font-black text-foreground block mt-0.5">
                    60 / 15 / 25
                  </span>
                </div>
                <span className="text-[9.5px] text-muted-foreground block mt-1 leading-tight">
                  Ahorro & Deudas
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStrategyChange("zero_base_custom")}
                className={cn(
                  "p-2.5 rounded-2xl border text-left transition flex flex-col justify-between",
                  strategy === "zero_base_custom"
                    ? "bg-purple-500/15 border-purple-500/50 shadow-xs"
                    : "bg-card border-border/70 hover:border-border",
                )}
              >
                <div>
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-400 block">
                    Base Cero
                  </span>
                  <span className="text-xs font-black text-foreground block mt-0.5">
                    0-Base Puro
                  </span>
                </div>
                <span className="text-[9.5px] text-muted-foreground block mt-1 leading-tight">
                  Personalizado
                </span>
              </button>
            </div>
          </div>

          {/* 3. Marcador 0-Base en tiempo real */}
          <div
            className={cn(
              "p-3.5 rounded-2xl border transition space-y-2",
              isZeroBaseBalanced
                ? "bg-emerald-500/10 border-emerald-500/40"
                : isOverAllocated
                  ? "bg-rose-500/10 border-rose-500/40"
                  : "bg-amber-500/10 border-amber-500/40",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isZeroBaseBalanced ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : isOverAllocated ? (
                  <Scale className="size-4 text-rose-400" />
                ) : (
                  <Sparkles className="size-4 text-amber-400" />
                )}
                <span className="text-xs font-black text-foreground">
                  {isZeroBaseBalanced
                    ? "¡Presupuesto Base Cero Cuadrado!"
                    : isOverAllocated
                      ? "Sobreasignado (Excedente)"
                      : "Monto pendiente por asignar"}
                </span>
              </div>

              <span
                className={cn(
                  "text-sm font-black tracking-tight",
                  isZeroBaseBalanced
                    ? "text-emerald-400"
                    : isOverAllocated
                      ? "text-rose-400"
                      : "text-amber-400",
                )}
              >
                {unassigned >= 0
                  ? `$${unassigned.toFixed(2)}`
                  : `-$${Math.abs(unassigned).toFixed(2)}`}
              </span>
            </div>

            {/* Barra de progreso de asignación */}
            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, necPct)}%` }}
                className="bg-teal-400 h-full transition-all duration-300"
                title={`Necesidades: ${necPct}%`}
              />
              <div
                style={{ width: `${Math.min(100 - necPct, desPct)}%` }}
                className="bg-purple-400 h-full transition-all duration-300"
                title={`Deseos: ${desPct}%`}
              />
              <div
                style={{ width: `${Math.min(100 - necPct - desPct, ahoPct)}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
                title={`Ahorro: ${ahoPct}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[10.5px] font-bold text-muted-foreground pt-1">
              <span className="flex items-center gap-1 text-teal-400">
                <span className="size-2 rounded-full bg-teal-400" />
                Necesidades {necPct}% (${necesidadesTotal})
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="size-2 rounded-full bg-purple-400" />
                Deseos {desPct}% (${deseosTotal})
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="size-2 rounded-full bg-amber-400" />
                Ahorro {ahoPct}% (${ahorroTotal})
              </span>
            </div>
          </div>

          {/* 4. Categorías editables con sugerencias */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
              Distribución por Categorías
            </span>

            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div
                  key={cat.name}
                  className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-foreground block truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          cat.bucketType === "necesidades"
                            ? "bg-teal-400"
                            : cat.bucketType === "deseos"
                              ? "bg-purple-400"
                              : "bg-amber-400",
                        )}
                      />
                      {cat.group} ·{" "}
                      {parsedIncome > 0 ? Math.round((cat.planned / parsedIncome) * 100) : 0}%
                    </span>
                  </div>

                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={cat.planned || ""}
                      onChange={(e) => updateCategoryAmount(idx, parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-black text-right text-foreground focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Consejos en vivo de los Guardianes UALÍ */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/80 flex items-center gap-3">
            <div className="size-9 shrink-0">
              {necPct > 60 ? (
                <TotoCharacter className="size-full" />
              ) : ahoPct >= 20 ? (
                <NidoCharacter className="size-full" />
              ) : (
                <ChispaCharacter className="size-full" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-black text-foreground block">
                {necPct > 60
                  ? "Toto aconseja: Ajustar necesidades"
                  : ahoPct >= 20
                    ? "Nido celebra: ¡Meta de ahorro blindada!"
                    : "Chispa te anima: Disfrute equilibrado"}
              </span>
              <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
                {necPct > 60
                  ? "Tus necesidades superan el 60% del ingreso. Considera reducir gastos variables para no asfixiar tu margen."
                  : ahoPct >= 20
                    ? "Al destinar al menos el 20% a tu Fondo Nido, aceleras la meta de tranquilidad financiera."
                    : "Tu reparto deja espacio para salir y disfrutar sin comprometer los compromisos del hogar."}
              </p>
            </div>
          </div>
        </div>

        {/* Botón de acción final */}
        <div className="pt-3 border-t border-border/60 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-bold text-xs active:scale-95 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={setBudgetsBulkMutation.isPending || parsedIncome <= 0}
            onClick={handleApplyBudget}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-teal-500/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck className="size-4 stroke-[2.5]" />
            <span>
              {setBudgetsBulkMutation.isPending
                ? "Sincronizando..."
                : "Guardar y Aplicar Presupuesto"}
            </span>
          </button>
        </div>
      </div>

      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        initialStepId="zero-base-budget"
      />
    </div>
  );
}

// Generador de categorías y montos iniciales según estrategia
function getDefaultCategoriesForStrategy(strategy: StrategyType, income: number): CategoryDraft[] {
  if (strategy === "60_15_25") {
    // 60% Necesidades ($900 en 1500)
    // 15% Deseos ($225 en 1500)
    // 25% Ahorro ($375 en 1500)
    const nec = income * 0.6;
    const des = income * 0.15;
    const aho = income * 0.25;

    return [
      {
        name: "Comida & Súper",
        group: "Fijos",
        bucketType: "necesidades",
        planned: Math.round(nec * 0.45),
      },
      {
        name: "Servicios & Luz",
        group: "Fijos",
        bucketType: "necesidades",
        planned: Math.round(nec * 0.3),
      },
      {
        name: "Transporte",
        group: "Variables",
        bucketType: "necesidades",
        planned: Math.round(nec * 0.25),
      },
      {
        name: "Salidas & Deseos",
        group: "Discrecional",
        bucketType: "deseos",
        planned: Math.round(des),
      },
      {
        name: "Fondo Nido (Reserva)",
        group: "Ahorro",
        bucketType: "ahorro",
        planned: Math.round(aho),
      },
    ];
  }

  // 50 / 30 / 20 por defecto
  const nec = income * 0.5;
  const des = income * 0.3;
  const aho = income * 0.2;

  return [
    {
      name: "Comida & Súper",
      group: "Fijos",
      bucketType: "necesidades",
      planned: Math.round(nec * 0.45),
    },
    {
      name: "Servicios & Luz",
      group: "Fijos",
      bucketType: "necesidades",
      planned: Math.round(nec * 0.3),
    },
    {
      name: "Transporte",
      group: "Variables",
      bucketType: "necesidades",
      planned: Math.round(nec * 0.25),
    },
    {
      name: "Salidas & Deseos",
      group: "Discrecional",
      bucketType: "deseos",
      planned: Math.round(des),
    },
    {
      name: "Fondo Nido (Reserva)",
      group: "Ahorro",
      bucketType: "ahorro",
      planned: Math.round(aho),
    },
  ];
}

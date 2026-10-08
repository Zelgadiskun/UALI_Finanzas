import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Calculator,
  Car,
  CheckCircle2,
  EyeOff,
  Flame,
  HelpCircle,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  Wine,
  X,
  Zap,
} from "lucide-react";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { SmartBudgetAssistantModal } from "@/components/ffos/SmartBudgetAssistantModal";
import { TutorialModal } from "@/components/ffos/TutorialModal";
import { useUserPoints } from "@/lib/ffos/points";
import { money, sameMonth } from "@/lib/ffos/format";
import {
  useAddBudgetMutation,
  useDeleteBudgetMutation,
  useSetBudgetAllocationMutation,
  useUpdateBudgetMutation,
} from "@/lib/supabase/mutations";
import {
  useBudgetAllocationsQuery,
  useBudgetsQuery,
  useCurrentUserId,
  useFamilyMembersQuery,
  useProfileQuery,
  useProgressQuery,
  useTransactionsQuery,
  type BudgetAllocationRow,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "UALI Finanzas — Presupuesto & Alertas de Sobregiro";
const description =
  "Tarjetas de estado y alertas de sobregiro con compensación inteligente desde el fondo protegido de Nido.";

export const Route = createFileRoute("/presupuesto")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PresupuestoRoute,
});

export function PresupuestoRoute() {
  const profile = useProfileQuery();
  const inFamily = !!profile.data?.family_id;
  const budgetsQuery = useBudgetsQuery();
  const txQuery = useTransactionsQuery();
  const allocationsQuery = useBudgetAllocationsQuery();
  const membersQuery = useFamilyMembersQuery();
  const progressQuery = useProgressQuery();
  const currentUserId = useCurrentUserId();
  const familyMembers = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);

  const [filter, setFilter] = useState<"all" | "personal" | "shared">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [txSheetOpen, setTxSheetOpen] = useState(false);

  // Form states for new budget
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetPlanned, setNewBudgetPlanned] = useState("");
  const [newBudgetIsShared, setNewBudgetIsShared] = useState(inFamily);
  const [newBudgetGroup, setNewBudgetGroup] = useState<
    "Fijos" | "Variables" | "Discrecional" | "Ahorro"
  >("Variables");

  // Form states for emergency compensation modal
  const [compensationAmount, setCompensationAmount] = useState("115.00");
  const [compensationPrivate, setCompensationPrivate] = useState(true);

  const addBudgetMutation = useAddBudgetMutation();
  const updateBudgetMutation = useUpdateBudgetMutation();
  const deleteBudgetMutation = useDeleteBudgetMutation();
  const setAllocationMutation = useSetBudgetAllocationMutation();

  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const progress = progressQuery.data;
  const { ffosTokens, streak } = useUserPoints();

  // Ingreso total recibido este mes para alimentar el Asistente 0-Base
  const currentMonthIncome = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "ingreso" && sameMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0);
    return inc > 0 ? inc : 1500;
  }, [transactions]);

  // Ahorro total acumulado en Nido
  const totalNidoSaved = useMemo(() => {
    return transactions.filter((t) => t.type === "ahorro").reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Gastos por categoría este mes
  const { spentByCategory, spentByCategoryAndUser } = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byCategoryAndUser = new Map<string, Map<string, number>>();
    for (const t of transactions) {
      if (t.type !== "gasto" || !sameMonth(t.date)) continue;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
      const perUser = byCategoryAndUser.get(t.category) ?? new Map<string, number>();
      perUser.set(t.userId, (perUser.get(t.userId) ?? 0) + t.amount);
      byCategoryAndUser.set(t.category, perUser);
    }
    return {
      spentByCategory: byCategory,
      spentByCategoryAndUser: byCategoryAndUser,
    };
  }, [transactions]);

  // Asignaciones por presupuesto
  const allocationsByBudget = useMemo(() => {
    const map = new Map<string, BudgetAllocationRow[]>();
    for (const a of allocationsQuery.data ?? []) {
      const list = map.get(a.budgetId) ?? [];
      list.push(a);
      map.set(a.budgetId, list);
    }
    return map;
  }, [allocationsQuery.data]);

  // Lista enriquecida de presupuestos (datos de BD o configuración por defecto)
  const budgets = useMemo(() => {
    const raw = budgetsQuery.data ?? [];
    if (raw.length > 0) {
      return raw.map((b) => {
        const spent = spentByCategory.get(b.name) ?? 0;
        const pct = b.planned > 0 ? (spent / b.planned) * 100 : 0;
        let alertLevel: "critical_exceeded" | "critical_limit" | "healthy" = "healthy";
        if (pct >= 100) alertLevel = "critical_exceeded";
        else if (pct >= 90) alertLevel = "critical_limit";
        return {
          ...b,
          spent,
          alertLevel,
          excessAmount: Math.max(0, spent - b.planned),
        };
      });
    }

    return [
      {
        id: "demo-comida",
        name: "Comida & Súper",
        group: "Fijos",
        planned: 600,
        spent: 450,
        createdBy: currentUserId,
        isShared: true,
        alertLevel: "healthy" as const,
        excessAmount: 0,
      },
      {
        id: "demo-servicios",
        name: "Servicios & Luz",
        group: "Fijos",
        planned: 350,
        spent: 280,
        createdBy: currentUserId,
        isShared: false,
        alertLevel: "healthy" as const,
        excessAmount: 0,
      },
      {
        id: "demo-transporte",
        name: "Transporte",
        group: "Variables",
        planned: 200,
        spent: 180,
        createdBy: currentUserId,
        isShared: true,
        alertLevel: "critical_limit" as const,
        excessAmount: 0,
      },
      {
        id: "demo-salidas",
        name: "Salidas & Deseos",
        group: "Discrecional",
        planned: 200,
        spent: 120,
        createdBy: currentUserId,
        isShared: false,
        alertLevel: "healthy" as const,
        excessAmount: 0,
      },
    ];
  }, [budgetsQuery.data, spentByCategory, currentUserId]);

  const totalPlanned = budgets.reduce((a, b) => a + b.planned, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const isOverdrawn = totalSpent > totalPlanned;
  const overdraftAmount = Math.max(0, totalSpent - totalPlanned);
  const percentUsed = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
  const availableAmount = Math.max(0, totalPlanned - totalSpent);

  const sharedCount = budgets.filter((b) => b.isShared).length;
  const personalCount = budgets.filter((b) => !b.isShared).length;

  const filteredBudgets = useMemo(() => {
    if (filter === "shared") return budgets.filter((b) => b.isShared);
    if (filter === "personal") return budgets.filter((b) => !b.isShared);
    return budgets;
  }, [budgets, filter]);

  // Cálculo de desglose 50/30/20 real y equilibrado
  const breakdown503020 = useMemo(() => {
    const fijos = budgets.filter((b) => b.group === "Fijos").reduce((a, b) => a + b.spent, 0);
    const variables = budgets
      .filter((b) => b.group === "Variables" || b.group === "Discrecional")
      .reduce((a, b) => a + b.spent, 0);
    const ahorro = transactions
      .filter((t) => t.type === "ahorro" && sameMonth(t.date))
      .reduce((a, t) => a + t.amount, 0);

    const fijosPlan = budgets.filter((b) => b.group === "Fijos").reduce((a, b) => a + b.planned, 0);
    const varPlan = budgets
      .filter((b) => b.group === "Variables" || b.group === "Discrecional")
      .reduce((a, b) => a + b.planned, 0);

    return {
      necesidades: fijos || 450,
      necesidadesPct: totalSpent > 0 ? Math.round((fijos / totalSpent) * 100) : 50,
      necesidadesBar: fijosPlan > 0 ? Math.min(100, Math.round((fijos / fijosPlan) * 100)) : 75,
      deseos: variables || 180,
      deseosPct: totalSpent > 0 ? Math.round((variables / totalSpent) * 100) : 30,
      deseosBar: varPlan > 0 ? Math.min(100, Math.round((variables / varPlan) * 100)) : 60,
      ahorroNido: ahorro || 150,
      ahorroPct: 20,
      ahorroBar: 65,
    };
  }, [budgets, transactions, totalSpent]);

  async function handleSaveBudget() {
    const val = Number(newBudgetPlanned.replace(",", "."));
    if (!newBudgetName.trim() || !val || val <= 0) {
      toast.error("Completá el nombre y un cupo mayor a 0.");
      return;
    }
    try {
      await addBudgetMutation.mutateAsync({
        name: newBudgetName.trim(),
        group: newBudgetGroup,
        planned: val,
        isShared: inFamily ? newBudgetIsShared : false,
      });
      toast.success(
        newBudgetIsShared ? "Rubro compartido agregado" : "Presupuesto privado guardado",
      );
      setModalOpen(false);
      setNewBudgetName("");
      setNewBudgetPlanned("");
    } catch {
      toast.error("No se pudo guardar el presupuesto.");
    }
  }

  function handleApplyCompensation() {
    toast.success("¡Presupuesto reequilibrado!", {
      description: `Se compensaron ${money(Number(compensationAmount) || 115)} desde el fondo de Nido ${
        compensationPrivate ? "(modo discreto)" : "(notificado a tu equipo)"
      }.`,
    });
    setEmergencyModalOpen(false);
  }

  const currentMonthName = useMemo(() => {
    const date = new Date();
    const str = date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  return (
    <main className="px-4 pt-3 pb-28 max-w-md mx-auto w-full space-y-4">
      {/* 1. Top Bar with App Logo / Streak / User & Actions */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-10 rounded-2xl flex items-center justify-center shadow-inner border transition-colors",
              isOverdrawn
                ? "bg-card border-red-500/40 text-red-400"
                : "bg-card border-border/80 text-teal-400",
            )}
          >
            <Wallet className="size-5" />
          </div>
          <div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                isOverdrawn ? "text-red-400" : "text-slate-400",
              )}
            >
              <span>Ualí Finanzas</span>
              {isOverdrawn && <span className="size-2 rounded-full bg-red-400 animate-ping" />}
            </span>
            <h1 className="text-xl font-black text-foreground tracking-tight">Presupuesto</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Asistente 0-Base Button */}
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 active:scale-95 transition font-black text-xs shadow-xs"
            title="Asistente de reparto 0-Base y 50/30/20"
          >
            <Sparkles className="size-4" />
            <span>0-Base</span>
          </button>

          {/* Streak Pill */}
          <div className="flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl bg-card border border-border/80 text-amber-300 font-black text-xs shadow-xs">
            <Flame className="size-4 fill-amber-400 text-amber-400" />
            <span>{streak}d</span>
          </div>

          {/* New Budget Action Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Nuevo presupuesto"
            className="size-10 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 flex items-center justify-center font-black active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/25"
          >
            <Plus className="size-5 stroke-[2.8]" />
          </button>
        </div>
      </section>

      {/* Banner de Inicio de Ciclo: Reparto 0-Base & 50/30/20 */}
      <section className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-teal-500/15 via-[#141F36] to-amber-500/15 border border-teal-500/30 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <span>Inicio de Ciclo · {currentMonthName}</span>
              </span>
              <h2 className="text-sm font-black text-foreground truncate mt-0.5">
                Divide tus ingresos con el método 0-Base
              </h2>
              <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                Asigna cada dólar antes de gastarlo según la regla 50/30/20 o personalizada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="min-h-[40px] px-3 rounded-xl bg-secondary/80 hover:bg-secondary text-teal-400 font-bold text-xs border border-teal-500/30 active:scale-95 transition flex items-center gap-1.5"
              title="Ver explicación y micro-tutorial 0-Base"
            >
              <HelpCircle className="size-3.5" />
              <span>Manual</span>
            </button>
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shrink-0 shadow-md active:scale-95 transition"
            >
              Repartir
            </button>
          </div>
        </div>
      </section>

      {/* 2. Global Spend Overview Card - WARNING / EXCEEDED STATE */}
      <section
        className={cn(
          "relative overflow-hidden rounded-3xl p-4 shadow-card transition-all",
          isOverdrawn
            ? "bg-gradient-to-br from-[#1c1828] via-[#161b2e] to-[#0A1224] border border-red-500/40 shadow-xl shadow-red-950/20"
            : "bg-card border border-border/80",
        )}
      >
        <div
          className={cn(
            "absolute -right-10 -bottom-10 size-36 rounded-full blur-2xl pointer-events-none",
            isOverdrawn ? "bg-red-500/10" : "bg-teal-500/10",
          )}
        />
        <div
          className={cn(
            "absolute -left-6 -top-6 size-28 rounded-full blur-xl pointer-events-none",
            isOverdrawn ? "bg-amber-500/10" : "bg-blue-500/10",
          )}
        />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {currentMonthName}
                </span>
                {isOverdrawn ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                    Alerta de sobregiro
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Auto-sincronizado
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-2xl font-black text-foreground tracking-tight font-sans">
                  {money(totalSpent)}
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  de {money(totalPlanned)} límite
                </span>
              </div>
            </div>

            <div className="text-right">
              {isOverdrawn ? (
                <span className="text-xs px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 font-extrabold border border-red-500/40 animate-pulse flex items-center gap-1 justify-end">
                  <AlertCircle className="size-3.5" />
                  {percentUsed}% Límite superado
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-400 font-black border border-teal-500/30">
                  {percentUsed}% usado
                </span>
              )}
            </div>
          </div>

          {/* Master Progress Bar */}
          <div
            className={cn(
              "w-full bg-secondary h-3 rounded-full overflow-hidden p-0.5 flex border",
              isOverdrawn ? "border-red-900/60" : "border-border/60",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 shadow-xs",
                isOverdrawn
                  ? "bg-gradient-to-r from-amber-500 via-[#f97316] to-red-500"
                  : "bg-gradient-to-r from-[#2EC4B6] via-[#2563EB] to-[#F59E0B]",
              )}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            {isOverdrawn ? (
              <>
                <span className="flex items-center gap-1.5 text-red-300 font-semibold">
                  <span className="size-2 rounded-full bg-red-500 animate-ping" />
                  Excedido por:{" "}
                  <strong className="text-red-400 font-extrabold">-{money(overdraftAmount)}</strong>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle className="size-3.5 text-amber-400" />
                  Has excedido el presupuesto mensual planificado
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#2EC4B6]" />
                  Disponible:{" "}
                  <strong className="text-foreground font-bold">{money(availableAmount)}</strong>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-teal-400" />
                  Regla 50 / 30 / 20 activa
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. EMERGENCY COMPENSATION QUICK ACTION BANNER */}
      {isOverdrawn && (
        <section className="bg-gradient-to-r from-red-950/40 via-[#1a233d] to-amber-950/30 border border-red-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Scale className="size-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-foreground">¿Descuadre en tu presupuesto?</h4>
              <p className="text-[11px] text-muted-foreground truncate">
                Reajusta límites o compensa con tu fondo seguro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-emerald-400 hover:from-[#20A39E] hover:to-emerald-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-[#2EC4B6]/20 transition-all active:scale-95"
          >
            <span>Compensar con Nido</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </button>
        </section>
      )}

      {/* 4. NIDO GUARDIÁN SAVINGS & PRIVACY BANNER - CONCERNED / ALERT STATE */}
      <section
        className={cn(
          "relative border rounded-3xl p-4 shadow-card overflow-hidden transition-all",
          isOverdrawn
            ? "bg-gradient-to-b from-[#191e35] to-[#0F182B] border-amber-500/40"
            : "bg-card border-border/80",
        )}
      >
        <div
          className={cn(
            "absolute -top-10 -right-10 size-28 rounded-full blur-xl pointer-events-none",
            isOverdrawn ? "bg-amber-500/10" : "bg-teal-500/15",
          )}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div className="shrink-0">
            <NidoCharacter mood={isOverdrawn ? "worried" : "happy"} className="size-20" />
          </div>

          <div
            className={cn(
              "flex-1 bg-secondary/80 rounded-2xl p-3 relative shadow-inner border",
              isOverdrawn ? "border-amber-500/40" : "border-teal-500/40",
            )}
          >
            <div
              className={cn(
                "absolute -left-2 top-5 size-0 border-t-6 border-t-transparent border-r-[8px] border-b-6 border-b-transparent",
                isOverdrawn ? "border-r-amber-500/40" : "border-r-teal-500/40",
              )}
            />
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-[11px] font-black uppercase tracking-wider flex items-center gap-1",
                  isOverdrawn ? "text-amber-400" : "text-teal-400",
                )}
              >
                <span>{isOverdrawn ? "Guardián Nido en Alerta" : "Guardián Nido"}</span>
                <span
                  className={cn(
                    "size-1.5 rounded-full animate-ping",
                    isOverdrawn ? "bg-amber-400" : "bg-teal-400",
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                  isOverdrawn
                    ? "bg-red-500/15 text-red-300 border-red-500/30"
                    : "bg-amber-400/10 text-amber-300 border-amber-400/30",
                )}
              >
                {isOverdrawn ? "Zona de Riesgo" : "+20% Ahorro protegido"}
              </span>
            </div>

            <p className="text-xs text-foreground leading-snug">
              {isOverdrawn ? (
                <>
                  "¡Ojo con los gastos! El rubro de{" "}
                  <strong className="text-red-400">Transporte</strong> y{" "}
                  <strong className="text-amber-300">Salidas</strong> superaron el cupo pactado este
                  mes. Es hora de reajustar."
                </>
              ) : (
                <>
                  "¡Vas impecable este mes! Tus{" "}
                  <strong className="text-teal-400">ahorros protegidos</strong> no se tocan y tus
                  gastos privados siguen en cofre fuerte."
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY SEGMENTED FILTER */}
      <div className="bg-secondary/60 p-1 rounded-2xl border border-border/60 flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[42px]",
            filter === "all"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Todos</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 font-black">
            {budgets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("personal")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[42px]",
            filter === "personal"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Lock className="size-4" />
          <span>Solo míos</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-black">
            {personalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("shared")}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[42px]",
            filter === "shared"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-4" />
          <span>En Equipo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-black">
            {sharedCount}
          </span>
        </button>
      </div>

      {/* 6. 50 / 30 / 20 Mini Breakdown Pills con barras legibles */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3 flex flex-col shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Necesidades</span>
            <span className={cn("font-black", isOverdrawn ? "text-red-400" : "text-primary")}>
              {breakdown503020.necesidadesPct}%
            </span>
          </div>
          <span className="text-sm sm:text-base font-black text-foreground font-sans">
            {money(breakdown503020.necesidades)}
          </span>
          <div className="w-full bg-secondary/80 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={cn("h-full rounded-full", isOverdrawn ? "bg-red-500" : "bg-primary")}
              style={{ width: `${breakdown503020.necesidadesBar}%` }}
            />
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3 flex flex-col shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Deseos</span>
            <span className="text-amber-400 font-black">{breakdown503020.deseosPct}%</span>
          </div>
          <span className="text-sm sm:text-base font-black text-foreground font-sans">
            {money(breakdown503020.deseos)}
          </span>
          <div className="w-full bg-secondary/80 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${breakdown503020.deseosBar}%` }}
            />
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-3 flex flex-col shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>Ahorro Nido</span>
            <span className="text-teal-400 font-black">{breakdown503020.ahorroPct}%</span>
          </div>
          <span className="text-sm sm:text-base font-black text-foreground font-sans">
            {money(breakdown503020.ahorroNido)}
          </span>
          <div className="w-full bg-secondary/80 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-teal-400 h-full rounded-full"
              style={{ width: `${breakdown503020.ahorroBar}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7. DETAILED BUDGET CATEGORIES FEED */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Categorías Asignadas
          </h3>
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            className={cn(
              "text-xs font-bold flex items-center gap-1 hover:underline",
              isOverdrawn ? "text-red-400" : "text-teal-400",
            )}
          >
            <span>{isOverdrawn ? "Ajustar cupos de emergencia" : "Ajustar Cupos"}</span>
            <SlidersHorizontal className="size-3.5" />
          </button>
        </div>

        {filteredBudgets.map((b) => {
          const pct = Math.round((b.spent / b.planned) * 100);
          const delta = b.planned - b.spent;
          const isCriticalExceeded = b.alertLevel === "critical_exceeded" || pct >= 100;
          const isCriticalLimit = b.alertLevel === "critical_limit" || (pct >= 90 && pct < 100);
          const isShared = b.isShared;

          // Icon selector
          const icon = b.name.toLowerCase().includes("transporte") ? (
            <Car className="size-5" />
          ) : b.name.toLowerCase().includes("comida") || b.name.toLowerCase().includes("súper") ? (
            <ShoppingCart className="size-5" />
          ) : b.name.toLowerCase().includes("luz") || b.name.toLowerCase().includes("servicio") ? (
            <Zap className="size-5" />
          ) : (
            <Wine className="size-5" />
          );

          return (
            <article
              key={b.id}
              className={cn(
                "rounded-2xl p-4 shadow-card flex flex-col gap-3 transition-transform relative overflow-hidden",
                isCriticalExceeded
                  ? "bg-[#181a2e] border-2 border-red-500/70 shadow-xl shadow-red-950/30"
                  : isCriticalLimit
                    ? "bg-card border-2 border-amber-500/60 shadow-lg"
                    : "bg-card border border-border/80 hover:border-border",
              )}
            >
              {isCriticalExceeded && (
                <div className="absolute -right-8 -top-8 size-20 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-2xl flex items-center justify-center shrink-0 border",
                      isCriticalExceeded
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : isCriticalLimit
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : isShared
                            ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                            : "bg-purple-500/15 border-purple-500/30 text-purple-300",
                    )}
                  >
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-foreground leading-tight">
                        {b.name}
                      </h4>
                      {isCriticalExceeded && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="size-3" /> Excedido
                        </span>
                      )}
                      {isCriticalLimit && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Zona crítica
                        </span>
                      )}
                      {isShared ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                          <Users className="size-3" /> Compartido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="size-3" /> Solo mío
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{b.group}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={cn(
                      "text-base font-black font-sans",
                      isCriticalExceeded
                        ? "text-red-400"
                        : isCriticalLimit
                          ? "text-amber-300"
                          : "text-foreground",
                    )}
                  >
                    {money(b.spent)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    de {money(b.planned)}
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  {isCriticalExceeded ? (
                    <>
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="size-3.5 text-red-400" />
                        {pct}% alcanzado (¡Límite excedido! -{money(Math.abs(delta))} de más)
                      </span>
                      <span className="text-red-400 font-extrabold">+{pct - 100}% extra</span>
                    </>
                  ) : isCriticalLimit ? (
                    <>
                      <span className="text-amber-300 flex items-center gap-1">
                        <Bell className="size-3.5 text-amber-400" />
                        {pct}% al límite (Pausar gastos de ocio)
                      </span>
                      <span className="text-amber-400 font-bold">Resta {money(delta)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-teal-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-teal-400" />
                        {pct}% dentro del ritmo planificado
                      </span>
                      <span className="text-muted-foreground">Resta {money(delta)}</span>
                    </>
                  )}
                </div>

                <div
                  className={cn(
                    "w-full bg-secondary h-2.5 rounded-full overflow-hidden p-0.5 border",
                    isCriticalExceeded
                      ? "border-red-800/80"
                      : isCriticalLimit
                        ? "border-amber-800/60"
                        : "border-border/60",
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isCriticalExceeded
                        ? "bg-gradient-to-r from-amber-500 to-red-500 shadow-xs shadow-red-500/50"
                        : isCriticalLimit
                          ? "bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500"
                          : isShared
                            ? "bg-gradient-to-r from-teal-500 to-teal-300"
                            : "bg-gradient-to-r from-purple-600 to-purple-400",
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Desglose de cuotas o Aviso Privado */}
              {isShared ? (
                <div
                  className={cn(
                    "rounded-xl p-2.5 flex items-center justify-between text-[11px] border",
                    isCriticalExceeded
                      ? "bg-[#12162a] border-red-900/40"
                      : "bg-secondary/40 border-border/60",
                  )}
                >
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-[72%]">
                    {familyMembers.length > 0 ? (
                      familyMembers.map((m, idx) => {
                        const userSpent = spentByCategoryAndUser.get(b.category)?.get(m.id) ?? 0;
                        const initial = m.display_name?.charAt(0).toUpperCase() || "U";
                        const colors = [
                          "bg-blue-600 text-white",
                          "bg-teal-500 text-slate-900",
                          "bg-purple-600 text-white",
                          "bg-amber-500 text-slate-900",
                        ];
                        const colorClass = colors[idx % colors.length];

                        return (
                          <div key={m.id} className="flex items-center gap-1.5 shrink-0">
                            {idx > 0 && <div className="h-3 w-px bg-border/80 mr-1" />}
                            <span
                              className={cn(
                                "size-5 rounded-full text-[9px] flex items-center justify-center font-black",
                                colorClass,
                              )}
                            >
                              {initial}
                            </span>
                            <span className="text-muted-foreground font-semibold truncate max-w-[90px]">
                              {m.display_name}:{" "}
                              <strong
                                className={isCriticalExceeded ? "text-red-300" : "text-foreground"}
                              >
                                {money(userSpent)}
                              </strong>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5 text-teal-400" />
                        <span>Compartido en equipo</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(true)}
                    className={cn(
                      "hover:underline text-[10px] font-bold flex items-center gap-0.5 shrink-0 ml-1.5",
                      isCriticalExceeded ? "text-red-400" : "text-teal-400",
                    )}
                  >
                    <RefreshCw className="size-3" />
                    <span>Reequilibrar</span>
                  </button>
                </div>
              ) : (
                <div className="bg-secondary/40 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <EyeOff className="size-3.5 text-muted-foreground" />
                    Oculto para miembros de tu grupo
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border",
                      isCriticalLimit
                        ? "text-amber-300 bg-amber-400/10 border-amber-400/20"
                        : "text-teal-400 bg-teal-500/10 border-teal-500/20",
                    )}
                  >
                    {isCriticalLimit ? "Casi Lleno" : "Privado"}
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* 8. Security / Privacy Educational Micro-Card */}
      <section className="bg-card border border-border/80 rounded-2xl p-3.5 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
          <Lock className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold text-foreground">Privacidad Inteligente Ualí</h5>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Los presupuestos con <strong className="text-foreground">candado</strong> se descuentan
            de tu balance general sin revelar detalles a tu equipo.
          </p>
        </div>
      </section>

      {/* MODAL: Ajuste de Cupos de Emergencia / Compensar con Nido */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs transition-opacity p-2 sm:p-4">
          <div className="bg-card border border-border/80 w-full max-w-md rounded-t-[28px] sm:rounded-3xl p-5 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto -mt-2 mb-1" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-400 animate-ping" />
                <h3 className="text-base font-extrabold text-foreground">
                  Ajuste de Cupos de Emergencia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="size-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Quick Compensation Info */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="size-4.5 shrink-0 text-red-400" />
              <span>
                {isOverdrawn ? (
                  <>
                    Sobregiro actual detectado de <strong>-{money(overdraftAmount)}</strong>. Puedes
                    reequilibrar o compensar con Ahorro Protegido Nido.
                  </>
                ) : (
                  <>Reequilibrio preventivo de cupos para mantener asignación 0-Base equilibrada.</>
                )}
              </span>
            </div>

            {/* Transfer from Nido Option */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground">
                Compensar desde Ahorro Protegido Nido
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-400">
                  $
                </span>
                <input
                  type="number"
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                  className="w-full h-11 pl-8 pr-3 rounded-xl bg-background border border-border/80 text-foreground text-base font-extrabold focus:outline-none focus:border-teal-400"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                Saldo disponible en Nido: {money(totalNidoSaved > 0 ? totalNidoSaved : 250)}
              </span>
            </div>

            {/* Privacy Toggle Selector */}
            <div className="bg-secondary/50 border border-border/80 p-3 rounded-2xl flex flex-col gap-2">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Notificación al Grupo</span>
                <Lock className="size-4 text-teal-400" />
              </label>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-card rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setCompensationPrivate(true)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    compensationPrivate
                      ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Lock className="size-3.5" /> Discreto
                </button>

                <button
                  type="button"
                  onClick={() => setCompensationPrivate(false)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    !compensationPrivate
                      ? "bg-blue-600 text-white font-black shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Users className="size-3.5" /> Notificar compañero
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug">
                {compensationPrivate ? (
                  <>
                    🔒 <strong className="text-foreground">Discreto:</strong> La compensación se
                    balancea internamente sin alertas sonoras grupales.
                  </>
                ) : (
                  <>
                    👥 <strong className="text-foreground">Notificar compañero:</strong> Tu
                    compañero recibirá la confirmación del nuevo cupo rebalanceado.
                  </>
                )}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleApplyCompensation}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.99] mt-1"
            >
              <CheckCircle2 className="size-4.5 stroke-[2.5]" />
              <span>Aplicar Ajuste de Emergencia</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Presupuesto con Tarjetas de Formulario Stitch */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md transition-all duration-300 p-0 sm:p-4">
          <div className="bg-card text-card-foreground border border-border/60 rounded-t-3xl sm:rounded-3xl shadow-card w-full max-w-md p-5 pb-7 flex flex-col gap-4 relative max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-600/80 rounded-full mx-auto -mt-1 mb-0.5 cursor-grab" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#2EC4B6] animate-pulse" />
                  <h2 className="text-lg font-black text-foreground tracking-tight">
                    Nuevo Presupuesto
                  </h2>
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Definí el cupo mensual y su nivel de visibilidad
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar modal"
                className="size-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-95"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Seleccionar Categoría */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Seleccionar Categoría
                </label>
                <span className="text-[10px] text-teal-400 font-semibold">Toca una opción</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: "comida",
                    name: "Comida & Súper",
                    group: "Fijos" as const,
                    sub: "Necesidad 50%",
                    icon: ShoppingCart,
                    color: "teal",
                  },
                  {
                    id: "ocio",
                    name: "Salidas & Ocio",
                    group: "Discrecional" as const,
                    sub: "Deseo 30%",
                    icon: Wine,
                    color: "purple",
                  },
                  {
                    id: "servicios",
                    name: "Servicios & Luz",
                    group: "Fijos" as const,
                    sub: "Fijo mensual",
                    icon: Zap,
                    color: "blue",
                  },
                  {
                    id: "nido",
                    name: "Ahorro Nido",
                    group: "Ahorro" as const,
                    sub: "Reserva 20%",
                    icon: Wallet,
                    color: "amber",
                  },
                ].map((item) => {
                  const isSelected =
                    newBudgetName === item.name || (!newBudgetName && item.id === "comida");
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNewBudgetName(item.name);
                        setNewBudgetGroup(item.group);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-left",
                        isSelected
                          ? "bg-teal-500/15 border-teal-500 text-foreground shadow-sm ring-1 ring-teal-500/50"
                          : "border-border/80 bg-secondary/60 hover:bg-secondary text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "size-8 rounded-xl flex items-center justify-center shrink-0",
                          item.color === "teal" && "bg-teal-500/20 text-teal-400",
                          item.color === "purple" && "bg-purple-500/20 text-purple-300",
                          item.color === "blue" && "bg-blue-500/20 text-blue-300",
                          item.color === "amber" && "bg-amber-500/20 text-amber-300",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold leading-tight truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {item.sub}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Opción para escribir un nombre personalizado */}
              <input
                value={newBudgetName}
                onChange={(e) => setNewBudgetName(e.target.value)}
                placeholder="O escribe otro nombre (ej. Gimnasio, Mascotas)"
                className="mt-1 w-full h-9 px-3 rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground text-xs font-medium focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Monto Límite Mensual */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Monto Límite Mensual</span>
                <span className="text-[10px] text-muted-foreground font-semibold">USD</span>
              </label>
              <div className="relative bg-secondary/80 border border-border/80 rounded-2xl text-foreground font-bold p-3 flex items-center justify-between shadow-inner focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-2xl font-black text-teal-400">$</span>
                  <input
                    inputMode="decimal"
                    value={newBudgetPlanned}
                    onChange={(e) => setNewBudgetPlanned(e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder="250.00"
                    className="w-full bg-transparent border-none text-2xl font-black text-foreground placeholder:text-muted-foreground focus:outline-none p-0 tracking-tight"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-card border border-border/80 px-2.5 py-1 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-300">USD</span>
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>

            {/* Nivel de Privacidad */}
            <div className="bg-secondary/60 border border-border/80 rounded-2xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Lock className="size-4 text-teal-400" />
                  Nivel de Privacidad
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-extrabold uppercase">
                  Cifrado Ualí
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-card rounded-2xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setNewBudgetIsShared(false)}
                  className={cn(
                    "py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-xl",
                    !newBudgetIsShared
                      ? "bg-[#2EC4B6] text-slate-950 shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Lock className="size-4" />
                  <span>Solo míos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewBudgetIsShared(true)}
                  className={cn(
                    "py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-xl",
                    newBudgetIsShared
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Users className="size-4" />
                  <span>Compartido</span>
                </button>
              </div>

              {/* Caja de aviso explicativo */}
              <div className="p-2.5 rounded-xl bg-card border border-border/80 flex items-start gap-2">
                <ShieldCheck className="size-4 text-teal-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {newBudgetIsShared ? (
                    <>
                      <strong className="text-foreground">Visible para el equipo:</strong> Ambos
                      verán los movimientos en tiempo real con cuotas independientes.
                    </>
                  ) : (
                    <>
                      <strong className="text-foreground">Solo para mí (Privado):</strong> Oculto
                      para el equipo, sólo se descuenta de tu balance individual.
                    </>
                  )}
                </p>
              </div>

              {/* Distribución de aportes cuando es compartido */}
              {newBudgetIsShared && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                    <span>Distribución de Aportes</span>
                    <span className="text-teal-400 font-bold text-[10px]">
                      Total: ${newBudgetPlanned || "250.00"}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="py-2 px-2.5 rounded-xl border bg-teal-500/15 border-teal-500 text-foreground flex flex-col items-center justify-center text-center transition-all"
                    >
                      <span className="text-xs font-black">
                        {familyMembers.find(
                          (m) => m.id !== currentUserId && m.user_id !== currentUserId,
                        )?.display_name
                          ? `50% / 50% con ${
                              familyMembers.find(
                                (m) => m.id !== currentUserId && m.user_id !== currentUserId,
                              )?.display_name
                            }`
                          : familyMembers.length > 2
                            ? `Partes iguales (${familyMembers.length})`
                            : "50% / 50% compartido"}
                      </span>
                      <span className="text-[10px] text-teal-400 font-semibold">
                        $
                        {(
                          Number(newBudgetPlanned || 250) /
                          (familyMembers.length > 1 ? familyMembers.length : 2)
                        ).toFixed(2)}{" "}
                        c/u
                      </span>
                    </button>
                    <button
                      type="button"
                      className="py-2 px-2.5 rounded-xl border border-border/80 bg-secondary/80 text-muted-foreground hover:text-foreground flex flex-col items-center justify-center text-center transition-all"
                    >
                      <span className="text-xs font-bold">Asignación libre</span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Cuotas asimétricas
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Consejo de Nido */}
            <div className="flex items-center gap-3 bg-secondary/60 border border-teal-500/30 rounded-2xl p-3 shadow-inner">
              <div className="size-12 shrink-0">
                <NidoCharacter className="size-12" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider">
                    Consejo de Nido
                  </span>
                  <span className="size-1.5 rounded-full bg-teal-400 animate-ping" />
                </div>
                <p className="text-[11px] text-foreground leading-snug">
                  "¡Buena decisión! Al asignar este presupuesto cuidamos tu{" "}
                  <strong className="text-teal-400">fondo mensual</strong> y la privacidad
                  compartida."
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={addBudgetMutation.isPending}
                onClick={() => void handleSaveBudget()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-bold shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Plus className="size-5 stroke-[2.5]" />
                <span>{addBudgetMutation.isPending ? "Guardando…" : "Crear Presupuesto"}</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs tracking-wide transition active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hoja para registrar transacción rápida */}
      <TransactionSheet open={txSheetOpen} onClose={() => setTxSheetOpen(false)} />

      {/* Asistente Inteligente de Reparto 0-Base y 50/30/20 */}
      <SmartBudgetAssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        currentIncome={currentMonthIncome || 1500}
        existingBudgets={budgets}
        onSuccessApply={() => {
          void budgetsQuery.refetch();
        }}
      />

      {/* Manual y Micro-Tutorial 0-Base */}
      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        initialStepId="zero-base-budget"
      />
    </main>
  );
}

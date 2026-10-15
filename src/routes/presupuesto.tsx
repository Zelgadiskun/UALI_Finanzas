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
  ChevronDown,
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
import { BudgetAccordion } from "@/components/ffos/BudgetAccordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cell, Pie, PieChart, Tooltip as RechartsTooltip } from "recharts";
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

interface RingTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      pct: number;
      target: number;
      color: string;
      spent: number;
      planned: number;
    };
  }>;
}

function BudgetRingTooltip({ active, payload }: RingTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl bg-card/95 border border-border p-2 text-xs shadow-xl backdrop-blur-md z-50 pointer-events-none">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="font-bold text-foreground">{data.name}</span>
        <span className="text-[10px] text-muted-foreground font-semibold">
          (Meta {data.target}%)
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-black text-xs text-foreground font-sans">{money(data.spent)}</span>
        <span className="text-[10px] text-muted-foreground">{data.pct}% del total</span>
      </div>
      {data.planned > 0 && (
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Planeado: {money(data.planned)}
        </div>
      )}
    </div>
  );
}

function PresupuestoRoute() {
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
  const [nidoModalOpen, setNidoModalOpen] = useState(false);

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

  // Clasificador de canastas (Regla 50/30/20 de Nido)
  function getBudgetBasket(b: {
    group?: string;
    name?: string;
  }): "necesidades" | "deseos" | "ahorro" {
    const g = (b.group || "").toLowerCase();
    const n = (b.name || "").toLowerCase();
    if (g.includes("ahorro") || n.includes("ahorro") || n.includes("nido") || n.includes("fondo")) {
      return "ahorro";
    }
    if (
      g.includes("fijo") ||
      n.includes("comida") ||
      n.includes("súper") ||
      n.includes("super") ||
      n.includes("luz") ||
      n.includes("servicio") ||
      n.includes("transporte") ||
      n.includes("salud") ||
      n.includes("alquiler") ||
      n.includes("renta")
    ) {
      return "necesidades";
    }
    return "deseos";
  }

  // Lista enriquecida de presupuestos (datos de BD o configuración por defecto)
  const budgets = useMemo(() => {
    const raw = budgetsQuery.data ?? [];
    if (raw.length > 0) {
      const mapped = raw.map((b) => {
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

      const hasAhorro = mapped.some((b) => getBudgetBasket(b) === "ahorro");
      if (!hasAhorro) {
        const ahorroSpentThisMonth = transactions
          .filter((t) => t.type === "ahorro" && sameMonth(t.date))
          .reduce((sum, t) => sum + t.amount, 0);
        const totalRawPlan = mapped.reduce((acc, item) => acc + item.planned, 0);
        const autoPlanned = Math.round(totalRawPlan * 0.25) || 250;
        mapped.push({
          id: "nido-reserva-auto",
          name: "Fondo de Reserva Nido",
          group: "Ahorro",
          planned: autoPlanned,
          spent: ahorroSpentThisMonth,
          createdBy: currentUserId ?? "u1",
          isShared: true,
          alertLevel: "healthy" as const,
          excessAmount: 0,
        });
      }
      return mapped;
    }

    return [
      {
        id: "demo-comida",
        name: "Comida & Súper",
        group: "Fijos",
        planned: 600,
        spent: 450,
        createdBy: currentUserId ?? "u1",
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
        createdBy: currentUserId ?? "u1",
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
        createdBy: currentUserId ?? "u1",
        isShared: true,
        alertLevel: "critical_limit" as const,
        excessAmount: 0,
      },
      {
        id: "demo-salidas",
        name: "Salidas & Deseos",
        group: "Discrecional",
        planned: 300,
        spent: 190,
        createdBy: currentUserId ?? "u1",
        isShared: false,
        alertLevel: "healthy" as const,
        excessAmount: 0,
      },
      {
        id: "demo-ahorro",
        name: "Fondo de Reserva Nido",
        group: "Ahorro",
        planned: 250,
        spent: 150,
        createdBy: currentUserId ?? "u1",
        isShared: true,
        alertLevel: "healthy" as const,
        excessAmount: 0,
      },
    ];
  }, [budgetsQuery.data, spentByCategory, currentUserId, transactions]);

  const sharedCount = budgets.filter((b) => b.isShared).length;
  const personalCount = budgets.filter((b) => !b.isShared).length;

  const filteredBudgets = useMemo(() => {
    if (filter === "shared") return budgets.filter((b) => b.isShared);
    if (filter === "personal") return budgets.filter((b) => !b.isShared);
    return budgets;
  }, [budgets, filter]);

  const necesidadesBudgets = useMemo(
    () => filteredBudgets.filter((b) => getBudgetBasket(b) === "necesidades"),
    [filteredBudgets],
  );
  const deseosBudgets = useMemo(
    () => filteredBudgets.filter((b) => getBudgetBasket(b) === "deseos"),
    [filteredBudgets],
  );
  const ahorroBudgets = useMemo(
    () => filteredBudgets.filter((b) => getBudgetBasket(b) === "ahorro"),
    [filteredBudgets],
  );

  const necesidadesSpent = useMemo(
    () => necesidadesBudgets.reduce((sum, b) => sum + (b.spent || 0), 0),
    [necesidadesBudgets],
  );
  const necesidadesPlanned = useMemo(
    () => necesidadesBudgets.reduce((sum, b) => sum + (b.planned || 0), 0),
    [necesidadesBudgets],
  );
  const necesidadesPct =
    necesidadesPlanned > 0 ? Math.round((necesidadesSpent / necesidadesPlanned) * 100) : 0;

  const deseosSpent = useMemo(
    () => deseosBudgets.reduce((sum, b) => sum + (b.spent || 0), 0),
    [deseosBudgets],
  );
  const deseosPlanned = useMemo(
    () => deseosBudgets.reduce((sum, b) => sum + (b.planned || 0), 0),
    [deseosBudgets],
  );
  const deseosPct = deseosPlanned > 0 ? Math.round((deseosSpent / deseosPlanned) * 100) : 0;

  const ahorroSpent = useMemo(
    () => ahorroBudgets.reduce((sum, b) => sum + (b.spent || 0), 0),
    [ahorroBudgets],
  );
  const ahorroPlanned = useMemo(
    () => ahorroBudgets.reduce((sum, b) => sum + (b.planned || 0), 0),
    [ahorroBudgets],
  );
  const ahorroPct = ahorroPlanned > 0 ? Math.round((ahorroSpent / ahorroPlanned) * 100) : 0;

  // Totales generales consistentes que siempre cuadran matemáticamente con las 3 canastas
  const totalPlanned = useMemo(
    () => necesidadesPlanned + deseosPlanned + ahorroPlanned,
    [necesidadesPlanned, deseosPlanned, ahorroPlanned],
  );
  const totalSpent = useMemo(
    () => necesidadesSpent + deseosSpent + ahorroSpent,
    [necesidadesSpent, deseosSpent, ahorroSpent],
  );
  const isOverdrawn = totalSpent > totalPlanned;
  const overdraftAmount = Math.max(0, totalSpent - totalPlanned);
  const percentUsed = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
  const availableAmount = Math.max(0, totalPlanned - totalSpent);

  // Distribución porcentual 50/30/20 para gráfico de anillos circular (recharts)
  const totalBasketsSpent = necesidadesSpent + deseosSpent + ahorroSpent;
  const hasBasketSpent = totalBasketsSpent > 0;

  const necPctOfTotal = hasBasketSpent
    ? Math.round((necesidadesSpent / totalBasketsSpent) * 100)
    : 50;
  const desPctOfTotal = hasBasketSpent ? Math.round((deseosSpent / totalBasketsSpent) * 100) : 30;
  const ahoPctOfTotal = hasBasketSpent ? Math.max(0, 100 - necPctOfTotal - desPctOfTotal) : 20;

  const ringChartData = useMemo(
    () => [
      {
        name: "Necesidades",
        value: hasBasketSpent ? Math.max(0.001, necesidadesSpent) : 50,
        pct: necPctOfTotal,
        target: 50,
        color: "#3B82F6", // Azul institucional para Necesidades
        spent: necesidadesSpent,
        planned: necesidadesPlanned,
      },
      {
        name: "Deseos",
        value: hasBasketSpent ? Math.max(0.001, deseosSpent) : 30,
        pct: desPctOfTotal,
        target: 30,
        color: "#A855F7", // Púrpura para Deseos
        spent: deseosSpent,
        planned: deseosPlanned,
      },
      {
        name: "Ahorro Nido",
        value: hasBasketSpent ? Math.max(0.001, ahorroSpent) : 20,
        pct: ahoPctOfTotal,
        target: 20,
        color: "#2EC4B6", // Teal oficial FFOS / Nido
        spent: ahorroSpent,
        planned: ahorroPlanned,
      },
    ],
    [
      hasBasketSpent,
      necesidadesSpent,
      necesidadesPlanned,
      necPctOfTotal,
      deseosSpent,
      deseosPlanned,
      desPctOfTotal,
      ahorroSpent,
      ahorroPlanned,
      ahoPctOfTotal,
    ],
  );

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
    <main className="px-4 pt-3 pb-28 max-w-md mx-auto w-full space-y-3.5">
      {/* 1. TÍTULO DE CICLO CON BOTÓN NUEVA TRANSACCIÓN Y ACCIONES */}
      <section className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "size-9 sm:size-10 rounded-2xl flex items-center justify-center shadow-inner border shrink-0 transition-colors",
              isOverdrawn
                ? "bg-card border-red-500/40 text-red-400"
                : "bg-card border-border/80 text-teal-400",
            )}
          >
            <Wallet className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0">
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 truncate",
                isOverdrawn ? "text-red-400" : "text-muted-foreground",
              )}
            >
              <span>{currentMonthName}</span>
              {isOverdrawn && <span className="size-1.5 rounded-full bg-red-400 animate-ping" />}
            </span>
            <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-tight">
              Presupuesto
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Menú de Herramientas del Presupuesto (Despeja la cabecera eliminando solapamiento) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Herramientas y opciones"
                className="size-9 rounded-xl bg-card border border-border/80 hover:bg-secondary/70 text-foreground flex items-center justify-center active:scale-95 transition-all shadow-xs"
                title="Herramientas y opciones del presupuesto"
              >
                <SlidersHorizontal className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 rounded-2xl bg-card border border-border shadow-xl z-50"
            >
              <DropdownMenuItem
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer text-foreground hover:bg-secondary/70 focus:bg-secondary/70"
              >
                <div className="size-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Plus className="size-3.5 stroke-[3]" />
                </div>
                <div className="flex flex-col text-left">
                  <span>Nuevo rubro</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Crear cupo o categoría
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setAssistantOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer text-foreground hover:bg-secondary/70 focus:bg-secondary/70"
              >
                <div className="size-6 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span>Asistente 0-Base</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Calibrar según ingresos
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setNidoModalOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer text-foreground hover:bg-secondary/70 focus:bg-secondary/70"
              >
                <div className="size-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 text-xs">
                  🐷
                </div>
                <div className="flex flex-col text-left">
                  <span>Consejos de Nido</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Equilibrio 50/30/20
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setTutorialOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer text-foreground hover:bg-secondary/70 focus:bg-secondary/70"
              >
                <div className="size-6 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                  <HelpCircle className="size-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span>Tutorial interactivo</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Cómo funciona el sistema
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón Guardián Nido 🐷 */}
          <button
            type="button"
            onClick={() => setNidoModalOpen(true)}
            className={cn(
              "relative size-9 rounded-xl bg-card border flex items-center justify-center transition active:scale-95 shadow-xs shrink-0",
              isOverdrawn
                ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                : "border-teal-500/30 text-teal-400 bg-teal-500/10 hover:border-teal-500/50",
            )}
            title="Consejo de Guardián Nido (Regla 50/30/20)"
          >
            <span className="text-base">🐷</span>
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 size-2 rounded-full",
                isOverdrawn ? "bg-amber-400 animate-ping" : "bg-teal-400",
              )}
            />
          </button>

          {/* Botón Nueva Transacción (+) */}
          <button
            type="button"
            onClick={() => setTxSheetOpen(true)}
            aria-label="Nueva transacción"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs active:scale-95 transition-all shadow-md shadow-[#2EC4B6]/25 shrink-0"
            title="Registrar nueva transacción o gasto"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Transacción</span>
          </button>
        </div>
      </section>

      {/* 2. RESUMEN GLOBAL COMPACTO (Límite, Usado, Gráfico de Anillos 50/30/20 y Disponible) */}
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl p-3.5 shadow-card transition-all",
          isOverdrawn
            ? "bg-gradient-to-br from-[#1c1828] via-[#161b2e] to-[#0A1224] border border-red-500/40 shadow-xl shadow-red-950/20"
            : "bg-card border border-border/80",
        )}
      >
        <div className="relative z-10 flex flex-col gap-2.5">
          {/* Fila superior: Estado general + Montos + Badge de estado */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                ESTADO GENERAL DEL MES
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h2 className="text-2xl font-black text-foreground tracking-tight font-sans">
                  {money(totalSpent)}
                </h2>
                <span className="text-xs font-bold text-muted-foreground">
                  de {money(totalPlanned)} límite
                </span>
              </div>
            </div>

            <div className="text-right">
              {isOverdrawn ? (
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(true)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 font-black border border-red-500/40 animate-pulse flex items-center gap-1 justify-end hover:bg-red-500/30 transition cursor-pointer"
                  title="Toca para compensar con Ahorro Nido"
                >
                  <AlertCircle className="size-3.5" />
                  {percentUsed > 0 ? `${percentUsed}%` : "0%"} Excedido
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-400 font-black border border-teal-500/30">
                  {totalPlanned > 0 ? `${percentUsed}% usado` : "0% usado"}
                </span>
              )}
            </div>
          </div>

          {/* Gráfico circular de anillos 50/30/20 con Recharts y distribución porcentual */}
          <div className="flex items-center gap-3 bg-secondary/35 rounded-xl p-2.5 border border-border/50">
            {/* Anillo Recharts */}
            <div className="relative size-[84px] shrink-0 flex items-center justify-center">
              <PieChart width={84} height={84} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <RechartsTooltip content={<BudgetRingTooltip />} />
                <Pie
                  data={ringChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={39}
                  paddingAngle={3}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {ringChartData.map((entry, index) => (
                    <Cell key={`donut-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              {/* Centro del anillo con porcentaje consumido */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span
                  className={cn(
                    "text-xs font-black font-sans leading-none",
                    isOverdrawn ? "text-red-400" : "text-foreground",
                  )}
                >
                  {percentUsed}%
                </span>
                <span className="text-[7.5px] font-bold text-muted-foreground uppercase leading-none mt-0.5">
                  {isOverdrawn ? "exceso" : "usado"}
                </span>
              </div>
            </div>

            {/* Leyenda con distribución porcentual de los 3 rubros */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
              {/* Necesidades (50%) - Azul institucional */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-bold text-foreground text-xs truncate">Necesidades</span>
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    (50%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-sans">
                  <span className="font-black text-blue-400 text-xs">{necPctOfTotal}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    ({money(necesidadesSpent)})
                  </span>
                </div>
              </div>

              {/* Deseos (30%) - Púrpura */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="font-bold text-foreground text-xs truncate">Deseos</span>
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    (30%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-sans">
                  <span className="font-black text-purple-400 text-xs">{desPctOfTotal}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    ({money(deseosSpent)})
                  </span>
                </div>
              </div>

              {/* Ahorro Nido (20%) - Teal */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="size-2 rounded-full bg-teal-400 shrink-0" />
                  <span className="font-bold text-foreground text-xs truncate">Ahorro Nido</span>
                  <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                    (20%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-sans">
                  <span className="font-black text-teal-400 text-xs">{ahoPctOfTotal}%</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    ({money(ahorroSpent)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div
            className={cn(
              "w-full bg-secondary h-2 rounded-full overflow-hidden p-0.5 flex border",
              isOverdrawn ? "border-red-900/60" : "border-border/60",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 shadow-xs",
                isOverdrawn
                  ? "bg-gradient-to-r from-amber-500 via-[#f97316] to-red-500"
                  : "bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400",
              )}
              style={{ width: `${Math.min(100, totalPlanned > 0 ? percentUsed : 0)}%` }}
            />
          </div>

          {/* Fila inferior: Disponible o Sobregiro */}
          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            {isOverdrawn ? (
              <>
                <span className="flex items-center gap-1.5 text-red-300 font-bold">
                  <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                  Excedido por:{" "}
                  <strong className="text-red-400 font-black">-{money(overdraftAmount)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(true)}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Compensar con Nido</span>
                  <ArrowRight className="size-3" />
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#2EC4B6]" />
                  Disponible:{" "}
                  <strong className="text-foreground font-black">{money(availableAmount)}</strong>
                </span>
                <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                  <ShieldCheck className="size-3.5 text-teal-400" />
                  Regla 50/30/20 activa
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. SELECTOR DE FLUJO COMPACTO (Todos | Solo Míos | En Equipo) */}
      <section className="bg-secondary/60 p-1 rounded-2xl border border-border/60 flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[34px]",
            filter === "all"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>Todos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
            {budgets.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("personal")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[34px]",
            filter === "personal"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Lock className="size-3.5" />
          <span>Solo míos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-black">
            {personalCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("shared")}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[34px]",
            filter === "shared"
              ? "bg-[#2EC4B6] text-slate-950 shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="size-3.5" />
          <span>En Equipo</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-black">
            {sharedCount}
          </span>
        </button>
      </section>

      {/* 4. COMPONENTE ACCORDION DE SHADCN/UI (Necesidades, Deseos, Ahorro Nido) */}
      <BudgetAccordion
        necesidadesBudgets={necesidadesBudgets}
        deseosBudgets={deseosBudgets}
        ahorroBudgets={ahorroBudgets}
        necesidadesSpent={necesidadesSpent}
        necesidadesPlanned={necesidadesPlanned}
        necesidadesPct={necesidadesPct}
        deseosSpent={deseosSpent}
        deseosPlanned={deseosPlanned}
        deseosPct={deseosPct}
        ahorroSpent={ahorroSpent}
        ahorroPlanned={ahorroPlanned}
        ahorroPct={ahorroPct}
        onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
        onOpenNewBudget={() => setModalOpen(true)}
        onOpenTransaction={() => setTxSheetOpen(true)}
      />

      {/* 5. PRIVACIDAD INTELIGENTE UALÍ (MICRO-CARD INFORMATIVA) */}
      <section className="bg-card border border-border/80 rounded-2xl p-3 flex items-center gap-2.5">
        <div className="size-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
          <Lock className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground leading-snug">
            Los rubros con <Lock className="size-3 inline text-purple-400 mx-0.5" /> se descuentan
            de tu balance general de forma privada sin exponerse a tu equipo.
          </p>
        </div>
      </section>

      {/* MODAL: Consejo del Guardián Nido 🐷 */}
      {nidoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-teal-500/40 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐷</span>
                <div>
                  <h3 className="text-sm font-black text-foreground">
                    {isOverdrawn ? "Guardián Nido en Alerta" : "Consejo de Guardián Nido"}
                  </h3>
                  <span className="text-[10px] font-bold text-teal-400">
                    Regla 50 / 30 / 20 Activa
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNidoModalOpen(false)}
                className="size-7 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <NidoCharacter
                mood={isOverdrawn ? "worried" : "happy"}
                className="size-20 shrink-0"
              />
              <p className="text-xs text-foreground leading-relaxed">
                {isOverdrawn ? (
                  <>
                    "¡Ojo con los consumos! Ciertos rubros han superado el cupo pactado este mes.
                    Puedes compensar el exceso desde tu fondo de ahorro o ajustar los límites."
                  </>
                ) : (
                  <>
                    "¡Vas impecable este mes! Tus ahorros protegidos están al día y tus gastos se
                    mantienen bajo control dentro de las tres canastas."
                  </>
                )}
              </p>
            </div>

            <div className="pt-1 flex gap-2">
              {isOverdrawn && (
                <button
                  type="button"
                  onClick={() => {
                    setNidoModalOpen(false);
                    setEmergencyModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition"
                >
                  Compensar Sobregiro
                </button>
              )}
              <button
                type="button"
                onClick={() => setNidoModalOpen(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

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
                        {familyMembers.find((m) => m.id !== currentUserId)?.display_name
                          ? `50% / 50% con ${
                              familyMembers.find((m) => m.id !== currentUserId)?.display_name
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

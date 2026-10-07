import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Crown,
  FileSpreadsheet,
  History,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { TransactionRow } from "@/components/ffos/TransactionRow";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { MonthlyTrendChart } from "@/components/ffos/MonthlyTrendChart";
import { EmptyState } from "@/components/ffos/EmptyState";
import { RowsSkeleton } from "@/components/ffos/Skeletons";
import { useTxActions } from "@/components/ffos/useTxActions";
import { PaywallModal } from "@/components/ffos/PaywallModal";
import { useSubscription } from "@/lib/ffos/subscriptionStore";
import { exportTransactionsToCSV, exportFinancialReportToPrintPDF } from "@/lib/ffos/exportReports";
import {
  currentMonthName,
  groupLabel,
  inMonthOffset,
  isBeforeCurrentMonth,
  money,
  previousMonthName,
  sameMonth,
} from "@/lib/ffos/format";
import {
  useCurrentUserId,
  useMemberDisplayNameMap,
  useTransactionsQuery,
  useProfileQuery,
  useFamilyQuery,
} from "@/lib/supabase/queries";
import { TX_TYPES, type TxType } from "@/lib/ffos/types";
import { cn } from "@/lib/utils";

const title = "Movimientos — UALI Finanzas";
const description =
  "Registro completo de ingresos, gastos, pagos de deuda y ahorro personales y de equipo, con flujo de caja continuo y comparativa mensual.";

export const Route = createFileRoute("/movimientos")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Movimientos,
});

type Filter = TxType | "todos";
type PeriodFilter = "all" | "current" | "previous";

function Movimientos() {
  const txQuery = useTransactionsQuery();
  const currentUserId = useCurrentUserId();
  const memberNames = useMemberDisplayNameMap();
  const rawTransactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);

  // Si no hay transacciones en Supabase, proveemos el historial para demostración de flujo continuo
  const transactions = useMemo(() => {
    if (rawTransactions.length > 0) return rawTransactions;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const prevY = prevDate.getFullYear();
    const prevM = String(prevDate.getMonth() + 1).padStart(2, "0");

    return [
      // Mes anterior
      {
        id: "demo-prev-1",
        userId: currentUserId ?? "u1",
        type: "ingreso" as const,
        category: "Sueldo",
        amount: 1850,
        date: `${prevY}-${prevM}-05`,
        note: "Ingreso mensual anterior",
        shared: true,
      },
      {
        id: "demo-prev-2",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Comida",
        amount: 520,
        date: `${prevY}-${prevM}-12`,
        note: "Supermercado y despensa",
        shared: true,
      },
      {
        id: "demo-prev-3",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Transporte",
        amount: 190,
        date: `${prevY}-${prevM}-18`,
        note: "Combustible y traslados",
        shared: true,
      },
      {
        id: "demo-prev-4",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Servicios",
        amount: 210,
        date: `${prevY}-${prevM}-25`,
        note: "Luz e internet",
        shared: false,
      },
      {
        id: "demo-prev-5",
        userId: currentUserId ?? "u1",
        type: "ahorro" as const,
        category: "Fondo de emergencia",
        amount: 250,
        date: `${prevY}-${prevM}-28`,
        note: "Ahorro protegido Nido",
        shared: false,
      },
      // Mes actual
      {
        id: "demo-curr-1",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Comida",
        amount: 65,
        date: `${y}-${m}-01`,
        note: "Almuerzo de inicio de mes",
        shared: true,
      },
      {
        id: "demo-curr-2",
        userId: currentUserId ?? "u1",
        type: "gasto" as const,
        category: "Transporte",
        amount: 25,
        date: `${y}-${m}-02`,
        note: "Recarga de tarjeta de transporte",
        shared: true,
      },
    ];
  }, [rawTransactions, currentUserId]);

  const [filter, setFilter] = useState<Filter>("todos");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const actions = useTxActions();
  const profile = useProfileQuery();
  const familyQuery = useFamilyQuery();
  const { isPro, openPaywall, paywallOpen, closePaywall } = useSubscription();

  function handleExport(format: "pdf" | "csv") {
    if (!isPro) {
      openPaywall();
      return;
    }
    const list = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date || new Date().toISOString().split("T")[0],
    }));
    if (list.length === 0) {
      toast.info("No hay transacciones registradas.");
      return;
    }
    try {
      if (format === "csv") {
        exportTransactionsToCSV({
          transactions: list,
          userName: profile.data?.display_name || "Usuario",
          familyName: familyQuery.data?.name || "Espacio Compartido",
        });
        toast.success("CSV descargado con éxito.");
      } else {
        exportFinancialReportToPrintPDF({
          transactions: list,
          userName: profile.data?.display_name || "Usuario",
          familyName: familyQuery.data?.name || "Espacio Compartido",
        });
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Error al exportar reporte");
    }
  }

  // Cálculos de flujo de caja continuo
  const cashFlowMetrics = useMemo(() => {
    const currentMonthTxs = transactions.filter((t) => sameMonth(t.date));
    const previousMonthTxs = transactions.filter((t) => inMonthOffset(t.date, -1));
    const priorToCurrentTxs = transactions.filter((t) => isBeforeCurrentMonth(t.date));

    const calcNet = (list: typeof transactions) =>
      list.reduce(
        (a, t) => (t.type === "ingreso" ? a + t.amount : t.type === "gasto" ? a - t.amount : a),
        0,
      );

    const currentNet = calcNet(currentMonthTxs);
    const prevNet = calcNet(previousMonthTxs);
    const carryoverBalance = calcNet(priorToCurrentTxs);
    const totalAccumulated = calcNet(transactions);

    return {
      currentNet,
      prevNet,
      carryoverBalance,
      totalAccumulated,
      currentCount: currentMonthTxs.length,
      prevCount: previousMonthTxs.length,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (filter === "todos" ? true : t.type === filter))
      .filter((t) => {
        if (period === "current") return sameMonth(t.date);
        if (period === "previous") return inMonthOffset(t.date, -1);
        return true;
      })
      .filter((t) => (q ? `${t.category} ${t.note ?? ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filter, period, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <main className="px-4 pt-4 pb-28 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Movimientos</h1>
          <p className="text-xs text-muted-foreground">
            Flujo de caja y registro cronológico de fondos
          </p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border/80 text-foreground font-bold text-xs">
          <Wallet className="size-3.5 text-teal-400" />
          <span>{money(cashFlowMetrics.totalAccumulated)}</span>
        </div>
      </div>

      {/* Barra de Exportación Rápida */}
      <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
        <span className="text-[11px] text-muted-foreground font-medium">¿Reporte contable?</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary/80 hover:bg-secondary text-[11px] font-bold text-foreground transition active:scale-95 border border-border/60"
          >
            <FileSpreadsheet className="size-3 text-teal-400" />
            <span>PDF</span>
            {!isPro && (
              <span className="text-[8.5px] font-black bg-amber-500/20 text-amber-300 px-1 rounded-xs">
                PRO
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-secondary/80 hover:bg-secondary text-[11px] font-bold text-foreground transition active:scale-95 border border-border/60"
          >
            <span>CSV</span>
            {!isPro && (
              <span className="text-[8.5px] font-black bg-amber-500/20 text-amber-300 px-1 rounded-xs">
                PRO
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tarjeta de Flujo Continuo: Remanente + Mes Actual */}
      <section className="mt-3.5 p-3.5 rounded-2xl bg-card border border-border/80 shadow-card">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-teal-400" />
            Flujo de Caja Continuo
          </span>
          <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
            Fondos Conservados
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/60">
          <div className="p-2 rounded-xl bg-secondary/60 border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground block truncate">
              {previousMonthName()}
            </span>
            <span className="text-xs font-black text-teal-400">
              {money(cashFlowMetrics.carryoverBalance)}
            </span>
            <span className="text-[9px] text-muted-foreground block mt-0.5">Remanente</span>
          </div>

          <div className="p-2 rounded-xl bg-secondary/60 border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground block truncate">
              {currentMonthName()}
            </span>
            <span
              className={cn(
                "text-xs font-black",
                cashFlowMetrics.currentNet >= 0 ? "text-emerald-400" : "text-amber-400",
              )}
            >
              {money(cashFlowMetrics.currentNet)}
            </span>
            <span className="text-[9px] text-muted-foreground block mt-0.5">Neto del mes</span>
          </div>

          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
            <span className="text-[10px] font-bold text-teal-300 block truncate">Total Caja</span>
            <span className="text-xs font-black text-foreground">
              {money(cashFlowMetrics.totalAccumulated)}
            </span>
            <span className="text-[9px] text-teal-400 block mt-0.5 font-bold">Disponible</span>
          </div>
        </div>
      </section>

      {/* Buscador */}
      <div className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 shadow-xs">
        <Search
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por categoría o nota…"
          aria-label="Buscar movimientos"
          className="w-full bg-transparent text-xs font-medium outline-hidden placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* Filtro por Período Mensual (Solución al usuario: acceder al mes anterior vs actual) */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 p-1 bg-secondary/60 rounded-xl border border-border/80">
        <button
          type="button"
          onClick={() => setPeriod("all")}
          className={cn(
            "py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
            period === "all"
              ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <History className="size-3" />
          <span>Todos</span>
        </button>

        <button
          type="button"
          onClick={() => setPeriod("current")}
          className={cn(
            "py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 truncate",
            period === "current"
              ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Calendar className="size-3" />
          <span>{currentMonthName()}</span>
        </button>

        <button
          type="button"
          onClick={() => setPeriod("previous")}
          className={cn(
            "py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 truncate",
            period === "previous"
              ? "bg-[#2EC4B6] text-slate-950 font-black shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Calendar className="size-3" />
          <span>{previousMonthName()}</span>
        </button>
      </div>

      {/* Filtro por Tipo de Operación */}
      <div className="relative -mx-4 mt-2.5">
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1">
          {(
            [{ value: "todos", label: "Todos" }, ...TX_TYPES] as { value: Filter; label: string }[]
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3 text-xs font-bold transition-all",
                filter === f.value
                  ? "border-[#2EC4B6] bg-[#2EC4B6] text-slate-950"
                  : "border-border/80 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!txQuery.isPending && transactions.length > 0 && period === "all" && (
        <div className="mt-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-card">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Evolución de Flujo Mensual
          </h2>
          <MonthlyTrendChart transactions={transactions} />
        </div>
      )}

      {txQuery.isPending ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <RowsSkeleton count={6} />
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="Sin movimientos"
            description="No encontramos registros para los filtros seleccionados."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(([date, list]) => (
            <section key={date} aria-label={groupLabel(date)}>
              <div className="flex items-center justify-between pb-1.5 px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {groupLabel(date)}
                </h3>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {list.length} mov.
                </span>
              </div>
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
                {list.map((tx) => {
                  const isMine = tx.userId === currentUserId;
                  return (
                    <div
                      key={tx.id}
                      onContextMenu={(e) => {
                        if (!isMine) return;
                        e.preventDefault();
                        actions.open(tx);
                      }}
                    >
                      <TransactionRow
                        tx={tx}
                        onOptions={isMine ? actions.open : undefined}
                        showDate={false}
                        ownerLabel={isMine ? undefined : memberNames[tx.userId]}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Hoja modal de edición */}
      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      <PaywallModal open={paywallOpen} onClose={closePaywall} triggerFeature="reports" />
      {actions.element}
    </main>
  );
}

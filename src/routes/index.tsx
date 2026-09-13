import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Award, ChevronRight, Info, X } from "lucide-react";
import { KpiCard } from "@/components/ffos/KpiCard";
import { LevelBar } from "@/components/ffos/LevelBar";
import { ProgressBar, barState } from "@/components/ffos/ProgressBar";
import { TransactionRow } from "@/components/ffos/TransactionRow";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { TodayLessonCard } from "@/components/ffos/TodayLessonCard";
import { InfoTip } from "@/components/ffos/InfoTip";
import { LessonSheet } from "@/components/ffos/LessonSheet";
import { DashboardSkeleton } from "@/components/ffos/Skeletons";
import { EmptyState } from "@/components/ffos/EmptyState";
import { useTxActions } from "@/components/ffos/useTxActions";
import { Fab } from "@/components/ffos/Fab";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { greeting, inMonthOffset, money, percentChange, sameMonth } from "@/lib/ffos/format";
import { levelInfo } from "@/lib/ffos/gamification";
import { useMarkNotificationReadMutation } from "@/lib/supabase/mutations";
import {
  useBudgetsQuery,
  useCurrentUserId,
  useDebtsQuery,
  useLessonsQuery,
  useMemberDisplayNameMap,
  useNotificationsQuery,
  useProfileQuery,
  useProgressQuery,
  useTransactionsQuery,
  type LessonRow,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "FFOS Wallet — Finanzas familiares claras";
const description =
  "Panel familiar de finanzas: balance, ingresos, gastos, deuda y presupuesto del mes en una sola pantalla, con niveles y rachas que enseñan a manejar la plata.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const txQuery = useTransactionsQuery();
  const profile = useProfileQuery();
  const progressQuery = useProgressQuery();
  const budgetsQuery = useBudgetsQuery();
  const debtsQuery = useDebtsQuery();
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const lessonsQuery = useLessonsQuery();
  const currentUserId = useCurrentUserId();
  const memberNames = useMemberDisplayNameMap();
  const transactions = useMemo(() => txQuery.data ?? [], [txQuery.data]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openLesson, setOpenLesson] = useState<LessonRow | null>(null);
  const actions = useTxActions();

  const nextLesson = useMemo(() => {
    const xp = progressQuery.data?.xp ?? 0;
    const done = progressQuery.data?.lessonsDone ?? [];
    const level = levelInfo(xp).level;
    return (
      (lessonsQuery.data ?? []).find((l) => l.minLevel <= level && !done.includes(l.id)) ?? null
    );
  }, [lessonsQuery.data, progressQuery.data]);

  // El progreso de aprendizaje no puede ser menos visible que el balance en
  // una app que se vende como educativa antes que financiera.
  const lessonsTotal = lessonsQuery.data?.length ?? 0;
  const lessonsCompleted = progressQuery.data?.lessonsDone.length ?? 0;

  const stats = useMemo(() => {
    const month = transactions.filter((t) => sameMonth(t.date));
    const prevMonth = transactions.filter((t) => inMonthOffset(t.date, -1));
    const sumBy = (list: typeof month, type: string) =>
      list.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);

    const income = sumBy(month, "ingreso");
    const expense = sumBy(month, "gasto");
    const debtPaid = sumBy(month, "pago_deuda");
    const saved = sumBy(month, "ahorro");
    const plannedTotal = (budgetsQuery.data ?? []).reduce((a, b) => a + b.planned, 0);

    // "Balance" mezclaba mis movimientos con los compartidos por otros — ni
    // era "mío" ni era "de la familia" (los privados de otros nunca se ven,
    // así que tampoco es un total real). Se separan: lo propio siempre se
    // puede calcular sin ambigüedad; lo familiar es "lo que se ve", con esa
    // limitación explícita en la etiqueta, no escondida.
    const mine = month.filter((t) => t.userId === currentUserId);
    const sumMineBy = (type: string) =>
      mine.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);
    const myBalance =
      sumMineBy("ingreso") - sumMineBy("gasto") - sumMineBy("pago_deuda") - sumMineBy("ahorro");

    return {
      income,
      expense,
      incomeDelta: percentChange(income, sumBy(prevMonth, "ingreso")),
      expenseDelta: percentChange(expense, sumBy(prevMonth, "gasto")),
      balance: income - expense - debtPaid - saved,
      myBalance,
      free: income - plannedTotal,
    };
  }, [transactions, budgetsQuery.data, currentUserId]);

  const budgets = useMemo(() => {
    const spentByCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "gasto" || !sameMonth(t.date)) continue;
      spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + t.amount);
    }
    return (budgetsQuery.data ?? []).map((b) => ({
      ...b,
      spent: spentByCategory.get(b.name) ?? 0,
    }));
  }, [budgetsQuery.data, transactions]);

  const topBudget = useMemo(
    () => [...budgets].sort((a, b) => b.spent / b.planned - a.spent / a.planned).slice(0, 3),
    [budgets],
  );

  const debtRemaining = useMemo(() => {
    const paidByDebt = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "pago_deuda" || !t.debtId) continue;
      paidByDebt.set(t.debtId, (paidByDebt.get(t.debtId) ?? 0) + t.amount);
    }
    return (debtsQuery.data ?? []).reduce(
      (a, d) => a + Math.max(0, d.principal - (paidByDebt.get(d.id) ?? 0)),
      0,
    );
  }, [debtsQuery.data, transactions]);

  const alerts = useMemo(() => {
    const list: { tone: "warning" | "danger" | "info"; text: string; notificationId?: string }[] =
      [];

    // Avisos del servidor primero: son sobre el reparto de OTRO miembro
    // cruzando su cupo — más accionables para quien administra el
    // presupuesto que el aviso genérico de abajo sobre el total familiar.
    for (const n of notificationsQuery.data ?? []) {
      if (n.type !== "budget_alert") continue;
      const memberName = memberNames[n.payload.memberId] ?? "Alguien";
      const text =
        n.payload.level === "over"
          ? `${memberName} superó su reparto de ${n.payload.budgetName}`
          : `${memberName} está por agotar su reparto de ${n.payload.budgetName}`;
      list.push({
        tone: n.payload.level === "over" ? "danger" : "warning",
        text,
        notificationId: n.id,
      });
    }

    for (const b of budgets) {
      if (b.spent > b.planned)
        list.push({
          tone: "danger",
          text: `${b.name} superó el plan por ${money(b.spent - b.planned)}`,
        });
      else if (b.spent / b.planned >= 0.85)
        list.push({
          tone: "warning",
          text: `${b.name} está al ${Math.round((b.spent / b.planned) * 100)}% del plan`,
        });
    }
    const streak = progressQuery.data?.streak ?? 0;
    if (streak >= 3)
      list.push({
        tone: "info",
        text: `Llevás ${streak} días registrando. Seguí la racha.`,
      });
    return list;
  }, [budgets, progressQuery.data?.streak, notificationsQuery.data, memberNames]);

  const latest = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions],
  );

  if (txQuery.isPending || progressQuery.isPending || !progressQuery.data) {
    return <DashboardSkeleton />;
  }
  const progress = progressQuery.data;

  return (
    <main className="px-4 pt-4 pb-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">{greeting()},</p>
          <h1 className="truncate font-display text-xl font-bold">
            {profile.data?.display_name ?? "Familia"}
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
            Mi balance
          </p>
          <p className="font-display text-2xl font-bold tabular-nums text-primary">
            {money(stats.myBalance)}
          </p>
        </div>
      </header>

      {profile.data?.family_id && (
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          Balance familiar visible: <span className="font-medium">{money(stats.balance)}</span>
        </p>
      )}

      <div className="mt-4">
        <LevelBar xp={progress.xp} streak={progress.streak} onOpen={() => setProgressOpen(true)} />
      </div>

      {nextLesson ? (
        <div className="mt-3">
          <TodayLessonCard
            lesson={nextLesson}
            completed={lessonsCompleted}
            total={lessonsTotal}
            onOpen={() => setOpenLesson(nextLesson)}
          />
        </div>
      ) : (
        lessonsTotal > 0 &&
        lessonsCompleted >= lessonsTotal && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Award className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
                Ruta de aprendizaje
              </p>
              <p className="font-display text-base font-bold">
                Completaste las {lessonsTotal} lecciones
              </p>
            </div>
          </div>
        )
      )}

      <section aria-label="Indicadores del mes" className="mt-4 grid grid-cols-3 gap-2">
        <KpiCard label="Ingresos" value={stats.income} delta={stats.incomeDelta} tone="accent" />
        <KpiCard label="Gastos" value={stats.expense} delta={stats.expenseDelta} tone="danger" />
        <KpiCard label="Deuda" value={debtRemaining} tone="warning" />
      </section>

      {alerts.length > 0 && (
        <section aria-label="Alertas" className="mt-4 space-y-2">
          {alerts.slice(0, 2).map((a) => (
            <div
              key={a.notificationId ?? a.text}
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px]",
                a.tone === "danger" && "bg-danger-soft text-danger",
                a.tone === "warning" && "bg-warning-soft text-[color:var(--foreground)]",
                a.tone === "info" && "bg-info-soft text-info",
              )}
            >
              {a.tone === "info" ? (
                <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 flex-1">{a.text}</span>
              {a.notificationId && (
                <button
                  aria-label="Descartar aviso"
                  onClick={() => markReadMutation.mutate(a.notificationId!)}
                  className="shrink-0 opacity-60 hover:opacity-100"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
          {alerts.length > 2 && (
            <p className="text-[12px] text-muted-foreground">+{alerts.length - 2} más</p>
          )}
        </section>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Capacidad libre este mes{" "}
        <InfoTip text="Lo que te queda del ingreso del mes después de restar todo lo planificado en el presupuesto. Si es negativo, planificaste más de lo que entra." />
        :{" "}
        <span className={cn("font-semibold", stats.free < 0 ? "text-danger" : "text-foreground")}>
          {money(stats.free)}
        </span>
      </p>

      <section className="mt-5">
        <SectionHeader title="Presupuesto" to="/presupuesto" />
        <div className="mt-2 space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          {topBudget.map((b) => {
            const pct = (b.spent / b.planned) * 100;
            const delta = b.planned - b.spent;
            return (
              <div key={b.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="shrink-0 text-sm tabular-nums">{money(b.planned)}</p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={pct} state={barState(pct)} className="flex-1" />
                  <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                    {Math.round(pct)}%
                  </span>
                  <span
                    className={cn(
                      "w-16 shrink-0 text-right text-[11px] font-medium tabular-nums",
                      delta < 0 ? "text-danger" : "text-accent",
                    )}
                  >
                    {delta < 0 ? "−" : "+"}
                    {money(Math.abs(delta))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeader title="Últimos movimientos" to="/movimientos" />
        <div className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {latest.length === 0 ? (
            <EmptyState
              title="Todavía no hay movimientos"
              description="Agregá tu primer movimiento para empezar."
            />
          ) : (
            latest.map((tx) => {
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
                    ownerLabel={isMine ? undefined : memberNames[tx.userId]}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      <ProgressSheet
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        progress={progress}
      />
      <Fab label="Nueva transacción" onClick={() => setSheetOpen(true)} />
      <TransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      {openLesson && (
        <LessonSheet lesson={openLesson} done={false} onClose={() => setOpenLesson(null)} />
      )}
      {actions.element}
    </main>
  );
}

function SectionHeader({ title: t, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold">{t}</h2>
      <Link
        to={to}
        className="flex items-center gap-0.5 text-[12px] font-medium text-muted-foreground"
      >
        Ver todo
        <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    </div>
  );
}

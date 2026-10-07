import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  MoreVertical,
  Plus,
  RotateCcw,
  Snowflake,
  Sparkles,
  Trash2,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { ProgressBar } from "@/components/ffos/ProgressBar";
import { EmptyState } from "@/components/ffos/EmptyState";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { LessonLink } from "@/components/ffos/LessonLink";
import { money } from "@/lib/ffos/format";
import {
  useAddDebtMutation,
  useAddTransactionMutation,
  useDeleteDebtMutation,
  useUpdateDebtMutation,
} from "@/lib/supabase/mutations";
import {
  useCurrentUserId,
  useDebtsQuery,
  useProfileQuery,
  useTransactionsQuery,
  type DebtRow,
} from "@/lib/supabase/queries";
import { useUserPoints } from "@/lib/ffos/points";
import { cn } from "@/lib/utils";

const title = "Deudas — UALI Finanzas";
const description =
  "Seguimiento y liquidación de deudas: saldo real, edición, pagos extraordinarios, recordatorios y proyección avalancha vs. bola de nieve.";

export const Route = createFileRoute("/deudas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Deudas,
});

// Almacenamiento local de recordatorios por deuda
const DEBT_REMINDERS_KEY = "uali_debt_reminders_v1";

interface DebtReminder {
  dueDay: number; // Día del mes (1 - 31)
  enabled: boolean;
  notes?: string;
}

function getStoredReminders(): Record<string, DebtReminder> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DEBT_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredReminders(data: Record<string, DebtReminder>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEBT_REMINDERS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function Deudas() {
  const profile = useProfileQuery();
  const inFamily = !!profile.data?.family_id;
  const debtsQuery = useDebtsQuery();
  const txQuery = useTransactionsQuery();
  const { awardPoints } = useUserPoints();

  const [addOpen, setAddOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRow | null>(null);
  const [payingDebt, setPayingDebt] = useState<
    (DebtRow & { paid: number; remaining: number }) | null
  >(null);
  const [reminderDebt, setReminderDebt] = useState<DebtRow | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  const [reminders, setReminders] = useState<Record<string, DebtReminder>>({});

  useEffect(() => {
    setReminders(getStoredReminders());
  }, []);

  const deleteMutation = useDeleteDebtMutation();

  // El saldo pendiente se deriva de las transacciones con type "pago_deuda" y debtId
  const paidByDebt = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txQuery.data ?? []) {
      if (t.type !== "pago_deuda" || !t.debtId) continue;
      map.set(t.debtId, (map.get(t.debtId) ?? 0) + t.amount);
    }
    return map;
  }, [txQuery.data]);

  const debts = (debtsQuery.data ?? []).map((d) => {
    const paid = paidByDebt.get(d.id) ?? 0;
    return { ...d, paid, remaining: Math.max(0, d.principal - paid) };
  });

  const totalRemaining = debts.reduce((a, d) => a + d.remaining, 0);
  const totalPaid = debts.reduce((a, d) => a + d.paid, 0);
  const totalOriginal = debts.reduce((a, d) => a + d.principal, 0);
  const globalProgress = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;

  const avalancha = useMemo(
    () =>
      [...debts]
        .filter((d) => d.remaining > 0)
        .sort((a, b) => (b.annualRate ?? 0) - (a.annualRate ?? 0)),
    [debts],
  );
  const bolaDeNieve = useMemo(
    () => [...debts].filter((d) => d.remaining > 0).sort((a, b) => a.remaining - b.remaining),
    [debts],
  );

  function handleSaveReminder(debtId: string, reminder: DebtReminder) {
    const updated = { ...reminders, [debtId]: reminder };
    setReminders(updated);
    saveStoredReminders(updated);
    toast.success("Recordatorio de pago guardado", {
      description: reminder.enabled
        ? `Aviso activo para el día ${reminder.dueDay} de cada mes.`
        : "Recordatorio desactivado.",
    });
    setReminderDebt(null);
  }

  return (
    <main className="px-4 pt-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Estrategia de ataque
          </span>
          <h1 className="font-display text-xl font-black text-foreground">Deudas y Créditos</h1>
        </div>

        <button
          onClick={() => setAddOpen((v) => !v)}
          className="btn-3d h-9 px-3 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm flex items-center gap-1.5 transition active:scale-95"
        >
          {addOpen ? (
            <>
              <X className="size-3.5" />
              <span>Cerrar</span>
            </>
          ) : (
            <>
              <Plus className="size-3.5" />
              <span>+ Agregar</span>
            </>
          )}
        </button>
      </div>

      {/* Saldo Pendiente Card */}
      <section className="rounded-3xl border border-border/80 bg-card p-4 shadow-card mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
            Saldo Total Pendiente
          </p>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {debts.filter((d) => d.remaining > 0).length} activas
          </span>
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-3xl font-black tabular-nums text-warning tracking-tight">
            {money(totalRemaining)}
          </p>
          {totalOriginal > 0 && (
            <span className="text-xs text-muted-foreground font-semibold">
              de {money(totalOriginal)} original
            </span>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-muted-foreground">Progreso de liquidación</span>
            <span className="font-bold text-emerald-400">{globalProgress}% pagado</span>
          </div>
          <ProgressBar value={globalProgress} state="ok" height={6} />
        </div>

        <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pagado hasta hoy: <strong className="text-accent">{money(totalPaid)}</strong>
          </span>
          <span className="text-[11px] text-teal-400 font-bold">
            {inFamily ? "En equipo familiar" : "Registro personal"}
          </span>
        </div>
      </section>

      {/* Add Debt Form */}
      {addOpen && (
        <section className="mb-4">
          <AddDebtForm onDone={() => setAddOpen(false)} />
        </section>
      )}

      {/* Debts List */}
      {debts.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-4">
          <EmptyState
            title="Sin deudas registradas"
            description="Agregá tu primera deuda o tarjeta para ver el saldo descender con cada abono y planificar su liquidación acelerada."
            illustration="presupuesto"
          />
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {debts.map((d) => {
            const pct = d.principal > 0 ? Math.round((d.paid / d.principal) * 100) : 0;
            const isFinished = d.remaining <= 0;
            const reminder = reminders[d.id];

            return (
              <article
                key={d.id}
                className={cn(
                  "rounded-3xl border p-4 shadow-card transition-all",
                  isFinished
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-card border-border/80",
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-sm font-extrabold text-foreground">{d.name}</p>
                      {isFinished && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[9px] border border-emerald-500/40">
                          ¡LIQUIDADA! 🎉
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {d.annualRate !== null ? `${d.annualRate}% anual` : "Sin tasa declarada"}
                      {d.minimum !== null ? ` · Cuota mín. ${money(d.minimum)}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-black tabular-nums",
                          isFinished ? "text-emerald-400" : "text-warning",
                        )}
                      >
                        {money(d.remaining)}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        restante
                      </span>
                    </div>

                    {/* Edit button */}
                    <button
                      aria-label={`Editar ${d.name}`}
                      onClick={() => setEditingDebt(d)}
                      className="size-8 rounded-full border border-border/60 bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition active:scale-95"
                      title="Editar deuda"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      aria-label={`Eliminar ${d.name}`}
                      onClick={() => setDeleting({ id: d.id, name: d.name })}
                      className="size-8 rounded-full border border-border/60 bg-secondary flex items-center justify-center text-muted-foreground hover:text-red-400 transition active:scale-95"
                      title="Eliminar deuda"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar
                    value={pct}
                    state={isFinished ? "ok" : "warn"}
                    height={5}
                    className="flex-1"
                  />
                  <span className="w-10 shrink-0 text-right text-[11px] tabular-nums font-bold text-muted-foreground">
                    {pct}%
                  </span>
                </div>

                {/* Reminder Badge if active */}
                {reminder?.enabled && (
                  <div className="mt-2.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Bell className="size-3 text-amber-400 shrink-0" />
                      Recordatorio: Vence el día {reminder.dueDay} de cada mes
                    </span>
                    <button
                      type="button"
                      onClick={() => setReminderDebt(d)}
                      className="text-[10px] font-bold underline hover:text-amber-200"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Actions row: Pago Extraordinario & Recordatorio */}
                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderDebt(d)}
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                  >
                    <Bell className="size-3.5" />
                    <span>{reminder?.enabled ? "Editar aviso" : "+ Recordatorio"}</span>
                  </button>

                  {!isFinished ? (
                    <button
                      type="button"
                      onClick={() => setPayingDebt(d)}
                      className="btn-3d px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Zap className="size-3.5" />
                      <span>+ Pago Extraordinario</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5" />
                      Totalmente pagada
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Estrategias de Liquidación */}
      {debts.length > 1 && (
        <section className="space-y-3 mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Estrategias recomendadas
          </h2>
          <StrategyCard
            icon={<TrendingDown className="size-4 text-emerald-400" />}
            title="Método Avalancha"
            description="Paga primero la de mayor tasa de interés: es la que más te cuesta esperar y más dinero te ahorra."
            order={avalancha}
            lessonSlug="debt_order"
          />
          <StrategyCard
            icon={<Snowflake className="size-4 text-sky-400" />}
            title="Método Bola de Nieve"
            description="Paga primero la de menor saldo: liquidarla rápido genera victoria psicológica e impulso continuo."
            order={bolaDeNieve}
            lessonSlug="snowball"
          />
        </section>
      )}

      {/* MODAL: EDITAR DEUDA */}
      {editingDebt && <EditDebtModal debt={editingDebt} onClose={() => setEditingDebt(null)} />}

      {/* MODAL: PAGO EXTRAORDINARIO / AMORTIZACIÓN */}
      {payingDebt && (
        <ExtraordinaryPaymentModal
          debt={payingDebt}
          onClose={() => setPayingDebt(null)}
          onSuccess={() => {
            setPayingDebt(null);
            awardPoints({
              xpToAdd: 15,
              tokensToAdd: 20,
              reason: `Abono a deuda: ${payingDebt.name}`,
            });
          }}
        />
      )}

      {/* MODAL: RECORDATORIO DE PAGO */}
      {reminderDebt && (
        <ReminderModal
          debt={reminderDebt}
          currentReminder={reminders[reminderDebt.id]}
          onClose={() => setReminderDebt(null)}
          onSave={(data) => handleSaveReminder(reminderDebt.id, data)}
        />
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      <ConfirmModal
        open={!!deleting}
        title={`¿Eliminar "${deleting?.name}"?`}
        description="Los pagos ya registrados permanecen en tu historial de movimientos, pero dejarán de restar a esta deuda."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onSuccess: () => toast.success("Deuda eliminada"),
              onError: () => toast.error("No se pudo eliminar."),
            });
          }
          setDeleting(null);
        }}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTES MODALES
// ---------------------------------------------------------------------------

function StrategyCard({
  icon,
  title,
  description,
  order,
  lessonSlug,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  order: { id: string; name: string; remaining: number }[];
  lessonSlug: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
          {icon}
          {title}
        </h3>
        <LessonLink slug={lessonSlug} />
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{description}</p>
      <ol className="mt-3 space-y-1.5 border-t border-border/60 pt-2">
        {order.map((d, i) => (
          <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-black text-muted-foreground">
                {i + 1}
              </span>
              <span className="truncate font-semibold text-foreground">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-bold text-muted-foreground">
              {money(d.remaining)}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function AddDebtForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [minimum, setMinimum] = useState("");
  const addMutation = useAddDebtMutation();

  async function submit() {
    const principalValue = Number(principal.replace(",", "."));
    if (!name.trim() || !principalValue || principalValue <= 0) {
      toast.error("Completá el nombre y un saldo adeudado mayor a 0.");
      return;
    }
    try {
      await addMutation.mutateAsync({
        name: name.trim(),
        principal: principalValue,
        annualRate: rate ? Number(rate.replace(",", ".")) : null,
        minimum: minimum ? Number(minimum.replace(",", ".")) : null,
      });
      toast.success("Deuda registrada con éxito 🎉", {
        description: "+15 Puntos FFOS y +10 XP añadidos.",
      });
      onDone();
    } catch {
      toast.error("No se pudo guardar la deuda. Probá de nuevo.");
    }
  }

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-card animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
          Nueva Deuda o Tarjeta
        </h3>
        <button
          type="button"
          onClick={onDone}
          className="size-6 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center"
        >
          <X className="size-4" />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
          Acreedor o Nombre de la deuda
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Tarjeta de Crédito Visa, Préstamo Auto"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground font-semibold"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
            Saldo Total Adeudado ($)
          </label>
          <input
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0.00"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground font-semibold"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
            Tasa Anual % (opcional)
          </label>
          <input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="Ej. 28.5"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-muted-foreground">
          Cuota Mínima Mensual ($) (opcional)
        </label>
        <input
          inputMode="decimal"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="0.00"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground font-semibold"
        />
      </div>

      <button
        onClick={() => void submit()}
        disabled={addMutation.isPending}
        className="btn-3d h-11 w-full rounded-2xl bg-primary text-xs font-black text-primary-foreground disabled:opacity-60 transition active:scale-[0.99]"
      >
        {addMutation.isPending ? "Guardando…" : "Guardar Deuda"}
      </button>
    </div>
  );
}

function EditDebtModal({ debt, onClose }: { debt: DebtRow; onClose: () => void }) {
  const [name, setName] = useState(debt.name);
  const [principal, setPrincipal] = useState(debt.principal.toString());
  const [rate, setRate] = useState(debt.annualRate !== null ? debt.annualRate.toString() : "");
  const [minimum, setMinimum] = useState(debt.minimum !== null ? debt.minimum.toString() : "");
  const updateMutation = useUpdateDebtMutation();

  async function submit() {
    const val = Number(principal.replace(",", "."));
    if (!name.trim() || !val || val <= 0) {
      toast.error("Completá el nombre y un saldo válido.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: debt.id,
        name: name.trim(),
        principal: val,
        annualRate: rate ? Number(rate.replace(",", ".")) : null,
        minimum: minimum ? Number(minimum.replace(",", ".")) : null,
      });
      toast.success("Deuda actualizada correctamente");
      onClose();
    } catch {
      toast.error("Error al actualizar la deuda.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Edit2 className="size-4 text-primary" />
            <h3 className="text-sm font-extrabold text-foreground">Editar Deuda</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
            Nombre del acreedor
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Saldo Original ($)
            </label>
            <input
              inputMode="decimal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value.replace(/[^\d.,]/g, ""))}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Tasa anual %
            </label>
            <input
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
            Cuota mínima ($)
          </label>
          <input
            inputMode="decimal"
            value={minimum}
            onChange={(e) => setMinimum(e.target.value.replace(/[^\d.,]/g, ""))}
            className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={updateMutation.isPending}
            className="btn-3d h-10 flex-1 rounded-xl bg-primary text-xs font-black text-primary-foreground"
          >
            {updateMutation.isPending ? "Guardando…" : "Actualizar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExtraordinaryPaymentModal({
  debt,
  onClose,
  onSuccess,
}: {
  debt: DebtRow & { paid: number; remaining: number };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("Pago extraordinario / Abono");
  const addTxMutation = useAddTransactionMutation();
  const profile = useProfileQuery();
  const inFamily = !!profile.data?.family_id;

  async function handlePay() {
    const val = Number(amount.replace(",", "."));
    if (!val || val <= 0) {
      toast.error("Ingresá un monto de pago mayor a 0.");
      return;
    }

    try {
      await addTxMutation.mutateAsync({
        type: "pago_deuda",
        amount: val,
        date,
        category: "Deudas",
        debtId: debt.id,
        note: note.trim() || `Abono a ${debt.name}`,
        shared: inFamily,
      });

      toast.success("¡Abono registrado con éxito! 🪙", {
        description: `Saldo de ${debt.name} reducido en ${money(val)}. +20 FFOS y +15 XP ganados!`,
      });
      onSuccess();
    } catch {
      toast.error("No se pudo registrar el pago extraordinario.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-foreground">
              Pago Extraordinario a {debt.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-semibold">Saldo restante actual:</span>
          <strong className="text-warning font-black text-sm">{money(debt.remaining)}</strong>
        </div>

        {/* Shortcut pills */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
            Accesos rápidos
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {[20, 50, 100].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setAmount(quick.toString())}
                className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-extrabold text-foreground border border-border hover:bg-secondary/80 active:scale-95 transition"
              >
                ${quick}
              </button>
            ))}
            {debt.minimum && (
              <button
                type="button"
                onClick={() => setAmount(debt.minimum!.toString())}
                className="px-2.5 py-1 rounded-lg bg-secondary text-[11px] font-extrabold text-foreground border border-border hover:bg-secondary/80 active:scale-95 transition"
              >
                Mínimo (${debt.minimum})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAmount(debt.remaining.toString())}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition"
            >
              Liquidar Todo
            </button>
          </div>
        </div>

        {/* Monto Input */}
        <div>
          <label className="text-[11px] font-bold text-muted-foreground block mb-1">
            Monto a abonar ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
              $
            </span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0.00"
              className="w-full h-11 pl-7 pr-3 rounded-xl bg-background border border-border text-base font-black text-foreground focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Fecha y Nota */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 px-2 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Etiqueta
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Aguinaldo"
              className="w-full h-9 px-2 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handlePay()}
            disabled={addTxMutation.isPending}
            className="btn-3d h-10 flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-slate-950 flex items-center justify-center gap-1.5 shadow-md"
          >
            <CheckCircle2 className="size-4" />
            <span>{addTxMutation.isPending ? "Registrando…" : "Confirmar Pago"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReminderModal({
  debt,
  currentReminder,
  onClose,
  onSave,
}: {
  debt: DebtRow;
  currentReminder?: DebtReminder;
  onClose: () => void;
  onSave: (data: DebtReminder) => void;
}) {
  const [enabled, setEnabled] = useState(currentReminder?.enabled ?? true);
  const [dueDay, setDueDay] = useState(currentReminder?.dueDay ?? 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-foreground">Recordatorio de Pago</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-snug">
          Configura una alerta mensual para no olvidar abonar a{" "}
          <strong className="text-foreground">{debt.name}</strong> y proteger tu racha crediticia.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/60 border border-border/60">
          <span className="text-xs font-bold text-foreground">Recordatorio activo</span>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              enabled ? "bg-amber-400" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "size-5 rounded-full bg-slate-950 transition-transform absolute top-0.5",
                enabled ? "right-0.5" : "left-0.5 bg-slate-400",
              )}
            />
          </button>
        </div>

        {enabled && (
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Día de vencimiento cada mes (1 al 31)
            </label>
            <select
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs text-foreground font-semibold"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Día {d} de cada mes
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave({ enabled, dueDay })}
            className="btn-3d h-10 flex-1 rounded-xl bg-primary text-xs font-black text-primary-foreground"
          >
            Guardar Aviso
          </button>
        </div>
      </div>
    </div>
  );
}

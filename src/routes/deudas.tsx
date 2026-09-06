import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreVertical, Snowflake, TrendingDown } from "lucide-react";
import { ProgressBar } from "@/components/ffos/ProgressBar";
import { EmptyState } from "@/components/ffos/EmptyState";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { money } from "@/lib/ffos/format";
import { useAddDebtMutation, useDeleteDebtMutation } from "@/lib/supabase/mutations";
import { useDebtsQuery, useProfileQuery, useTransactionsQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

const title = "Deudas — FFOS Wallet";
const description =
  "Seguimiento de deudas familiares: saldo pendiente real por acreedor, con proyección avalancha vs. bola de nieve.";

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

function Deudas() {
  const profile = useProfileQuery();
  const inFamily = !!profile.data?.family_id;
  const debtsQuery = useDebtsQuery();
  const txQuery = useTransactionsQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const deleteMutation = useDeleteDebtMutation();

  // El saldo pendiente se deriva de los pagos enlazados a cada deuda por
  // debt_id — nunca se guarda como columna, así registrar un pago siempre
  // baja el saldo, sin poder desincronizarse (mismo principio que budgets).
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

  if (!inFamily) {
    return (
      <main className="px-4 pt-4 pb-6">
        <h1 className="text-xl font-bold">Deudas</h1>
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="Las deudas son de la familia"
            description="Creá una familia o unite a una desde Más → Familia para empezar a registrarlas."
            illustration="presupuesto"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Deudas</h1>
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="text-[13px] font-semibold text-primary"
        >
          {addOpen ? "Cancelar" : "+ Agregar"}
        </button>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          Saldo pendiente
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-warning">{money(totalRemaining)}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pagado hasta hoy: <span className="font-semibold text-accent">{money(totalPaid)}</span>
        </p>
      </section>

      {addOpen && <AddDebtForm onDone={() => setAddOpen(false)} />}

      {debts.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-card">
          <EmptyState
            title="Sin deudas registradas"
            description="Agregá la primera para empezar a ver el saldo bajar con cada pago."
            illustration="presupuesto"
          />
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {debts.map((d) => {
              const pct = (d.paid / d.principal) * 100;
              return (
                <article
                  key={d.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.annualRate !== null ? `${d.annualRate}% anual` : "Sin tasa"}
                        {d.minimum !== null ? ` · Cuota mín. ${money(d.minimum)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-sm font-semibold tabular-nums text-warning">
                        {money(d.remaining)}
                      </p>
                      <button
                        aria-label={`Opciones de ${d.name}`}
                        onClick={() => setDeleting({ id: d.id, name: d.name })}
                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                      >
                        <MoreVertical className="size-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {/* "warn" fijo, no barState(pct): acá el progreso siempre es
                        deuda pendiente, nunca "ok" hasta que llega a 100. */}
                    <ProgressBar value={pct} state="warn" className="flex-1" />
                    <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      {Math.round(pct)}%
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {avalancha.length > 1 && (
            <section className="mt-5 space-y-3">
              <h2 className="text-base font-semibold">Qué atacar primero</h2>
              <StrategyCard
                icon={<TrendingDown className="size-4" strokeWidth={1.75} aria-hidden="true" />}
                title="Avalancha"
                description="Pagá primero la de mayor tasa: es la que más te cuesta esperar."
                order={avalancha}
              />
              <StrategyCard
                icon={<Snowflake className="size-4" strokeWidth={1.75} aria-hidden="true" />}
                title="Bola de nieve"
                description="Pagá primero la más chica: liquidarla rápido da impulso para seguir."
                order={bolaDeNieve}
              />
            </section>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleting}
        title={`¿Eliminar "${deleting?.name}"?`}
        description="Los pagos ya registrados quedan en el historial, pero dejan de contar contra esta deuda."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, {
              onError: () => toast.error("No se pudo eliminar."),
            });
          }
          setDeleting(null);
        }}
      />
    </main>
  );
}

function StrategyCard({
  icon,
  title,
  description,
  order,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  order: { id: string; name: string; remaining: number }[];
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
      <ol className="mt-3 space-y-1.5">
        {order.map((d, i) => (
          <li key={d.id} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
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
      toast.error("Completá el nombre y un monto principal mayor a 0.");
      return;
    }
    try {
      await addMutation.mutateAsync({
        name: name.trim(),
        principal: principalValue,
        annualRate: rate ? Number(rate.replace(",", ".")) : null,
        minimum: minimum ? Number(minimum.replace(",", ".")) : null,
      });
      toast.success("Deuda agregada");
      onDone();
    } catch {
      toast.error("No se pudo guardar. Probá de nuevo.");
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
          Nombre del acreedor
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Tarjeta Visa"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Monto adeudado
          </label>
          <input
            inputMode="decimal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0.00"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Tasa anual % (opcional)
          </label>
          <input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
          Cuota mínima (opcional)
        </label>
        <input
          inputMode="decimal"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="0.00"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        />
      </div>
      <button
        onClick={() => void submit()}
        disabled={addMutation.isPending}
        className={cn(
          "h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60",
        )}
      >
        {addMutation.isPending ? "Guardando..." : "Guardar deuda"}
      </button>
    </div>
  );
}

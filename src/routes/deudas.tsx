import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/ffos/EmptyState";
import { useFfos } from "@/lib/ffos/store";
import { money } from "@/lib/ffos/format";

const title = "Deudas — FFOS Wallet";
const description =
  "Seguimiento de deudas familiares: saldo total pendiente y pagos registrados mes a mes.";

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
  const state = useFfos();
  const paid = state.transactions
    .filter((t) => t.type === "pago_deuda")
    .reduce((a, t) => a + t.amount, 0);

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold">Deudas</h1>
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
          Saldo pendiente
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-warning">{money(state.debtTotal)}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pagado hasta hoy: <span className="font-semibold text-accent">{money(paid)}</span>
        </p>
      </section>
      <div className="mt-4 rounded-2xl border border-border bg-card">
        <EmptyState
          title="Detalle de deudas en camino"
          description="La próxima fase suma acreedores, cuotas y proyección de pago."
          illustration="presupuesto"
        />
      </div>
    </main>
  );
}

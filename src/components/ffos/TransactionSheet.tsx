import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "./BottomSheet";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, TX_TYPES, type Transaction, type TxType } from "@/lib/ffos/types";
import { todayISO } from "@/lib/ffos/format";
import { useAddTransactionMutation, useUpdateTransactionMutation } from "@/lib/supabase/mutations";
import { useDebtsQuery, useGoalsQuery, useProfileQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
};

export function TransactionSheet({ open, onClose, editing }: Props) {
  const [type, setType] = useState<TxType>("gasto");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [debtId, setDebtId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addMutation = useAddTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const profile = useProfileQuery();
  const debtsQuery = useDebtsQuery();
  const goalsQuery = useGoalsQuery();
  const inFamily = !!profile.data?.family_id;
  const debts = debtsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setType(editing.type);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setNote(editing.note ?? "");
      setShared(editing.shared);
      setDebtId(editing.debtId ?? "");
      setGoalId(editing.goalId ?? "");
    } else {
      setType("gasto");
      setCategory("");
      setAmount("");
      setDate(todayISO());
      setNote("");
      setShared(false);
      setDebtId("");
      setGoalId("");
    }
  }, [open, editing]);

  async function submit() {
    const value = Number(amount.replace(",", "."));
    const next: Record<string, string> = {};
    if (!value || value <= 0) next["amount"] = "El monto debe ser mayor a 0.";
    if (!category) next["category"] = "Elegí una categoría.";
    if (date > todayISO()) next["date"] = "La fecha no puede ser futura.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = {
      type,
      category,
      amount: value,
      date,
      note: note.trim() || undefined,
      shared: inFamily ? shared : false,
      debtId: type === "pago_deuda" && debtId ? debtId : undefined,
      goalId: type === "ahorro" && goalId ? goalId : undefined,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, patch: payload });
        toast.success("Movimiento actualizado");
      } else {
        const event = await addMutation.mutateAsync(payload);
        toast.success("Movimiento guardado", { description: `+${event.xp} XP` });
        if (event.levelUp) toast.success("¡Subiste de nivel!");
        for (const a of event.newAchievements)
          toast.success("Logro desbloqueado", { description: a });
      }
      onClose();
    } catch {
      toast.error("No se pudo guardar. Revisá tu conexión e intentá de nuevo.");
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={editing ? "Editar movimiento" : "Nueva transacción"}
    >
      <div className="space-y-4 pb-2">
        <Field label="Tipo">
          <div className="flex flex-wrap gap-2">
            {TX_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setType(t.value);
                  setCategory("");
                }}
                className={cn(
                  "h-10 rounded-full border px-3.5 text-[13px] font-medium",
                  type === t.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Categoría" error={errors["category"]}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(
              "h-12 w-full rounded-xl border bg-card px-3 text-sm",
              errors["category"] ? "border-danger" : "border-border",
            )}
          >
            <option value="">Seleccionar</option>
            {CATEGORIES[type].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Monto" error={errors["amount"]}>
          <div
            className={cn(
              "flex h-12 items-center gap-1 rounded-xl border bg-card px-3",
              errors["amount"] ? "border-danger" : "border-border",
            )}
          >
            <span className="text-sm text-muted-foreground">$</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="0.00"
              className="w-full bg-transparent text-sm tabular-nums outline-hidden"
            />
          </div>
        </Field>

        <Field label="Fecha" error={errors["date"]}>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              "h-12 w-full rounded-xl border bg-card px-3 text-sm",
              errors["date"] ? "border-danger" : "border-border",
            )}
          />
        </Field>

        {type === "pago_deuda" && debts.length > 0 && (
          <Field label="¿Qué deuda estás pagando? (opcional)">
            <select
              value={debtId}
              onChange={(e) => setDebtId(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">Sin especificar</option>
              {debts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {type === "ahorro" && goals.length > 0 && (
          <Field label="¿Para qué meta? (opcional)">
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">Sin especificar</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Nota (opcional)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. compra semanal"
            className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm"
          />
        </Field>

        {inFamily && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3">
            <span className="min-w-0 pr-3">
              <span className="block text-sm font-medium">Compartir con la familia</span>
              <span className="block text-[12px] text-muted-foreground">
                {shared ? "El resto de la familia lo va a ver" : "Solo vos lo vas a ver"}
              </span>
            </span>
            <Switch checked={shared} onCheckedChange={setShared} />
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={addMutation.isPending || updateMutation.isPending}
          className="btn-3d h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {addMutation.isPending || updateMutation.isPending ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={onClose} className="h-11 w-full text-sm font-medium text-muted-foreground">
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-danger">{error}</span>}
    </label>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BottomSheet } from "./BottomSheet";
import { CATEGORIES, TX_TYPES, type Transaction, type TxType } from "@/lib/ffos/types";
import { todayISO } from "@/lib/ffos/format";
import { addTransaction, updateTransaction } from "@/lib/ffos/store";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editing) {
      setType(editing.type);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setNote(editing.note ?? "");
    } else {
      setType("gasto");
      setCategory("");
      setAmount("");
      setDate(todayISO());
      setNote("");
    }
  }, [open, editing]);

  function submit() {
    const value = Number(amount.replace(",", "."));
    const next: Record<string, string> = {};
    if (!value || value <= 0) next["amount"] = "El monto debe ser mayor a 0.";
    if (!category) next["category"] = "Elegí una categoría.";
    if (date > todayISO()) next["date"] = "La fecha no puede ser futura.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload = { type, category, amount: value, date, note: note.trim() || undefined };

    if (editing) {
      updateTransaction(editing.id, payload);
      toast.success("Movimiento actualizado");
    } else {
      const event = addTransaction(payload);
      toast.success("Movimiento guardado", { description: `+${event.xp} XP` });
      if (event.levelUp) toast.success("¡Subiste de nivel!");
      for (const a of event.newAchievements) toast.success("Logro desbloqueado", { description: a });
    }
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? "Editar movimiento" : "Nueva transacción"}>
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

        <Field label="Nota (opcional)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. compra semanal"
            className="h-12 w-full rounded-xl border border-border bg-card px-3 text-sm"
          />
        </Field>

        <button
          onClick={submit}
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          Guardar
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

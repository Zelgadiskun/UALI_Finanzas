import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Car,
  CheckCircle2,
  Lock,
  PiggyBank,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Target,
  Users,
  Wallet,
  Wine,
  X,
  Zap,
} from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { ConfirmModal } from "./ConfirmModal";
import { NidoCharacter } from "@/components/ffos/characters/Characters";
import { CATEGORIES, TX_TYPES, type Transaction, type TxType } from "@/lib/ffos/types";
import { todayISO } from "@/lib/ffos/format";
import { useAddTransactionMutation, useUpdateTransactionMutation } from "@/lib/supabase/mutations";
import { useDebtsQuery, useGoalsQuery, useProfileQuery } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  defaultValues?: { type?: TxType; category?: string; note?: string; amount?: string } | null;
};

export function TransactionSheet({ open, onClose, editing, defaultValues }: Props) {
  const [type, setType] = useState<TxType>("gasto");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [debtId, setDebtId] = useState("");
  const [goalId, setGoalId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<{
    type: TxType;
    category: string;
    amount: string;
    date: string;
    note: string;
    shared: boolean;
    debtId: string;
    goalId: string;
  } | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

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
    const start = editing
      ? {
          type: editing.type,
          category: editing.category,
          amount: String(editing.amount),
          date: editing.date,
          note: editing.note ?? "",
          shared: editing.shared,
          debtId: editing.debtId ?? "",
          goalId: editing.goalId ?? "",
        }
      : {
          type: defaultValues?.type ?? ("gasto" as TxType),
          category: defaultValues?.category ?? "Comida",
          amount: defaultValues?.amount ?? "",
          date: todayISO(),
          note: defaultValues?.note ?? "",
          shared: false,
          debtId: "",
          goalId: "",
        };
    setType(start.type);
    setCategory(start.category);
    setAmount(start.amount);
    setDate(start.date);
    setNote(start.note);
    setShared(start.shared);
    setDebtId(start.debtId);
    setGoalId(start.goalId);
    setInitial(start);
  }, [open, editing, defaultValues]);

  const isDirty =
    !!initial &&
    (type !== initial.type ||
      category !== initial.category ||
      amount !== initial.amount ||
      date !== initial.date ||
      note !== initial.note ||
      shared !== initial.shared ||
      debtId !== initial.debtId ||
      goalId !== initial.goalId);

  function requestClose() {
    if (isDirty) setConfirmingDiscard(true);
    else onClose();
  }

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

  // Consejos dinámicos de Nido según tipo
  const nidoAdvice =
    type === "ahorro"
      ? "¡Excelente hábito! Todo monto que apartas a tu ahorro con Nido fortalece tus metas y tu colchón de seguridad."
      : type === "ingreso"
        ? "¡Buen ingreso! Recordá la regla de oro: asigná cada peso a su rubro antes de empezar a gastar."
        : type === "pago_deuda"
          ? "¡Un paso gigante hacia la tranquilidad financiera! Reducir pasivos libera tu capacidad mensual."
          : "Registrar tus consumos en el momento mantiene tu regla 50/30/20 bajo control y sin sorpresas.";

  return (
    <>
      <BottomSheet
        open={open}
        onClose={requestClose}
        title={editing ? "Editar movimiento" : "Nuevo Movimiento"}
      >
        <div className="space-y-4 pb-2">
          {/* 1. Selector de Tipo */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-secondary/60 rounded-2xl border border-border/80">
              {TX_TYPES.map((t) => {
                const isSelected = type === t.value;
                const Icon =
                  t.value === "gasto"
                    ? ArrowDownRight
                    : t.value === "ingreso"
                      ? ArrowUpRight
                      : t.value === "ahorro"
                        ? PiggyBank
                        : Target;

                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setType(t.value);
                      const available = CATEGORIES[t.value];
                      if (available.length > 0) setCategory(available[0]!);
                    }}
                    className={cn(
                      "py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      isSelected
                        ? t.value === "gasto"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-xs"
                          : t.value === "ingreso"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                            : t.value === "ahorro"
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Seleccionar Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Categoría
              </label>
              {errors["category"] && (
                <span className="text-[10px] text-danger font-semibold">{errors["category"]}</span>
              )}
            </div>

            {/* Quick Chips para categorías más frecuentes */}
            {type === "gasto" && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { name: "Comida", sub: "Necesidad 50%", icon: ShoppingCart, color: "teal" },
                  { name: "Salidas", sub: "Deseo 30%", icon: Wine, color: "purple" },
                  { name: "Transporte", sub: "Necesidad 50%", icon: Car, color: "amber" },
                  { name: "Servicios", sub: "Fijo mensual", icon: Zap, color: "blue" },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-left transition-all",
                      category === item.name
                        ? "bg-teal-500/15 border-teal-500 text-foreground ring-1 ring-teal-500/50"
                        : "border-border/80 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0 text-teal-400" />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selector completo */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                "h-11 w-full rounded-xl border bg-background px-3 text-xs font-semibold focus:outline-none focus:border-teal-400",
                errors["category"] ? "border-danger" : "border-border/80",
              )}
            >
              <option value="">Seleccionar rubro…</option>
              {CATEGORIES[type].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Monto con Indicador de Moneda */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between mb-1.5">
              <span>Monto</span>
              {errors["amount"] && (
                <span className="text-[10px] text-danger font-semibold">{errors["amount"]}</span>
              )}
            </label>
            <div className="relative bg-secondary/80 border border-border/80 rounded-2xl text-foreground font-bold p-3 flex items-center justify-between shadow-inner focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl font-black text-teal-400">$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0.00"
                  className="w-full bg-transparent border-none text-2xl font-black text-foreground placeholder:text-muted-foreground focus:outline-none p-0 tracking-tight"
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-card border border-border/80 px-2.5 py-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-300">USD</span>
                <span className="size-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          {/* 4. Metas o Deudas asociadas (si corresponde) */}
          {type === "ahorro" && goals.length > 0 && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Vincular a Meta de Nido
              </label>
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold focus:outline-none focus:border-teal-400"
              >
                <option value="">Ahorro general de Nido</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Obj: ${g.target})
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === "pago_deuda" && debts.length > 0 && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                ¿Qué deuda estás cancelando?
              </label>
              <select
                value={debtId}
                onChange={(e) => setDebtId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold focus:outline-none focus:border-teal-400"
              >
                <option value="">Sin especificar deuda</option>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Fecha y Nota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Nota (opcional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Súper semanal, cena"
                className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>

          {/* 6. Nivel de Privacidad con Tarjeta Stitch */}
          {inFamily && (
            <div className="bg-secondary/60 border border-border/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
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
                  onClick={() => setShared(false)}
                  className={cn(
                    "py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-xl",
                    !shared
                      ? "bg-[#2EC4B6] text-slate-950 shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Lock className="size-4" />
                  <span>Solo míos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShared(true)}
                  className={cn(
                    "py-2.5 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-xl",
                    shared
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Users className="size-4" />
                  <span>Compartido</span>
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug">
                {shared ? (
                  <>
                    👥 <strong className="text-foreground">Visible para el equipo:</strong> Ambos
                    verán los movimientos en tiempo real para cuadrar cupos.
                  </>
                ) : (
                  <>
                    🔒 <strong className="text-foreground">Solo para mí (Privado):</strong> Cifrado
                    en cofre personal. Solo tú ves los detalles.
                  </>
                )}
              </p>
            </div>
          )}

          {/* 7. Consejo de Nido Banner */}
          <div className="flex items-center gap-3 bg-secondary/60 border border-teal-500/30 rounded-2xl p-3 shadow-inner">
            <div className="size-11 shrink-0">
              <NidoCharacter className="size-11" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider">
                  Consejo de Nido
                </span>
                <span className="size-1.5 rounded-full bg-teal-400 animate-ping" />
              </div>
              <p className="text-[11px] text-foreground leading-snug">{nidoAdvice}</p>
            </div>
          </div>

          {/* 8. Botones de Acción */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={addMutation.isPending || updateMutation.isPending}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-bold shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-5 stroke-[2.5]" />
              <span>
                {addMutation.isPending || updateMutation.isPending
                  ? "Guardando…"
                  : editing
                    ? "Actualizar Movimiento"
                    : "Guardar Movimiento"}
              </span>
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground font-bold text-xs tracking-wide transition active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmModal
        open={confirmingDiscard}
        title="¿Descartar cambios?"
        description="Vas a perder lo que completaste en este formulario."
        confirmLabel="Descartar"
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => {
          setConfirmingDiscard(false);
          onClose();
        }}
      />
    </>
  );
}

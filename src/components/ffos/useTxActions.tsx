import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { ConfirmModal } from "./ConfirmModal";
import { TransactionSheet } from "./TransactionSheet";
import { deleteTransaction } from "@/lib/ffos/store";
import type { Transaction } from "@/lib/ffos/types";

/** Acciones rápidas de una transacción: editar o eliminar. */
export function useTxActions() {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirming, setConfirming] = useState<Transaction | null>(null);

  const element = (
    <>
      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.category ?? "Movimiento"}
      >
        <div className="space-y-2 pb-2">
          <button
            onClick={() => {
              setEditing(selected);
              setSelected(null);
            }}
            className="flex h-12 w-full items-center gap-3 rounded-xl border border-border px-3 text-sm font-medium"
          >
            <Pencil className="size-5" strokeWidth={1.75} aria-hidden="true" />
            Editar movimiento
          </button>
          <button
            onClick={() => {
              setConfirming(selected);
              setSelected(null);
            }}
            className="flex h-12 w-full items-center gap-3 rounded-xl border border-border px-3 text-sm font-medium text-danger"
          >
            <Trash2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
            Eliminar movimiento
          </button>
        </div>
      </BottomSheet>

      <TransactionSheet open={editing !== null} editing={editing} onClose={() => setEditing(null)} />

      <ConfirmModal
        open={confirming !== null}
        title="¿Eliminar esta transacción?"
        description="Esta acción no se puede deshacer."
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) deleteTransaction(confirming.id);
          setConfirming(null);
          toast.success("Movimiento eliminado");
        }}
      />
    </>
  );

  return { open: setSelected, element };
}

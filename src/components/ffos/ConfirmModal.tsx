import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-6">
      <button
        aria-label="Cancelar"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgb(0_0_0/0.4)]"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-pop relative w-full max-w-[340px] rounded-2xl bg-card p-5 shadow-sheet"
      >
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-border text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "h-12 flex-1 rounded-xl bg-danger text-sm font-semibold text-danger-foreground",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

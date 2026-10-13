import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Rule503020Mission } from "./Rule503020Mission";

interface Rule503020MissionModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function Rule503020MissionModal({
  open,
  onClose,
  onCompleted,
}: Rule503020MissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">Misión 02: La Regla 50 / 30 / 20</DialogTitle>
        <DialogDescription className="sr-only">
          Equilibra tus tres canastas de consumo con el Guardián Nido y evita la asfixia de gastos.
        </DialogDescription>
        <Rule503020Mission
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

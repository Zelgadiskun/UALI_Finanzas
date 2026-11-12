import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NidoMechanicalClassifier } from "./NidoMechanicalClassifier";

interface NidoMechanicalClassifierModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function NidoMechanicalClassifierModal({
  open,
  onClose,
  onCompleted,
}: NidoMechanicalClassifierModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Misión 04: El Clasificador Mecánico — Necesidades vs Deseos
        </DialogTitle>
        <DialogDescription className="sr-only">
          Minijuego interactivo con el guardián Nido para clasificar flujos de gasto cotidiano
          usando la tolva de gravedad, desvío táctil y palanca de prioridad.
        </DialogDescription>
        <NidoMechanicalClassifier
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

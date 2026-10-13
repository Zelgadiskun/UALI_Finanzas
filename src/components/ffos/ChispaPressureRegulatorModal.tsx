import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChispaPressureRegulator } from "./ChispaPressureRegulator";

interface ChispaPressureRegulatorModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function ChispaPressureRegulatorModal({
  open,
  onClose,
  onCompleted,
}: ChispaPressureRegulatorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Misión 07: El Regulador de Presión — Orden de Ataque de Deudas
        </DialogTitle>
        <DialogDescription className="sr-only">
          Minijuego interactivo con el guardián Chispa y Toto para diagnosticar pasivos, calcular el
          CAT y aplicar el método avalancha en el tablero de interruptores.
        </DialogDescription>
        <ChispaPressureRegulator
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

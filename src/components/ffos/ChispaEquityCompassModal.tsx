import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChispaEquityCompass } from "./ChispaEquityCompass";

interface ChispaEquityCompassModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function ChispaEquityCompassModal({
  open,
  onClose,
  onCompleted,
}: ChispaEquityCompassModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Misión 05: El Trazo de la Equidad — Acuerdos de Aportes y División Justa
        </DialogTitle>
        <DialogDescription className="sr-only">
          Minijuego interactivo con el guardián Chispa para calibrar la apertura angular del compás
          y acuerdos de división proporcional de gastos en equipo.
        </DialogDescription>
        <ChispaEquityCompass
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

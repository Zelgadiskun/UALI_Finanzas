import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PhaseTransitionRitual, type PhaseTransitionType } from "./PhaseTransitionRitual";

interface PhaseTransitionRitualModalProps {
  open: boolean;
  type: PhaseTransitionType;
  onClose: () => void;
  onComplete?: () => void;
}

export function PhaseTransitionRitualModal({
  open,
  type,
  onClose,
  onComplete,
}: PhaseTransitionRitualModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Protocolo de Cierre de Fase — Ritual de Evolución de Guardianes
        </DialogTitle>
        <DialogDescription className="sr-only">
          Escenario de transición ritual y relevo entre guardianes Nido, Chispa y Toto al completar
          los nodos 4, 8 y 12.
        </DialogDescription>
        <PhaseTransitionRitual
          type={type}
          onClose={onClose}
          onComplete={() => {
            if (onComplete) onComplete();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

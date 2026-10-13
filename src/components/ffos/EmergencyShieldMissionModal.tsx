import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmergencyShieldMission } from "./EmergencyShieldMission";

interface EmergencyShieldMissionModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function EmergencyShieldMissionModal({
  open,
  onClose,
  onCompleted,
}: EmergencyShieldMissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">Misión 03: El Escudo de Emergencia</DialogTitle>
        <DialogDescription className="sr-only">
          Blinda de 3 a 6 meses de gastos vitales en una reserva 100% líquida con Nido.
        </DialogDescription>
        <EmergencyShieldMission
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

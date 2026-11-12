import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ZeroBaseBudgetMission } from "./ZeroBaseBudgetMission";

interface ZeroBaseBudgetMissionModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function ZeroBaseBudgetMissionModal({
  open,
  onClose,
  onCompleted,
}: ZeroBaseBudgetMissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">Misión 01: Presupuesto Base Cero</DialogTitle>
        <DialogDescription className="sr-only">
          Asigna cada peso de tus ingresos antes de que empiece el mes hasta lograr balance a cero.
        </DialogDescription>
        <ZeroBaseBudgetMission
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

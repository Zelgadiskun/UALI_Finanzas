import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TotoPerpetualCogs } from "./TotoPerpetualCogs";

interface TotoPerpetualCogsModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function TotoPerpetualCogsModal({
  open,
  onClose,
  onCompleted,
}: TotoPerpetualCogsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Misión 06: El Engranaje Perpetuo — Batiendo a la Inflación con Activos Modernos
        </DialogTitle>
        <DialogDescription className="sr-only">
          Minijuego interactivo con el guardián Toto para acoplar engranajes de activos modernos y
          batir la inflación con portafolios diversificados.
        </DialogDescription>
        <TotoPerpetualCogs
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

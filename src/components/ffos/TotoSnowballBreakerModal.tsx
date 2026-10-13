import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TotoSnowballBreaker } from "./TotoSnowballBreaker";

interface TotoSnowballBreakerModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export function TotoSnowballBreakerModal({
  open,
  onClose,
  onCompleted,
}: TotoSnowballBreakerModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 bg-transparent border-0 shadow-none overflow-hidden sm:rounded-3xl">
        <DialogTitle className="sr-only">
          Misión 08: El Rompehielos — Consolidación de la Bola de Nieve
        </DialogTitle>
        <DialogDescription className="sr-only">
          Minijuego interactivo con el guardián Toto para compactar cuotas muertas en la bola de
          nieve y triturar pasivos cuesta abajo para desbloquear el Protocolo de Cierre de la Fase
          2.
        </DialogDescription>
        <TotoSnowballBreaker
          onClose={onClose}
          onCompleted={() => {
            if (onCompleted) onCompleted();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

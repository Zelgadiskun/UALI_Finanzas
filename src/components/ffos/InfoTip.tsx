import { useState } from "react";
import { Info } from "lucide-react";

/**
 * Jerga financiera ("capacidad libre", "0-base", "tasa anual") mostrada sin
 * ningún punto de apoyo para quien no la conoce todavía — justo el público
 * que esta app dice enseñar. Un toggle simple, no un popover con lógica de
 * posicionamiento: en mobile, tocar es más confiable que hover.
 */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="Más información"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-4 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      >
        <Info className="size-3" strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1.5 w-48 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 text-left text-[11px] font-normal leading-snug text-popover-foreground shadow-sheet"
        >
          {text}
        </span>
      )}
    </span>
  );
}

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-sheet-up safe-bottom absolute bottom-0 flex max-h-[88vh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-card border-t border-border/80 shadow-2xl",
          className,
        )}
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary active:scale-95 transition"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  );
}

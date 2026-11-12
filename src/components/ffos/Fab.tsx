import { Plus } from "lucide-react";

export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] right-[max(16px,calc(50vw-215px+16px))] z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
    >
      <Plus className="size-6" strokeWidth={2} />
    </button>
  );
}

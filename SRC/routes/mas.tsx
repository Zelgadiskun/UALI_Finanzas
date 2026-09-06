import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, RotateCcw, Target } from "lucide-react";
import { ProgressSheet } from "@/components/ffos/ProgressSheet";
import { ConfirmModal } from "@/components/ffos/ConfirmModal";
import { resetData, useFfos } from "@/lib/ffos/store";
import { levelInfo } from "@/lib/ffos/gamification";

const title = "Más — FFOS Wallet";
const description =
  "Progreso, logros, metas y ajustes de la cuenta familiar de FFOS Wallet, incluido el reinicio de los datos de demo.";

export const Route = createFileRoute("/mas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Mas,
});

function Mas() {
  const state = useFfos();
  const [progressOpen, setProgressOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const info = levelInfo(state.progress.xp);

  return (
    <main className="px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold">Más</h1>

      <div className="mt-4 space-y-2">
        <button
          onClick={() => setProgressOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card"
        >
          <Award className="size-5 text-accent" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Progreso y logros</span>
            <span className="block text-[12px] text-muted-foreground">
              Nivel {info.level} · {info.name} · {state.progress.xp} XP
            </span>
          </span>
        </button>

        <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 opacity-60">
          <Target className="size-5" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Metas</span>
            <span className="block text-[12px] text-muted-foreground">Disponible en la próxima fase</span>
          </span>
        </div>

        <button
          onClick={() => setConfirming(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-danger shadow-card"
        >
          <RotateCcw className="size-5" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Reiniciar datos de demo</span>
            <span className="block text-[12px] text-muted-foreground">
              Vuelve al estado inicial guardado en este dispositivo
            </span>
          </span>
        </button>
      </div>

      <ProgressSheet
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        progress={state.progress}
      />
      <ConfirmModal
        open={confirming}
        title="¿Reiniciar los datos?"
        description="Se borran los movimientos y el progreso guardados en este dispositivo."
        confirmLabel="Reiniciar"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          resetData();
          setConfirming(false);
          toast.success("Datos reiniciados");
        }}
      />
    </main>
  );
}

import { useState } from "react";
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface PWAInstallButtonProps {
  variant?: "banner" | "button" | "compact";
  className?: string;
}

export function PWAInstallButton({ variant = "banner", className = "" }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed or dismissed by user
  if (isInstalled || dismissed) {
    return null;
  }

  // If not installable and not iOS, we can still show info if rendered as button, but hide banner
  if (!isInstallable && !isIOS && variant === "banner") {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (variant === "compact" || variant === "button") {
    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          className={`inline-flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 px-3 py-1.5 text-xs font-bold text-teal-400 hover:bg-teal-500/25 active:scale-95 transition-all shadow-xs ${className}`}
        >
          <Download className="size-3.5" />
          <span>Instalar App PWA</span>
        </button>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-card to-card p-4 shadow-card transition-all ${className}`}
      >
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground p-1 rounded-full transition"
          aria-label="Cerrar aviso de instalación"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="size-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
            <Smartphone className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide uppercase text-teal-400">
                Instalá UALÍ en tu celular
              </span>
              <Sparkles className="size-3 text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Acceso instantáneo con 1 toque, modo sin conexión y notificaciones de gastos.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAction}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 px-3.5 py-1.5 text-xs font-extrabold shadow-sm active:scale-95 transition-all"
              >
                <Download className="size-3.5" />
                <span>
                  {isIOS ? "Ver cómo instalar en iPhone" : "Instalar en pantalla de inicio"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
}

function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl text-card-foreground animate-slide-up">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Instalar en iPhone o iPad</h3>
              <p className="text-[11px] text-muted-foreground">
                Funciona como una app de App Store
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
            <div className="size-6 rounded-full bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Toca el botón Compartir</p>
              <p className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                Está en la barra inferior de Safari{" "}
                <Share2 className="size-3.5 text-primary inline" />
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
            <div className="size-6 rounded-full bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Agregar a pantalla de inicio</p>
              <p className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
                Buscá la opción <PlusSquare className="size-3.5 text-primary inline" /> "Agregar a
                inicio".
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3">
            <div className="size-6 rounded-full bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">¡Listo! Confirmá en "Agregar"</p>
              <p className="text-muted-foreground text-[11px]">
                Tendrás el ícono de UALÍ sin barras de navegador y con rendimiento nativo.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-teal-500 py-2.5 text-xs font-extrabold text-teal-950 hover:bg-teal-400 transition"
        >
          Entendido, cerrar
        </button>
      </div>
    </div>
  );
}

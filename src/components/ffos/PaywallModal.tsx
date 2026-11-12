import { useState } from "react";
import {
  Check,
  Crown,
  Sparkles,
  Users,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  X,
  CreditCard,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/lib/ffos/subscriptionStore";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  triggerFeature?: "family" | "reports" | "radar" | "general";
}

export function PaywallModal({ open, onClose, triggerFeature = "general" }: PaywallModalProps) {
  const { isPro, planCycle, expiresAt, isTrial, activatePro, cancelPro } = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const handleSubscribe = async () => {
    setProcessing(true);
    // Simulate frictionless secure checkout
    await new Promise((resolve) => setTimeout(resolve, 800));
    activatePro(billing, true);
    setProcessing(false);
    toast.success("¡Bienvenido a UALÍ Dúo Pro! Tus 7 días de prueba están activos.", {
      description: "Todas las funciones prémium han sido desbloqueadas.",
    });
    onClose();
  };

  const handleCancel = () => {
    cancelPro();
    toast.info("Has vuelto al plan gratuito.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-auto rounded-3xl border border-teal-500/40 bg-card p-6 shadow-2xl text-card-foreground animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-full transition"
          aria-label="Cerrar modal"
        >
          <X className="size-5" />
        </button>

        {isPro ? (
          /* Active Subscription View */
          <div className="text-center py-4">
            <div className="mx-auto size-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Crown className="size-8" />
            </div>
            <h3 className="text-xl font-display font-black text-foreground">
              ¡Tenés UALÍ Dúo Pro Activo!
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              {isTrial
                ? "Estás disfrutando de tus 7 días de prueba gratis."
                : "Tu suscripción anual/mensual está al día."}
            </p>

            <div className="mt-5 rounded-2xl bg-secondary/50 border border-border p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ciclo:</span>
                <span className="font-bold uppercase text-foreground">
                  {planCycle === "yearly" ? "Anual (Ahorro 33%)" : "Mensual"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Próxima renovación:</span>
                <span className="font-bold text-foreground">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString() : "Activo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-extrabold text-teal-400 flex items-center gap-1">
                  <Check className="size-3.5" /> Sincronización & Reportes ilimitados
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="mt-6 w-full rounded-xl border border-danger/30 bg-danger-soft/30 py-2.5 text-xs font-bold text-danger hover:bg-danger-soft/60 transition"
            >
              Cancelar suscripción (volver a Plan Gratuito)
            </button>
          </div>
        ) : (
          /* High-Converting Fintech Paywall */
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-400 uppercase tracking-wider">
                <Crown className="size-3" /> UALÍ Dúo & Equipo
              </span>
              <span className="text-[11px] text-muted-foreground">Plan Prémium</span>
            </div>

            <h2 className="text-xl font-display font-extrabold leading-tight text-foreground">
              {triggerFeature === "family"
                ? "Sincronizá gastos en compañía y equipo sin discusiones ni fricción"
                : triggerFeature === "reports"
                  ? "Exportá reportes ejecutivos en PDF y Excel para tu contador"
                  : "El sistema operativo completo para las finanzas de tu hogar"}
            </h2>

            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Desbloqueá sincronización colaborativa en tiempo real, exportación ilimitada y radar
              con IA.
            </p>

            {/* Feature Bullets */}
            <div className="my-4 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="size-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-foreground">
                    Sincronización en Compañía & Equipo:
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    Reparto automático 50/50 y saldos de compensación en vivo.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="size-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-foreground">
                    Reportes Ejecutivos en PDF y CSV:
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    Descarga con 1 toque lista para presentar a bancos o tu contador.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="size-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-foreground">
                    Radar Inteligente GPS sin límites:
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    Alertas contextuales automáticas al entrar a tiendas o supermercados.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="size-5 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="size-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-foreground">
                    Copias de Seguridad Prioritarias:
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    Tus finanzas cifradas y sincronizadas en todos tus dispositivos.
                  </span>
                </div>
              </div>
            </div>

            {/* Billing Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary/60 border border-border mt-4">
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={`relative flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition text-center ${
                  billing === "yearly"
                    ? "bg-card text-foreground shadow-sm border border-teal-500/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-teal-500 px-1.5 py-0.2 text-[9px] font-black text-teal-950 uppercase">
                  Ahorra 33%
                </span>
                <span className="text-xs font-black">Plan Anual</span>
                <span className="text-[11px] font-extrabold text-teal-400">$39.99 / año</span>
                <span className="text-[9.5px] text-muted-foreground">($3.33/mes)</span>
              </button>

              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition text-center ${
                  billing === "monthly"
                    ? "bg-card text-foreground shadow-sm border border-teal-500/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-black">Plan Mensual</span>
                <span className="text-[11px] font-extrabold text-foreground">$4.99 / mes</span>
                <span className="text-[9.5px] text-muted-foreground">Cancela cuando quieras</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="mt-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-center">
              <p className="text-[11px] text-teal-300 font-semibold italic">
                “Nos ahorró todas las discusiones de dinero a fin de mes. La división de gastos es
                perfecta.”
              </p>
              <p className="text-[9.5px] text-muted-foreground mt-0.5">
                — Sofía & Lucas, usuarios Dúo
              </p>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={processing}
              onClick={handleSubscribe}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-teal-950 font-black py-3 px-4 text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-60"
            >
              {processing ? (
                <span>Procesando acceso…</span>
              ) : (
                <>
                  <Zap className="size-4 fill-current" />
                  <span>
                    Probar 7 Días Gratis — {billing === "yearly" ? "$39.99/año" : "$4.99/mes"}
                  </span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-muted-foreground mt-2">
              🔒 Prueba sin compromiso. Podés cancelar en cualquier momento desde tus ajustes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

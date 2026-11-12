import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Video,
  Sparkles,
  TrendingUp,
  X,
  MessageCircle,
  Instagram,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";

interface GrowthKitModalProps {
  open: boolean;
  onClose: () => void;
  referralCode?: string;
}

export function GrowthKitModal({
  open,
  onClose,
  referralCode = "PAREJAS2026",
}: GrowthKitModalProps) {
  const [activeTab, setActiveTab] = useState<"guiones" | "tips" | "referidos">("guiones");
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  if (!open) return null;

  const appShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : "https://uali-finanzas.com";

  const scripts = [
    {
      id: "script-1",
      title: "Guión 1: 'Cómo dividimos gastos en pareja sin matarnos'",
      hook: "“Si vivís con tu pareja y siguen mandándose capturas de transferencias por WhatsApp, están al borde de separarse...”",
      format: "Cara a cámara + corte rápido mostrando la pantalla de UALÍ",
      duration: "30 - 45 segundos",
      body: `[0-3s] GANCHO: Si vivís con tu pareja y siguen mandándose comprobantes por WhatsApp a fin de mes, paren todo. Hay una forma 100 veces más sana.

[4-15s] EL PROBLEMA: Antes siempre era lo mismo: '¿Quién pagó el súper? ¿Vos pagaste el alquiler o yo?'. Terminás con resentimiento o uno pagando de más sin darse cuenta.

[16-30s] LA SOLUCIÓN CON UALÍ: Descubrimos UALÍ Finanzas. Creamos un espacio compartido. Cuando yo pago las compras, lo cargo como 'Compartido'. Cuando mi pareja paga la luz, lo carga igual. La app calcula el saldo de compensación exacto: 'Carlos le debe $35 a Ana'. Se hace una sola transferencia al mes y chau lío.

[31-40s] CTA: Además tiene una racha con mascotas que te premia por no salirte del presupuesto. Pruébenla gratis en el link de mi perfil.`,
      tags: "#finanzasenpareja #ualifinanzas #gastoscompartidos #parejasfelices #finanzaspersonales #ahorro",
    },
    {
      id: "script-2",
      title: "Guión 2: 'El error de $500 al convivir juntos'",
      hook: "“El peor error financiero que cometen las parejas al mudarse juntos es pensar que 50/50 significa pagar las mismas cosas por turnos.”",
      format: "Storytelling / Vlog de pareja cocinando o haciendo compras",
      duration: "40 segundos",
      body: `[0-4s] GANCHO: El peor error financiero de convivir es turnarse los gastos al azar: 'yo pago esta cena y vos la próxima'. Casi siempre uno termina poniendo $400 de más.

[5-18s] CÓMO LO RESOLVIMOS: Ahora aplicamos la regla 50/30/20 sincronizada en UALÍ. Cada uno tiene sus gastos personales privados, pero los gastos del hogar van a una bolsa común automatizada.

[19-32s] LO MEJOR: No tenés que abrir una cuenta de banco conjunta ni compartir contraseñas. Cada uno usa su app en el celular, sincronizan con un código y listo.

[33-40s] CTA: Etiquetá a tu pareja para que lo configuren hoy en 2 minutos. Link en bio.`,
      tags: "#parejastiktok #vidaenpareja #gastosdelhogar #ahorointeligente #finanzasfaciles #ualiapp",
    },
    {
      id: "script-3",
      title: "Guión 3: 'Por qué dejamos de usar Excel para nuestras finanzas'",
      hook: "“Por favor no le armen un Excel a su pareja para registrar los gastos. Miren lo que usamos nosotros.”",
      format: "Humor / Pantalla dividida",
      duration: "25 - 35 segundos",
      body: `[0-3s] GANCHO: Intentar obligar a tu pareja a llenar un Excel todos los domingos es el método más rápido para que te odie.

[4-16s] LA DIFERENCIA: Pasamos a UALÍ Finanzas. Parece un juego: tenés personajes, ganas experiencia (XP), y cuando entrás al supermercado el radar por GPS te recuerda registrar el gasto en 3 segundos.

[17-28s] EL RESULTADO: Llevamos 3 meses sin pasarnos del presupuesto y por primera vez armamos nuestro fondo de ahorro 'Nido'.

[29-35s] CTA: Es web app, se instala directo en la pantalla del celular sin App Store. Link en bio.`,
      tags: "#adiosExcel #organizacionfinanciera #metododeahorro #presupuestofamiliar #ualifinanzas",
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScriptId(id);
    toast.success("¡Guión copiado al portapapeles!", {
      description: "Pegalo en tus notas de celular y grabalo hoy.",
    });
    setTimeout(() => setCopiedScriptId(null), 2500);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "UALÍ Finanzas — Gestión de gastos en pareja",
          text: "Te invito a probar UALÍ para dividir gastos y organizar nuestro presupuesto juntos sin pelear:",
          url: appShareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(appShareUrl);
      toast.success("Enlace de invitación copiado.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl border border-teal-500/40 bg-card p-6 shadow-2xl text-card-foreground animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Video className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-extrabold text-foreground">
                  Kit de Crecimiento & TikTok
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.2 text-[10px] font-black uppercase">
                  Coste $0
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Estrategia viral de contenido orgánico para adquirir tus primeros 1,000 usuarios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full"
            aria-label="Cerrar modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border mt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("guiones")}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "guiones"
                ? "border-teal-400 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="size-3.5" />
            <span>Guiones Virales (3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tips")}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "tips"
                ? "border-teal-400 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Claves de Algoritmo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("referidos")}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === "referidos"
                ? "border-teal-400 text-teal-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HeartHandshake className="size-3.5" />
            <span>Link de Pareja</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-4">
          {activeTab === "guiones" && (
            <div className="space-y-4">
              {scripts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-secondary/30 p-4 transition-all hover:border-teal-500/30"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-black text-foreground">{s.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        ⏱️ {s.duration} · 🎥 {s.format}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(s.id, `${s.title}\n\n${s.body}\n\nHashtags:\n${s.tags}`)
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-500/15 border border-teal-500/30 px-2 py-1 text-[11px] font-bold text-teal-400 hover:bg-teal-500/25 active:scale-95 transition"
                    >
                      {copiedScriptId === s.id ? (
                        <>
                          <Check className="size-3" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-2.5 rounded-xl bg-card/80 p-2.5 text-[11.5px] border border-border/60">
                    <span className="font-extrabold text-amber-300 block mb-1">
                      Gancho sugerido:
                    </span>
                    <span className="italic text-foreground">{s.hook}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed">
                    {s.body}
                  </div>

                  <div className="mt-2.5 text-[10px] text-teal-400 font-mono">{s.tags}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "tips" && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-3.5">
                <h4 className="font-extrabold text-teal-300 flex items-center gap-1.5">
                  <TrendingUp className="size-4" /> La Regla de Oro de los 3 Segundos
                </h4>
                <p className="text-muted-foreground mt-1 text-[11.5px]">
                  Nunca digas: “Hola a todos, hoy les voy a hablar de una aplicación”. Di
                  directamente: “Si tu pareja y vos discuten por dinero, miren esto”. El 80% de la
                  retención se decide antes del segundo 3.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                <h4 className="font-extrabold text-foreground">📱 Muestra la App en la Mano</h4>
                <p className="text-muted-foreground mt-1 text-[11.5px]">
                  Los videos donde se ve un teléfono físico con UALÍ en la mano abriendo el menú de
                  compensación tienen 3 veces más conversiones que capturas de pantalla estáticas.
                  La gente necesita ver que es real y táctil.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                <h4 className="font-extrabold text-foreground">
                  🔥 Llamado a la Acción (CTA) Claro
                </h4>
                <p className="text-muted-foreground mt-1 text-[11.5px]">
                  Termina siempre con una sola orden clara: “Dejé el link directo en mi perfil para
                  que la prueben gratis”. Pon el enlace en la biografía de TikTok/Instagram.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                <h4 className="font-extrabold text-foreground">
                  📅 Constancia de 1 Video Diario por 30 Días
                </h4>
                <p className="text-muted-foreground mt-1 text-[11.5px]">
                  TikTok necesita entre 15 y 30 videos para indexar tu nicho (“Finanzas en pareja /
                  Parejas adultas”). Si posteas 1 al día, 2 o 3 se harán virales de forma 100%
                  gratuita.
                </p>
              </div>
            </div>
          )}

          {activeTab === "referidos" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-center">
                <h4 className="font-extrabold text-foreground text-sm">
                  Enlace de Invitación de tu Comunidad
                </h4>
                <p className="text-[11.5px] text-muted-foreground mt-1">
                  Comparte este enlace en la bio de tus redes sociales o envíalo a parejas amigas.
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-card border border-border p-2">
                  <input
                    type="text"
                    readOnly
                    value={appShareUrl}
                    className="bg-transparent flex-1 text-xs text-foreground font-mono focus:outline-hidden px-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(appShareUrl);
                      toast.success("Enlace copiado al portapapeles");
                    }}
                    className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition shrink-0"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 text-teal-950 font-bold px-4 py-2 text-xs hover:bg-teal-400 active:scale-95 transition"
                  >
                    <Share2 className="size-3.5" />
                    <span>Compartir por WhatsApp / Redes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

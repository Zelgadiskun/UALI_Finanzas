import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  PieChart,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Home,
  Plus,
  ArrowLeftRight,
  CreditCard,
  LayoutGrid,
  TrendingUp,
  Award,
  Wallet,
  Calculator,
  Menu,
  Navigation,
  MapPin,
  WifiOff,
  PiggyBank,
} from "lucide-react";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { cn } from "@/lib/utils";

const TUTORIAL_STORAGE_KEY = "uali_tutorial_completed_v3";

export function isTutorialCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
}

export function setTutorialCompleted(completed = true) {
  if (typeof window === "undefined") return;
  if (completed) {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  }
}

export interface Step {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  renderVisual: () => React.ReactNode;
  body: string[];
  principle: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    badge: "Bienvenido a Ualí",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    title: "Manejar tu dinero ahora es simple, claro y en equipo",
    subtitle: "Tu entrenador financiero con buena onda para móvil, tablet y web",
    renderVisual: () => (
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="size-16 relative animate-float">
          <NidoCharacter className="w-full h-full drop-shadow-md" />
        </div>
        <div className="size-16 relative animate-float" style={{ animationDelay: "0.4s" }}>
          <TotoCharacter className="w-full h-full drop-shadow-md" />
        </div>
        <div className="size-16 relative animate-float" style={{ animationDelay: "0.8s" }}>
          <ChispaCharacter className="w-full h-full drop-shadow-md" />
        </div>
      </div>
    ),
    body: [
      "¿Cansado de hojas de cálculo aburridas y calculadoras que parecen trámites bancarios? Te entendemos.",
      "En UALÍ Finanzas venimos a darte superpoderes para tomar el control de tu dinero, entender tu flujo de caja real, presupuestar sin culpa y cumplir metas personales o en compañía.",
    ],
    principle: "El dinero bien organizado no te quita libertad: te la regala.",
  },
  {
    id: "responsive-navigation",
    badge: "Arquitectura Multi-pantalla",
    badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    title: "Móvil táctil y Menú de Hamburguesa en Tablet & Web",
    subtitle: "Diseñado para adaptarse con máxima comodidad a cualquier pantalla",
    renderVisual: () => (
      <div className="bg-[#0B1323] border border-border/80 rounded-2xl p-3 shadow-inner space-y-3">
        {/* Simulación Desktop / Tablet */}
        <div className="border border-border/60 rounded-xl p-2 bg-card/60">
          <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-border/40">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Wallet className="size-3.5 text-[#2EC4B6]" />
              UALÍ Tablet & Web
            </span>
            <span className="px-2 py-0.5 rounded-md bg-secondary text-[#2EC4B6] font-black text-[10px] flex items-center gap-1">
              <Menu className="size-3" /> Menú de Hamburguesa
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 text-[10px] text-muted-foreground">
            <span>Acceso directo a todos los módulos y modo oscuro</span>
            <span className="text-[#2EC4B6] font-bold">+ Nuevo Movimiento</span>
          </div>
        </div>

        {/* Simulación Móvil */}
        <div className="border border-border/60 rounded-xl p-2 bg-card/40">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span className="font-bold text-foreground">Versión Móvil</span>
            <span className="text-teal-400 font-bold">Botón central ergonómico</span>
          </div>
          <div className="flex items-center justify-around py-1">
            <div className="flex flex-col items-center gap-0.5">
              <Home className="size-3.5 text-[#2EC4B6]" />
              <span className="text-[8px] font-bold text-teal-400">Inicio</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <PieChart className="size-3.5 text-[#F59E0B]" />
              <span className="text-[8px] font-bold text-amber-400">Presup</span>
            </div>
            <div className="-mt-2 flex flex-col items-center">
              <div className="size-7 rounded-full bg-[#2EC4B6] flex items-center justify-center text-slate-950 font-black shadow-md">
                <Plus className="size-4 stroke-[3]" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles className="size-3.5 text-[#A855F7]" />
              <span className="text-[8px] font-bold text-purple-400">Aprende</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <LayoutGrid className="size-3.5 text-[#6366F1]" />
              <span className="text-[8px] font-bold text-indigo-400">Más</span>
            </div>
          </div>
        </div>
      </div>
    ),
    body: [
      "En teléfonos inteligentes tienes una barra inferior táctil con el botón central elevado '+' para registrar gastos o ingresos en 5 segundos.",
      "En tablets y computadoras disfrutas de un lienzo amplio con el nuevo Menú de Hamburguesa superior y barra de navegación completa sin marcos apretados.",
    ],
    principle: "Tu información siempre disponible en cualquier dispositivo sin fricción.",
  },
  {
    id: "cashflow",
    badge: "Flujo de Caja Continuo",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    title: "Tu dinero nunca se pierde al cambiar de mes",
    subtitle: "El remanente acumulado se transfiere automáticamente",
    renderVisual: () => (
      <div className="bg-secondary/60 border border-emerald-500/30 rounded-2xl p-3 shadow-inner space-y-2">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span className="text-muted-foreground">Puente de Flujo Continuo</span>
          <span className="text-emerald-400 flex items-center gap-1 font-extrabold text-[10px]">
            <TrendingUp className="size-3.5" /> Saldo Activo
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-card border border-border/80 rounded-xl p-1.5">
            <span className="text-[9px] text-muted-foreground block font-bold">Mes Anterior</span>
            <span className="text-xs font-black text-teal-400">+ Remanente</span>
          </div>
          <div className="flex items-center justify-center font-black text-muted-foreground text-xs">
            +
          </div>
          <div className="bg-card border border-border/80 rounded-xl p-1.5">
            <span className="text-[9px] text-muted-foreground block font-bold">Mes Actual</span>
            <span className="text-xs font-black text-foreground">Flujo Neto</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">En Caja vs Ahorro Nido:</span>
          <strong className="text-emerald-400 font-black">
            Líquido disponible diferenciado de ahorros
          </strong>
        </div>
      </div>
    ),
    body: [
      "En UALÍ, iniciar un nuevo mes no borra tu saldo acumulado ni tus ahorros a cero.",
      "Todo saldo remanente de meses anteriores se arrastra automáticamente a tu balance operativo, permitiéndote comparar la variación mes a mes (MoM) de tus finanzas.",
    ],
    principle: "La continuidad financiera es la base de la tranquilidad patrimonial.",
  },
  {
    id: "budget-donut",
    badge: "Presupuesto & Gráfico de Anillo",
    badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    title: "Visualización en dona y Asistente Base Cero",
    subtitle: "Asigna una misión a cada peso antes de gastar",
    renderVisual: () => (
      <div className="bg-[#0B1323] border border-amber-500/30 rounded-2xl p-3 shadow-inner space-y-2.5">
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40">
          <span className="text-muted-foreground font-bold flex items-center gap-1.5">
            <Calculator className="size-3.5 text-teal-400" />
            Sobres y Reparto Base Cero
          </span>
          <span className="text-amber-400 font-black text-xs">50 / 30 / 20</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="bg-card/90 border border-teal-500/30 rounded-xl p-1.5">
            <span className="text-[9px] text-teal-400 block font-bold">Necesidades (50%)</span>
            <span className="text-[11px] font-black text-foreground">Alquiler, Súper</span>
          </div>
          <div className="bg-card/90 border border-purple-500/30 rounded-xl p-1.5">
            <span className="text-[9px] text-purple-400 block font-bold">Deseos (30%)</span>
            <span className="text-[11px] font-black text-foreground">Salidas, Gustos</span>
          </div>
          <div className="bg-card/90 border border-amber-500/30 rounded-xl p-1.5">
            <span className="text-[9px] text-amber-400 block font-bold">Nido (20%)</span>
            <span className="text-[11px] font-black text-foreground">Metas & Ahorro</span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10.5px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Alertas de Sobregiro:
          </span>
          <span className="font-black text-emerald-300">Avisos proactivos si un rubro excede</span>
        </div>
      </div>
    ),
    body: [
      "La sección Presupuesto ahora cuenta con un Gráfico de Anillo interactivo para ver de un vistazo el reparto de tus consumos por colores.",
      "Usa el Asistente Base Cero para aplicar reglas populares (50/30/20, 60/15/25 o libre). Si algún sobre está cerca de agotarse o se sobregira, UALÍ te alerta al instante.",
    ],
    principle: "Presupuestar no es limitarte: es darte permiso de gastar sin culpa en lo planeado.",
  },
  {
    id: "guardians-gamification",
    badge: "Misiones, Racha & Puntos FFOS",
    badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    title: "Lecciones interactivas con Chispa, Toto y Nido",
    subtitle: "Aprende finanzas jugando en píldoras de 2 minutos",
    renderVisual: () => (
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/60 border border-teal-500/30 rounded-xl p-2 flex flex-col items-center text-center">
          <NidoCharacter className="size-10 mb-1" />
          <span className="text-[11px] font-black text-teal-400">Nido</span>
          <span className="text-[9px] text-muted-foreground font-semibold">Reserva y Metas</span>
        </div>
        <div className="bg-secondary/60 border border-blue-500/30 rounded-xl p-2 flex flex-col items-center text-center">
          <TotoCharacter className="size-10 mb-1" />
          <span className="text-[11px] font-black text-blue-400">Toto</span>
          <span className="text-[9px] text-muted-foreground font-semibold">Flujo de Caja</span>
        </div>
        <div className="bg-secondary/60 border border-purple-500/30 rounded-xl p-2 flex flex-col items-center text-center">
          <ChispaCharacter className="size-10 mb-1" />
          <span className="text-[11px] font-black text-purple-400">Chispa</span>
          <span className="text-[9px] text-muted-foreground font-semibold">Misiones & XP</span>
        </div>
      </div>
    ),
    body: [
      "En la sección 'Aprender' encontrarás lecciones de finanzas personales, tests rápidos y rituales de cierre de ciclo guiados por Chispa.",
      "Acumula racha diaria y Puntos FFOS (tus fichas de maestría) para subir de nivel y desbloquear nuevas insignias.",
    ],
    principle: "2 minutos de educación al día construyen el hábito más rentable de tu vida.",
  },
  {
    id: "shared-space",
    badge: "Modo Compañía & Cifrado",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    title: "En pareja o equipo: Cuentas claras, cero dramas",
    subtitle: "Privado por defecto, compartido por elección",
    renderVisual: () => (
      <div className="bg-secondary/60 border border-border/80 rounded-2xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-teal-500/40 rounded-xl p-2.5 text-center">
            <ShieldCheck className="size-5 text-teal-400 mx-auto mb-1" />
            <span className="text-xs font-black text-foreground block">Solo Míos</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              100% Cifrado personal
            </span>
          </div>
          <div className="bg-card border border-blue-500/40 rounded-xl p-2.5 text-center">
            <Users className="size-5 text-blue-400 mx-auto mb-1" />
            <span className="text-xs font-black text-foreground block">En Compañía</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Reparto porcentual mutuo
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Tú decides qué entra al pozo común y qué se mantiene en tu bolsillo privado.
        </p>
      </div>
    ),
    body: [
      "Todo lo que registras en UALÍ permanece privado en tu cuenta bajo políticas de seguridad en Supabase.",
      "Si creas un Espacio en Compañía, puedes invitar a tu pareja o socio para coordinar presupuestos del hogar y registrar quién pagó qué con un solo toque.",
    ],
    principle: "Cuentas transparentes conservan la armonía y la tranquilidad en casa.",
  },
  {
    id: "gps-offline",
    badge: "GPS de Comercios & PWA Offline",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    title: "Detección inteligente y funcionamiento sin internet",
    subtitle: "Radar de ubicación y persistencia local garantizada",
    renderVisual: () => (
      <div className="bg-secondary/60 border border-emerald-500/30 rounded-2xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-emerald-500/40 rounded-xl p-2.5 text-center">
            <MapPin className="size-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-xs font-black text-foreground block">Radar GPS</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Detecta comercios frecuentes
            </span>
          </div>
          <div className="bg-card border border-teal-500/40 rounded-xl p-2.5 text-center">
            <WifiOff className="size-5 text-teal-400 mx-auto mb-1" />
            <span className="text-xs font-black text-foreground block">Modo Offline</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Sincroniza al reconectar
            </span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Instala UALÍ como aplicación (PWA) en tu teléfono o computadora para abrirla al instante.
        </p>
      </div>
    ),
    body: [
      "Si estás en un supermercado o farmacia habitual, el Radar GPS te sugiere registrar el consumo con 1 solo toque para que no se te olvide ningún comprobante.",
      "¿Te quedaste sin señal o datos? No hay problema: la app sigue funcionando 100% offline y sincroniza tus operaciones pendientes en cuanto recuperas conexión.",
    ],
    principle: "Tecnología silenciosa que trabaja para ti en el momento exacto.",
  },
];

export function TutorialModal({
  open,
  onClose,
  initialStepId,
}: {
  open: boolean;
  onClose: () => void;
  initialStepId?: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      if (initialStepId) {
        const found = STEPS.findIndex((s) => s.id === initialStepId);
        setCurrentStep(found >= 0 ? found : 0);
      } else {
        setCurrentStep(0);
      }
    }
  }, [open, initialStepId]);

  if (!open) return null;

  const step = STEPS[currentStep] || STEPS[0]!;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      setTutorialCompleted(true);
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrev() {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function handleSkip() {
    setTutorialCompleted(true);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-card border border-border/80 shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col justify-between">
        {/* Luces atmosféricas de fondo */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 size-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Header superior: saltar + indicador de pasos */}
        <div className="relative z-10 flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STEPS.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                aria-label={`Ir al paso ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  index === currentStep
                    ? "w-6 bg-teal-400"
                    : index < currentStep
                      ? "w-2 bg-teal-400/50"
                      : "w-2 bg-muted",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1 p-1 cursor-pointer"
          >
            <span>Saltar tour</span>
            <X className="size-3.5" />
          </button>
        </div>

        {/* Contenido del paso actual */}
        <div className="relative z-10 py-3 space-y-3.5 overflow-y-auto no-scrollbar">
          {/* Badge de categoría */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border",
                step.badgeColor,
              )}
            >
              {step.badge}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Paso {currentStep + 1} de {STEPS.length}
            </span>
          </div>

          {/* Título & Subtítulo */}
          <div>
            <h2
              id="tutorial-title"
              className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-tight font-sans"
            >
              {step.title}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">{step.subtitle}</p>
          </div>

          {/* Visual interactivo del paso */}
          <div className="py-1">{step.renderVisual()}</div>

          {/* Textos explicativos */}
          <div className="space-y-2 text-xs text-foreground/90 leading-relaxed">
            {step.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {/* Principio / Takeaway */}
          <div className="p-3 rounded-2xl bg-secondary/70 border border-teal-500/20 text-xs text-foreground flex items-start gap-2 shadow-inner">
            <Sparkles className="size-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="italic font-medium text-[11px] text-muted-foreground">
              "{step.principle}"
            </p>
          </div>
        </div>

        {/* Footer con botones Prev / Next */}
        <div className="relative z-10 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          {!isFirst ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-3.5 py-2.5 rounded-xl border border-border bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-secondary active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 active:scale-98 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isLast ? "¡Comenzar con UALÍ!" : "Siguiente"}</span>
            {isLast ? (
              <CheckCircle2 className="size-4 stroke-[2.5]" />
            ) : (
              <ArrowRight className="size-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

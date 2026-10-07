import { useState, useEffect } from "react";
import {
  Compass,
  ShieldCheck,
  PieChart,
  Flame,
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
} from "lucide-react";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { cn } from "@/lib/utils";

const TUTORIAL_STORAGE_KEY = "uali_tutorial_completed_v2";

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

  const STEPS: Step[] = [
    {
      id: "welcome",
      badge: "Bienvenido a Ualí",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      title: "Manejar tu plata puede ser simple y divertido",
      subtitle: "Tu entrenador financiero mobile-first con buena onda",
      renderVisual: () => (
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="size-16 relative animate-float">
            <NidoCharacter className="w-full h-full drop-shadow-md" />
          </div>
          <div className="size-16 relative animate-float" style={{ animationDelay: "0.5s" }}>
            <TotoCharacter className="w-full h-full drop-shadow-md" />
          </div>
          <div className="size-16 relative animate-float" style={{ animationDelay: "1s" }}>
            <ChispaCharacter className="w-full h-full drop-shadow-md" />
          </div>
        </div>
      ),
      body: [
        "¿Cansado de hojas de cálculo aburridas y calculadoras que parecen trámites bancarios? Te entendemos.",
        "En Ualí Finanzas venimos a darte superpoderes para tomar el control de tu dinero, entender tu flujo de caja real y cumplir metas sin dramas.",
      ],
      principle: "El dinero bien organizado no te quita libertad: te la regala.",
    },
    {
      id: "navigation",
      badge: "Navegación & Botón Central '+'",
      badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      title: "Todo al alcance de tu pulgar en 1 toque",
      subtitle: "Estructura ergonómica con botón central elevado",
      renderVisual: () => (
        <div className="bg-[#0B1323] border border-border/80 rounded-2xl p-3 shadow-inner space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pb-1 border-b border-border/40">
            <span className="font-bold text-foreground">Barra Inferior Ualí 2.0</span>
            <span className="text-teal-400 font-bold">6 secciones + Hero FAB</span>
          </div>

          <div className="grid grid-cols-7 items-center gap-1 text-center py-1">
            <div className="flex flex-col items-center gap-0.5">
              <Home className="size-4 text-[#2EC4B6]" />
              <span className="text-[8px] font-bold text-teal-400">Inicio</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <ArrowLeftRight className="size-4 text-[#3B82F6]" />
              <span className="text-[8px] font-bold text-blue-400">Movs</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Sparkles className="size-4 text-[#A855F7]" />
              <span className="text-[8px] font-bold text-purple-400">Aprende</span>
            </div>
            {/* Central Button */}
            <div className="-mt-3 flex flex-col items-center">
              <div className="size-9 rounded-full bg-gradient-to-tr from-[#1E968B] to-[#2EC4B6] flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/30 border border-background">
                <Plus className="size-5 stroke-[2.5]" />
              </div>
              <span className="text-[8px] font-black text-teal-300 mt-0.5">Nuevo</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <PieChart className="size-4 text-[#F59E0B]" />
              <span className="text-[8px] font-bold text-amber-400">Presup</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <CreditCard className="size-4 text-[#F43F5E]" />
              <span className="text-[8px] font-bold text-rose-400">Deudas</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <LayoutGrid className="size-4 text-[#6366F1]" />
              <span className="text-[8px] font-bold text-indigo-400">Más</span>
            </div>
          </div>
        </div>
      ),
      body: [
        "El botón '+' central elevado te permite cargar ingresos, gastos, aportes de Nido o pagos de deudas desde cualquier pantalla sin botones flotantes que tapen tus datos.",
        "Las 6 pestañas a sus lados se iluminan y escalan suavemente adoptando su color de identidad al tocarlas.",
      ],
      principle: "Cargar tus consumos toma 5 segundos y evita dolores de cabeza a fin de mes.",
    },
    {
      id: "guardians",
      badge: "Tus 3 Guardianes",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      title: "Nido, Toto y Chispa a tu lado",
      subtitle: "Cada personaje cumple un rol clave en tu economía",
      renderVisual: () => (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary/60 border border-teal-500/30 rounded-xl p-2 flex flex-col items-center text-center">
            <NidoCharacter className="size-10 mb-1" />
            <span className="text-[11px] font-black text-teal-400">Nido</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Ahorro y Reserva</span>
          </div>
          <div className="bg-secondary/60 border border-blue-500/30 rounded-xl p-2 flex flex-col items-center text-center">
            <TotoCharacter className="size-10 mb-1" />
            <span className="text-[11px] font-black text-blue-400">Toto</span>
            <span className="text-[9px] text-muted-foreground font-semibold">
              Flujo & Decisiones
            </span>
          </div>
          <div className="bg-secondary/60 border border-purple-500/30 rounded-xl p-2 flex flex-col items-center text-center">
            <ChispaCharacter className="size-10 mb-1" />
            <span className="text-[11px] font-black text-purple-400">Chispa</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Misiones & XP</span>
          </div>
        </div>
      ),
      body: [
        "Nido protege tu fondo de emergencia y colchón de tranquilidad para que nunca toques tus ahorros por descuido.",
        "Toto cuida tu balance transaccional diario y te guía en decisiones para que tu dinero rinda más.",
        "Chispa te desafía con lecciones flash interactivas de 2 minutos para mantener encendida tu racha financiera.",
      ],
      principle: "Un equipo sincronizado convierte metas complejas en pasos sencillos.",
    },
    {
      id: "cashflow",
      badge: "Flujo de Caja Continuo",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      title: "Tu dinero nunca se pierde al cambiar de mes",
      subtitle: "El remanente acumulado se transfiere automáticamente",
      renderVisual: () => (
        <div className="bg-secondary/60 border border-emerald-500/30 rounded-2xl p-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
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

          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Flujo de Caja Real:</span>
            <strong className="text-emerald-400 font-black">
              Conserva tus fondos históricos sin arrancar de cero
            </strong>
          </div>
        </div>
      ),
      body: [
        "En Ualí, iniciar un nuevo mes no resetea tus ahorros ni tu liquidez en mano a cero.",
        "Todo saldo no gastado del mes anterior se arrastra como Remanente de Caja inicial, permitiéndote comparar mes a mes cómo evoluciona tu patrimonio.",
      ],
      principle:
        "La continuidad financiera es la base de la tranquilidad: tu dinero sigue donde lo dejaste.",
    },
    {
      id: "ffos-points",
      badge: "Puntos FFOS (Experiencia & Recompensas)",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      title: "¿Qué son los Puntos FFOS?",
      subtitle: "La única sigla oficial para medir tu maestría financiera",
      renderVisual: () => (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/30 rounded-2xl p-3 flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
            <Award className="size-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                Puntos FFOS
              </span>
              <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-[11px] text-foreground leading-snug mt-0.5">
              Son las siglas de tus <strong className="text-amber-300">fichas de maestría</strong>.
              Las ganas al registrar a tiempo, ahorrar en Nido y superar desafíos diarios.
            </p>
          </div>
        </div>
      ),
      body: [
        "En Ualí la sigla 'FFOS' se utiliza exclusivamente para nombrar a los Puntos y Monedas de Experiencia que ganas con tus buenos hábitos.",
        "Suma Puntos FFOS para subir de nivel, desbloquear logros y demostrar tu destreza administrando cada peso.",
      ],
      principle: "2 minutos al día crean el hábito más rentable y divertido de tu vida.",
    },
    {
      id: "privacy",
      badge: "Cifrado Ualí & Modo Pareja",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
      title: "Lo tuyo es tuyo: Privacidad sin dramas",
      subtitle: "Privado por defecto, compartido por elección",
      renderVisual: () => (
        <div className="bg-secondary/60 border border-border/80 rounded-2xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-teal-500/40 rounded-xl p-2.5 text-center">
              <ShieldCheck className="size-5 text-teal-400 mx-auto mb-1" />
              <span className="text-xs font-black text-foreground block">Solo míos</span>
              <span className="text-[9px] text-muted-foreground">100% Cifrado personal</span>
            </div>
            <div className="bg-card border border-blue-500/40 rounded-xl p-2.5 text-center">
              <Users className="size-5 text-blue-400 mx-auto mb-1" />
              <span className="text-xs font-black text-foreground block">Compartido</span>
              <span className="text-[9px] text-muted-foreground">Cupos en pareja / equipo</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Tú decides qué entra al pozo común y qué se mantiene en tu bolsillo privado.
          </p>
        </div>
      ),
      body: [
        "Todo lo que anotas en Ualí está protegido por nuestro Cifrado Ualí y es privado salvo que decidas sincronizarlo.",
        "Si armas un espacio compartido con tu pareja o familia, fijan presupuestos conjuntos y reparten cuotas sin discusiones incómodas a fin de mes.",
      ],
      principle: "Cuentas súper claras para conservar la paz mental y los buenos momentos.",
    },
    {
      id: "zero-base-budget",
      badge: "Manual: Asistente 0-Base & Porcentajes",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      title: "Reparto de Ingresos: 0-Base y 50/30/20",
      subtitle: "¿Cómo y cuándo dividir tus ingresos correctamente?",
      renderVisual: () => (
        <div className="bg-[#0B1323] border border-amber-500/30 rounded-2xl p-3 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40">
            <span className="text-muted-foreground font-bold flex items-center gap-1.5">
              <Calculator className="size-3.5 text-teal-400" />
              Ingreso Total del Ciclo
            </span>
            <span className="text-foreground font-black text-xs">$1,500.00</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-card/90 border border-teal-500/30 rounded-xl p-1.5">
              <span className="text-[9px] text-teal-400 block font-bold">50% Necesidades</span>
              <span className="text-[11px] font-black text-foreground">$750.00</span>
              <span className="text-[8px] text-muted-foreground block truncate">
                Súper, Casa, Gas
              </span>
            </div>
            <div className="bg-card/90 border border-purple-500/30 rounded-xl p-1.5">
              <span className="text-[9px] text-purple-400 block font-bold">30% Deseos</span>
              <span className="text-[11px] font-black text-foreground">$450.00</span>
              <span className="text-[8px] text-muted-foreground block truncate">
                Salidas, Gustos
              </span>
            </div>
            <div className="bg-card/90 border border-amber-500/30 rounded-xl p-1.5">
              <span className="text-[9px] text-amber-400 block font-bold">20% Ahorro</span>
              <span className="text-[11px] font-black text-foreground">$300.00</span>
              <span className="text-[8px] text-muted-foreground block truncate">Fondo Nido</span>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10.5px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Método Base Cero:
            </span>
            <span className="font-black text-emerald-300">Ingreso - Reparto = $0.00</span>
          </div>
        </div>
      ),
      body: [
        "¿Cuándo se ejecuta? Al inicio de cada mes o ciclo (mediante el banner interactivo en Presupuesto) o bajo demanda tocando el botón '0-Base' en cualquier momento.",
        "El Método Base Cero significa que cada peso tiene una misión asignada antes de empezar a gastar. Si sobran fondos sin planificar, se evaporan en gastos hormiga.",
        "Elige entre la regla 50/30/20 (Equilibrado), 60/15/25 (Acelerador de Deudas/Ahorro) o 0-Base Libre, mientras Toto, Nido y Chispa cuidan tus límites en vivo.",
      ],
      principle:
        "Presupuestar no es limitarte: es darte permiso de gastar sin culpa en lo que decidiste.",
    },
  ];

  const step = STEPS[currentStep]!;
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border/80 shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col justify-between">
        {/* Luces atmosféricas de fondo */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 size-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Header superior: saltar + indicador de pasos */}
        <div className="relative z-10 flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                aria-label={`Ir al paso ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
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
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1 p-1"
          >
            <span>Saltar tour</span>
            <X className="size-3.5" />
          </button>
        </div>

        {/* Contenido del paso actual */}
        <div className="relative z-10 py-3 space-y-3.5 overflow-y-auto">
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
              className="px-3.5 py-2.5 rounded-xl border border-border bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-secondary active:scale-95 transition"
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
            className="flex-1 py-3 px-4 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            <span>{isLast ? "¡Comenzar con Ualí!" : "Siguiente"}</span>
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

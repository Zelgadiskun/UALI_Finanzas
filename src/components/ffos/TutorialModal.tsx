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
} from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_STORAGE_KEY = "uali_tutorial_completed_v1";

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

interface Step {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: typeof Compass;
  iconBg: string;
  iconColor: string;
  body: string[];
  principle: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    badge: "Bienvenido a UALI",
    title: "¡Chau estrés! Manejar la plata puede ser divertido",
    subtitle: "Tu entrenador de bolsillo con buena onda",
    icon: Sparkles,
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    body: [
      "¿Cansado de hojas de cálculo aburridas y calculadoras que parecen trámites bancarios? Te entendemos.",
      "En UALI no venimos a juzgarte por ese cafecito rico ni a aburrirte con tecnicismos: venimos a darte superpoderes para tomar el control de tu plata con una sonrisa.",
    ],
    principle: "El dinero bien manejado no te quita libertad: te la regala.",
  },
  {
    id: "privacy",
    badge: "Principio 1: Cero Chusmas",
    title: "Lo tuyo es tuyo: Privacidad total",
    subtitle: "Privado por defecto, compartido por elección",
    icon: ShieldCheck,
    iconBg: "bg-accent-soft",
    iconColor: "text-accent",
    body: [
      "Todo lo que anotas en UALI es 100% privado y solo tú lo ves. Tus números no andan paseando por ahí.",
      "Si armas un espacio con tu pareja, compas de departamento o familia, tú decides qué movimientos entran al pozo común y cuáles se quedan en tu bolsillo.",
    ],
    principle: "Cuentas súper claras para conservar la paz mental y los buenos momentos.",
  },
  {
    id: "budget",
    badge: "Principio 2: La Regla 50 / 30 / 20",
    title: "Gasta en lo que disfrutas, pero con estrategia",
    subtitle: "La fórmula mágica para no llegar raspando a fin de mes",
    icon: PieChart,
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
    body: [
      "50% para lo Vital: techo, comida rica, transporte y servicios que mantienen el barco a flote.",
      "30% para tus Gustos: salidas, cafecitos, paseos y compras que te alegran el día (¡sí, permitidas y sin culpa!).",
      "20% para tu Yo del Futuro: matar deudas molestas y armar tu colchón de tranquilidad.",
    ],
    principle: "No se trata de privarte de vivir hoy, sino de asegurarte un futuro genial.",
  },
  {
    id: "gamification",
    badge: "Principio 3: Juego y Hábitos",
    title: "¡Prende fuego la racha y sube de nivel!",
    subtitle: "Aprender jugando, ganar puntos y dominar tu bolsillo",
    icon: Flame,
    iconBg: "bg-danger-soft",
    iconColor: "text-danger",
    body: [
      "Olvídate de manuales eternos: aquí tienes lecciones flash interactivas de 2 minutos para aprender trucos reales sobre deudas, intereses y ahorro.",
      "Gana puntos de experiencia (XP), mantén encendido el fueguito de tu racha diaria y desbloquea medallas que demuestran quién manda con la plata.",
    ],
    principle: "2 minutos al día crean el hábito más rentable y divertido de tu vida.",
  },
  {
    id: "team",
    badge: "Principio 4: Finanzas en Equipo",
    title: "En equipo se ahorra mejor (y sin dramas)",
    subtitle: "Pareja, Roommates o Familia en sintonía",
    icon: Users,
    iconBg: "bg-info-soft",
    iconColor: "text-info",
    body: [
      "Arma tu espacio compartido con quien vivas o dividas gastos y dale el nombre que quieras.",
      "Fijen presupuestos en común, repartan cupos y eviten el incómodo '¿te acordás de pasarme lo de la luz?' a fin de mes.",
    ],
    principle: "El trabajo en equipo divide los gastos y multiplica la tranquilidad.",
  },
];

export function TutorialModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  if (!open) return null;

  const step = STEPS[currentStep]!;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const StepIcon = step.icon;

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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[rgb(0_0_0/0.45)] backdrop-blur-xs transition-opacity"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="animate-pop relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sheet"
      >
        {/* Header bar with indicator and close */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-primary">
            {step.badge}
          </span>
          <button
            onClick={handleSkip}
            aria-label="Cerrar tutorial"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="mt-4 flex gap-1.5">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                idx === currentStep
                  ? "bg-primary"
                  : idx < currentStep
                    ? "bg-primary/40"
                    : "bg-secondary",
              )}
            />
          ))}
        </div>

        {/* Step Illustration & Content */}
        <div className="mt-5 min-h-[260px] space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl",
                step.iconBg,
                step.iconColor,
              )}
            >
              <StepIcon className="size-6" strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="tutorial-title"
                className="font-display text-lg font-bold leading-tight text-foreground"
              >
                {step.title}
              </h2>
              <p className="text-[12px] text-muted-foreground">{step.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-foreground/90">
            {step.body.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="rounded-2xl border border-border/80 bg-secondary/50 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              💡 Principio Clave
            </p>
            <p className="mt-1 text-[13px] font-medium text-foreground">"{step.principle}"</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-2">
          {!isFirst ? (
            <button
              onClick={handlePrev}
              type="button"
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <ArrowLeft className="size-3.5" />
              <span>Anterior</span>
            </button>
          ) : (
            <button
              onClick={handleSkip}
              type="button"
              className="px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Saltar
            </button>
          )}

          <button
            onClick={handleNext}
            type="button"
            className="btn-3d flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all"
          >
            <span>{isLast ? "¡Comenzar ahora!" : "Siguiente"}</span>
            {isLast ? <CheckCircle2 className="size-4" /> : <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

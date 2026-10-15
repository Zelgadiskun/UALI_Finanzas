import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { money } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Lock,
  Plus,
  ShoppingCart,
  Sparkles,
  Wallet,
  Wine,
  Zap,
} from "lucide-react";

export interface BudgetItemView {
  id: string;
  name: string;
  group?: string;
  planned: number;
  spent: number;
  isShared: boolean;
  alertLevel?: "critical_exceeded" | "critical_limit" | "healthy";
  excessAmount?: number;
}

interface BudgetAccordionProps {
  necesidadesBudgets: BudgetItemView[];
  deseosBudgets: BudgetItemView[];
  ahorroBudgets: BudgetItemView[];
  necesidadesSpent: number;
  necesidadesPlanned: number;
  necesidadesPct: number;
  deseosSpent: number;
  deseosPlanned: number;
  deseosPct: number;
  ahorroSpent: number;
  ahorroPlanned: number;
  ahorroPct: number;
  onOpenEmergencyModal?: () => void;
  onOpenNewBudget?: () => void;
  onOpenTransaction?: () => void;
}

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (
    n.includes("transporte") ||
    n.includes("auto") ||
    n.includes("gasolina") ||
    n.includes("uber")
  ) {
    return <Car className="size-3.5" />;
  }
  if (
    n.includes("comida") ||
    n.includes("súper") ||
    n.includes("super") ||
    n.includes("mercado") ||
    n.includes("alimento")
  ) {
    return <ShoppingCart className="size-3.5" />;
  }
  if (
    n.includes("luz") ||
    n.includes("servicio") ||
    n.includes("agua") ||
    n.includes("gas") ||
    n.includes("internet") ||
    n.includes("celular")
  ) {
    return <Zap className="size-3.5" />;
  }
  if (n.includes("ahorro") || n.includes("nido") || n.includes("reserva") || n.includes("fondo")) {
    return <Wallet className="size-3.5" />;
  }
  return <Wine className="size-3.5" />;
}

export function BudgetAccordion({
  necesidadesBudgets,
  deseosBudgets,
  ahorroBudgets,
  necesidadesSpent,
  necesidadesPlanned,
  necesidadesPct,
  deseosSpent,
  deseosPlanned,
  deseosPct,
  ahorroSpent,
  ahorroPlanned,
  ahorroPct,
  onOpenEmergencyModal,
  onOpenNewBudget,
  onOpenTransaction,
}: BudgetAccordionProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={["necesidades", "deseos", "ahorro"]}
      className="space-y-2.5"
    >
      {/* 1. NECESIDADES (50%) */}
      <AccordionItem
        value="necesidades"
        className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-card border-b-0"
      >
        <AccordionTrigger className="w-full p-3 hover:bg-secondary/40 hover:no-underline transition active:scale-[0.99] [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="size-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShoppingCart className="size-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Necesidades (50%)
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {necesidadesBudgets.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium block truncate">
                Gastos esenciales y fijos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-1 text-right">
            <div>
              <span className="text-xs font-black text-foreground font-sans block">
                {money(necesidadesSpent)}{" "}
                <span className="text-[10px] text-muted-foreground font-normal">
                  / {money(necesidadesPlanned)}
                </span>
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold block",
                  necesidadesPct >= 100
                    ? "text-red-400"
                    : necesidadesPct >= 90
                      ? "text-amber-400"
                      : "text-blue-400",
                )}
              >
                {necesidadesPlanned > 0 ? `${necesidadesPct}% usado` : "0% usado"}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-2.5 pb-2.5 space-y-1.5">
          {necesidadesBudgets.length === 0 ? (
            <div className="p-3 text-center rounded-xl bg-secondary/30 border border-dashed border-border/70">
              <p className="text-[11px] text-muted-foreground font-medium">
                Sin categorías de necesidades asignadas
              </p>
              {onOpenNewBudget && (
                <button
                  type="button"
                  onClick={onOpenNewBudget}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:underline"
                >
                  <Plus className="size-3" />
                  <span>Agregar rubro</span>
                </button>
              )}
            </div>
          ) : (
            necesidadesBudgets.map((b) => {
              const pct = b.planned > 0 ? Math.round((b.spent / b.planned) * 100) : 0;
              const isCriticalExceeded = b.alertLevel === "critical_exceeded" || pct >= 100;
              const isCriticalLimit = b.alertLevel === "critical_limit" || (pct >= 90 && pct < 100);

              return (
                <div
                  key={b.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl h-[44px] px-3 bg-secondary/40 border flex items-center justify-between transition hover:border-border/90 hover:bg-secondary/60",
                    isCriticalExceeded
                      ? "border-red-500/40 bg-red-950/20"
                      : isCriticalLimit
                        ? "border-amber-500/40 bg-amber-950/15"
                        : "border-border/60",
                  )}
                >
                  {/* Mini barra de progreso ultra-delgada */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary/80">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isCriticalExceeded
                          ? "bg-red-500"
                          : isCriticalLimit
                            ? "bg-amber-400"
                            : b.isShared
                              ? "bg-teal-400"
                              : "bg-blue-400",
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  {/* Izquierda: Icono plano, Nombre, Candado si es privado */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                        isCriticalExceeded
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : isCriticalLimit
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : b.isShared
                              ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                              : "bg-blue-500/15 border-blue-500/30 text-blue-400",
                      )}
                    >
                      {getCategoryIcon(b.name)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{b.name}</span>
                      {!b.isShared && (
                        <span title="Solo mío (Privado)">
                          <Lock className="size-3 text-blue-400 shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Derecha: Montos y porcentaje limpio */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-xs font-black font-sans",
                        isCriticalExceeded
                          ? "text-red-400"
                          : isCriticalLimit
                            ? "text-amber-300"
                            : "text-foreground",
                      )}
                    >
                      {money(b.spent)}{" "}
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        / {money(b.planned)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCriticalExceeded && onOpenEmergencyModal) {
                          onOpenEmergencyModal();
                        } else if (onOpenTransaction) {
                          onOpenTransaction();
                        }
                      }}
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded transition active:scale-95",
                        isCriticalExceeded
                          ? "bg-red-500/25 text-red-400 border border-red-500/30 animate-pulse"
                          : isCriticalLimit
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-secondary text-muted-foreground border border-border/50",
                      )}
                      title={
                        isCriticalExceeded
                          ? "Sobregirado — Toca para compensar con Nido"
                          : "Toca para registrar gasto"
                      }
                    >
                      {b.planned > 0 ? `${pct}%` : "0%"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 2. DESEOS (30%) */}
      <AccordionItem
        value="deseos"
        className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-card border-b-0"
      >
        <AccordionTrigger className="w-full p-3 hover:bg-secondary/40 hover:no-underline transition active:scale-[0.99] [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="size-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Wine className="size-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Deseos (30%)
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {deseosBudgets.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium block truncate">
                Discrecional, ocio y salidas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-1 text-right">
            <div>
              <span className="text-xs font-black text-foreground font-sans block">
                {money(deseosSpent)}{" "}
                <span className="text-[10px] text-muted-foreground font-normal">
                  / {money(deseosPlanned)}
                </span>
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold block",
                  deseosPct >= 100
                    ? "text-red-400"
                    : deseosPct >= 90
                      ? "text-amber-400"
                      : "text-purple-400",
                )}
              >
                {deseosPlanned > 0 ? `${deseosPct}% usado` : "0% usado"}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-2.5 pb-2.5 space-y-1.5">
          {deseosBudgets.length === 0 ? (
            <div className="p-3 text-center rounded-xl bg-secondary/30 border border-dashed border-border/70">
              <p className="text-[11px] text-muted-foreground font-medium">
                Sin categorías de deseos asignadas
              </p>
              {onOpenNewBudget && (
                <button
                  type="button"
                  onClick={onOpenNewBudget}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:underline"
                >
                  <Plus className="size-3" />
                  <span>Agregar rubro</span>
                </button>
              )}
            </div>
          ) : (
            deseosBudgets.map((b) => {
              const pct = b.planned > 0 ? Math.round((b.spent / b.planned) * 100) : 0;
              const isCriticalExceeded = b.alertLevel === "critical_exceeded" || pct >= 100;
              const isCriticalLimit = b.alertLevel === "critical_limit" || (pct >= 90 && pct < 100);

              return (
                <div
                  key={b.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl h-[44px] px-3 bg-secondary/40 border flex items-center justify-between transition hover:border-border/90 hover:bg-secondary/60",
                    isCriticalExceeded
                      ? "border-red-500/40 bg-red-950/20"
                      : isCriticalLimit
                        ? "border-amber-500/40 bg-amber-950/15"
                        : "border-border/60",
                  )}
                >
                  {/* Mini barra de progreso ultra-delgada */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary/80">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isCriticalExceeded
                          ? "bg-red-500"
                          : isCriticalLimit
                            ? "bg-amber-400"
                            : b.isShared
                              ? "bg-teal-400"
                              : "bg-purple-400",
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  {/* Izquierda: Icono plano, Nombre, Candado si es privado */}
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={cn(
                        "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                        isCriticalExceeded
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : isCriticalLimit
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : b.isShared
                              ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                              : "bg-purple-500/15 border-purple-500/30 text-purple-300",
                      )}
                    >
                      {getCategoryIcon(b.name)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{b.name}</span>
                      {!b.isShared && (
                        <span title="Solo mío (Privado)">
                          <Lock className="size-3 text-purple-400 shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Derecha: Montos y porcentaje */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-xs font-black font-sans",
                        isCriticalExceeded
                          ? "text-red-400"
                          : isCriticalLimit
                            ? "text-amber-300"
                            : "text-foreground",
                      )}
                    >
                      {money(b.spent)}{" "}
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        / {money(b.planned)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isCriticalExceeded && onOpenEmergencyModal) {
                          onOpenEmergencyModal();
                        } else if (onOpenTransaction) {
                          onOpenTransaction();
                        }
                      }}
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded transition active:scale-95",
                        isCriticalExceeded
                          ? "bg-red-500/25 text-red-400 border border-red-500/30 animate-pulse"
                          : isCriticalLimit
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-secondary text-muted-foreground border border-border/50",
                      )}
                      title={
                        isCriticalExceeded
                          ? "Sobregirado — Toca para compensar con Nido"
                          : "Toca para registrar gasto"
                      }
                    >
                      {b.planned > 0 ? `${pct}%` : "0%"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </AccordionContent>
      </AccordionItem>

      {/* 3. AHORRO NIDO (20%) */}
      <AccordionItem
        value="ahorro"
        className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-card border-b-0"
      >
        <AccordionTrigger className="w-full p-3 hover:bg-secondary/40 hover:no-underline transition active:scale-[0.99] [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="size-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Wallet className="size-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  Ahorro Nido (20%)
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  {ahorroBudgets.length}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium block truncate">
                Fondo protegido y metas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-1 text-right">
            <div>
              <span className="text-xs font-black text-foreground font-sans block">
                {money(ahorroSpent)}{" "}
                <span className="text-[10px] text-muted-foreground font-normal">
                  / {money(ahorroPlanned)}
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold block">
                {ahorroPlanned > 0 ? `${ahorroPct}% aportado` : "0% aportado"}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="p-2.5 pb-2.5 space-y-1.5">
          {ahorroBudgets.length > 0 ? (
            ahorroBudgets.map((b) => {
              const pct = b.planned > 0 ? Math.round((b.spent / b.planned) * 100) : 0;
              return (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-xl h-[44px] px-3 bg-secondary/40 border border-border/60 flex items-center justify-between transition hover:border-border/90 hover:bg-secondary/60"
                >
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary/80">
                    <div
                      className="h-full bg-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div className="size-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                      <Wallet className="size-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{b.name}</span>
                      {!b.isShared && (
                        <span title="Solo mío (Privado)">
                          <Lock className="size-3 text-teal-400 shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black font-sans text-teal-400">
                      {money(b.spent)}{" "}
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        / {money(b.planned)}
                      </span>
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border/50">
                      {b.planned > 0 ? `${pct}%` : "0%"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="relative overflow-hidden rounded-xl h-[44px] px-3 bg-secondary/40 border border-teal-500/30 flex items-center justify-between transition hover:border-teal-500/50 hover:bg-secondary/60">
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary/80">
                <div
                  className="h-full bg-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, ahorroPct)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="size-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Wallet className="size-3.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">
                    Fondo de Reserva Nido
                  </span>
                  <span className="text-[10px] text-teal-400 font-extrabold px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20">
                    Blindado
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black font-sans text-teal-400">
                  {money(ahorroSpent)}{" "}
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    / {money(ahorroPlanned)}
                  </span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {ahorroPlanned > 0 ? `${ahorroPct}%` : "0%"}
                </span>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

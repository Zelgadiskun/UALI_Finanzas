import React from "react";
import {
  ExternalLink,
  Fuel,
  MapPin,
  PlusCircle,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import type { LocationRadarResult } from "@/server/locationRadar";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";

interface LocationAlertBannerProps {
  place: LocationRadarResult;
  onDismiss: () => void;
  onQuickRegister: (category: string, note: string) => void;
}

export function LocationAlertBanner({
  place,
  onDismiss,
  onQuickRegister,
}: LocationAlertBannerProps) {
  const isSupermarket = place.category === "supermercado";
  const isGas = place.category === "gasolinera";

  return (
    <aside
      aria-label="Aviso de comercio cercano"
      className="mb-3.5 relative overflow-hidden rounded-2xl bg-linear-to-r from-[#141F36] to-[#1B294B] border-2 border-teal-500/40 p-3.5 shadow-xl animate-in slide-in-from-top-3 duration-300"
    >
      <div className="absolute -right-8 -top-8 size-28 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 size-20 bg-amber-400/10 rounded-full blur-lg pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2.5">
        {/* Encabezado del aviso */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              {isGas ? (
                <Fuel className="size-4" />
              ) : isSupermarket ? (
                <ShoppingCart className="size-4" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/15 px-2 py-0.5 rounded-full border border-teal-500/30 flex items-center gap-1">
                  <MapPin className="size-2.5" />
                  Radar GPS & Maps
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {place.suggestedBudgetCategory}
                </span>
              </div>
              <h2 className="text-xs font-black text-foreground truncate mt-0.5">
                {place.placeName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar aviso"
            className="size-7 rounded-full bg-secondary/80 border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Mensaje sutil y sugerencia de personaje */}
        <div className="bg-secondary/40 rounded-xl p-2.5 border border-border/60 flex items-center gap-2.5">
          <div className="size-8 shrink-0">
            {place.character === "toto" ? (
              <TotoCharacter className="size-full" />
            ) : place.character === "nido" ? (
              <NidoCharacter className="size-full" />
            ) : (
              <ChispaCharacter className="size-full" />
            )}
          </div>
          <p className="text-[11px] text-foreground/90 font-medium leading-tight">
            {place.nudgeMessage}
          </p>
        </div>

        {/* Links obligatorios de Google Maps Grounding */}
        {place.groundingLinks && place.groundingLinks.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-[10.5px]">
            {place.groundingLinks.slice(0, 2).map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-bold hover:underline shrink-0 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20"
              >
                <ExternalLink className="size-2.5" />
                <span className="truncate max-w-[190px]">{link.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Acciones principales */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() =>
              onQuickRegister(place.suggestedBudgetCategory, `Compra en ${place.placeName}`)
            }
            className="flex-1 py-2 px-3 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="size-3.5 stroke-[2.5]" />
            <span>Registrar gasto aquí</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-bold text-xs active:scale-98 transition"
          >
            Ahora no
          </button>
        </div>
      </div>
    </aside>
  );
}

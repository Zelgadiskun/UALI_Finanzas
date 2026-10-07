import React, { useState } from "react";
import {
  Bell,
  BellOff,
  CheckCheck,
  Compass,
  ExternalLink,
  Flame,
  Fuel,
  MapPin,
  PlusCircle,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNotificationCenter, type SmartNotification } from "@/lib/ffos/notificationsStore";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { cn } from "@/lib/utils";

interface NotificationCenterModalProps {
  open: boolean;
  onClose: () => void;
  onOpenTransactionWithCategory?: (category: string, note: string) => void;
}

export function NotificationCenterModal({
  open,
  onClose,
  onOpenTransactionWithCategory,
}: NotificationCenterModalProps) {
  const {
    settings,
    updateSettings,
    notifications,
    unreadCount,
    scanningLocation,
    triggerLocationScan,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationCenter();

  const [activeFilter, setActiveFilter] = useState<"all" | "goals" | "location">("all");

  if (!open) return null;

  async function requestBrowserPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        toast.success("¡Notificaciones de navegador activadas!");
        return true;
      } else {
        toast.info("Notificaciones bloqueadas por el navegador o dispositivo.");
        return false;
      }
    }
    return false;
  }

  async function sendTestNotification() {
    const granted = await requestBrowserPermission();
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      (Notification.permission === "granted" || granted)
    ) {
      try {
        new Notification("🔥 Racha Protegida — UALÍ Finanzas", {
          body: "¡Excelente! Has registrado tus gastos y tu racha de ahorro sigue activa.",
          icon: "/icon-192.png",
        });
        toast.success("Notificación de prueba enviada al dispositivo.");
      } catch {
        toast.info("Aviso enviado a tu bandeja de notificaciones en la app.");
      }
    }
  }

  async function handleScan(simulated?: string) {
    toast.loading(
      simulated ? `Simulando entrada a ${simulated}…` : "Consultando comercios en Google Maps…",
      {
        id: "scan-toast",
      },
    );
    const res = await triggerLocationScan(simulated);
    toast.dismiss("scan-toast");
    if (res) {
      toast.success(`📍 Detectado: ${res.placeName}`);
    } else {
      toast.info("Avisos de ubicación desactivados en ajustes.");
    }
  }

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === "goals")
      return n.type === "goal" || n.type === "budget" || n.type === "streak";
    if (activeFilter === "location") return n.type === "location";
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-center-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-t-[32px] sm:rounded-3xl bg-card border border-border/80 shadow-2xl p-5 overflow-hidden max-h-[90vh] flex flex-col justify-between">
        {/* Handle superior móvil */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto -mt-1 mb-3 sm:hidden" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="size-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Bell className="size-4.5" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-danger text-[9.5px] font-black text-danger-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 id="notif-center-title" className="text-base font-black text-foreground">
                Alertas & Objetivos
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Radar de comercios y metas financieras
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-[11px] font-bold text-teal-400 hover:underline px-1.5 py-1 flex items-center gap-1"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="size-3.5" />
                <span>Leídas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto py-3 space-y-4 pr-0.5">
          {/* 1. SECCIÓN DE AJUSTES: ACTIVAR / DESACTIVAR NOTIFICACIONES */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-foreground block">
                  Notificaciones Inteligentes
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Avisos sutiles para no olvidar registrar gastos
                </span>
              </div>
              <Switch
                checked={settings.masterEnabled}
                onCheckedChange={(checked) => {
                  updateSettings({ masterEnabled: checked });
                  if (checked) requestBrowserPermission();
                  toast.success(
                    checked ? "Notificaciones activadas" : "Notificaciones desactivadas",
                  );
                }}
              />
            </div>

            {settings.masterEnabled && (
              <div className="pt-2 border-t border-border/60 space-y-2.5 text-xs">
                {/* Radar de ubicación */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-teal-400" />
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">
                        Radar de Comercios (GPS)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Pregunta con Maps al entrar a supermercados o tiendas
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.locationRadarEnabled}
                    onCheckedChange={(checked) => updateSettings({ locationRadarEnabled: checked })}
                  />
                </div>

                {/* Alertas de Objetivos y Metas */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="size-3.5 text-amber-400" />
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">
                        Metas y Presupuestos (Regla 80%)
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Avisos de avance de ahorro Nido y límites
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={settings.goalsAlertsEnabled}
                    onCheckedChange={(checked) => updateSettings({ goalsAlertsEnabled: checked })}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={sendTestNotification}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 font-bold text-[11px] hover:bg-teal-500/25 active:scale-95 transition"
                  >
                    <Bell className="size-3" />
                    <span>Probar Notificación en el Celular</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. PROBAR RADAR GPS DE COMERCIOS CERCANOS */}
          {settings.masterEnabled && settings.locationRadarEnabled && (
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Compass className="size-3.5" />
                  Escanear Comercios con Google Maps
                </span>
                <span className="text-[9.5px] font-bold text-teal-400 bg-teal-500/20 px-1.5 py-0.5 rounded">
                  GPS Activo
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Usa tu ubicación real o prueba una simulación para ver la alerta sutil de registro:
              </p>

              <button
                type="button"
                disabled={scanningLocation}
                onClick={() => handleScan()}
                className="w-full py-2 px-3 rounded-xl bg-[#2EC4B6] hover:bg-[#20A39E] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-teal-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <MapPin className="size-3.5 stroke-[2.5]" />
                <span>
                  {scanningLocation ? "Buscando comercios…" : "Escanear mi ubicación real actual"}
                </span>
              </button>

              {/* Botones de simulación rápida */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleScan("supermercado")}
                  className="p-1.5 rounded-lg bg-card border border-border/80 text-[10px] font-bold text-foreground hover:border-teal-400 text-center transition"
                >
                  <ShoppingCart className="size-3 mx-auto text-teal-400 mb-0.5" />
                  <span>Súper</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScan("gasolinera")}
                  className="p-1.5 rounded-lg bg-card border border-border/80 text-[10px] font-bold text-foreground hover:border-teal-400 text-center transition"
                >
                  <Fuel className="size-3 mx-auto text-amber-400 mb-0.5" />
                  <span>Gasolina</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScan("tienda")}
                  className="p-1.5 rounded-lg bg-card border border-border/80 text-[10px] font-bold text-foreground hover:border-teal-400 text-center transition"
                >
                  <ShoppingBag className="size-3 mx-auto text-emerald-400 mb-0.5" />
                  <span>Tienda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScan("farmacia")}
                  className="p-1.5 rounded-lg bg-card border border-border/80 text-[10px] font-bold text-foreground hover:border-teal-400 text-center transition"
                >
                  <Sparkles className="size-3 mx-auto text-blue-400 mb-0.5" />
                  <span>Farmacia</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. FILTROS Y FEED DE NOTIFICACIONES */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Notificaciones Relevantes ({filteredNotifs.length})
              </span>

              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-md transition",
                    activeFilter === "all"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground",
                  )}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("goals")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-md transition",
                    activeFilter === "goals"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground",
                  )}
                >
                  Metas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("location")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-md transition",
                    activeFilter === "location"
                      ? "bg-card text-foreground shadow-xs font-extrabold"
                      : "text-muted-foreground",
                  )}
                >
                  GPS
                </button>
              </div>
            </div>

            {filteredNotifs.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-secondary/30 border border-border/60 text-muted-foreground text-xs">
                <BellOff className="size-6 mx-auto mb-2 opacity-50" />
                <p className="font-bold">No hay notificaciones pendientes</p>
                <p className="text-[11px] mt-0.5">Tus objetivos financieros están en orden.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={cn(
                      "p-3 rounded-2xl border transition relative cursor-pointer",
                      n.read
                        ? "bg-card/70 border-border/60 opacity-80"
                        : "bg-card border-teal-500/30 shadow-xs",
                    )}
                  >
                    {!n.read && (
                      <span className="absolute top-3 right-3 size-2 rounded-full bg-teal-400" />
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="size-8 rounded-xl bg-secondary border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                        {n.iconType === "nido" ? (
                          <NidoCharacter className="size-6" />
                        ) : n.iconType === "flame" ? (
                          <Flame className="size-4 text-amber-400 fill-amber-400" />
                        ) : n.iconType === "gas" ? (
                          <Fuel className="size-4 text-teal-400" />
                        ) : n.iconType === "store" ? (
                          <ShoppingCart className="size-4 text-teal-400" />
                        ) : n.iconType === "budget" ? (
                          <ShieldAlert className="size-4 text-amber-400" />
                        ) : (
                          <Bell className="size-4 text-teal-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-extrabold text-foreground truncate">
                            {n.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {n.body}
                        </p>

                        {/* Links de Google Maps Grounding si aplica */}
                        {n.groundingLinks && n.groundingLinks.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {n.groundingLinks.map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 hover:underline"
                              >
                                <ExternalLink className="size-2.5" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Botón de acción rápida */}
                        {n.actionPayload && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationAsRead(n.id);
                              if (onOpenTransactionWithCategory) {
                                onOpenTransactionWithCategory(
                                  n.actionPayload.category,
                                  n.actionPayload.note,
                                );
                                onClose();
                              }
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-teal-400 hover:text-teal-300 bg-teal-500/15 px-2.5 py-1 rounded-lg border border-teal-500/30 active:scale-95 transition"
                          >
                            <PlusCircle className="size-3" />
                            <span>Registrar gasto sugerido</span>
                          </button>
                        )}

                        <span className="text-[9.5px] text-muted-foreground block mt-1">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import type { LocationRadarResult, GroundingLink } from "@/server/locationRadar";

export interface SmartNotification {
  id: string;
  type: "location" | "goal" | "budget" | "streak" | "shared" | "system";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  iconType: "store" | "gas" | "nido" | "budget" | "flame" | "bell" | "chispa" | "toto";
  character?: "toto" | "nido" | "chispa";
  groundingLinks?: GroundingLink[];
  actionPayload?: {
    type: "new_transaction";
    category: string;
    note: string;
  };
}

export interface NotificationSettings {
  masterEnabled: boolean;
  locationRadarEnabled: boolean;
  goalsAlertsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  streakAlertsEnabled: boolean;
}

const SETTINGS_KEY = "uali_notification_settings";
const NOTIFICATIONS_KEY = "uali_smart_notifications";
const EVENT_NAME = "uali_notifications_changed";

const DEFAULT_SETTINGS: NotificationSettings = {
  masterEnabled: true,
  locationRadarEnabled: true,
  goalsAlertsEnabled: true,
  budgetAlertsEnabled: true,
  streakAlertsEnabled: true,
};

const MAX_STRING_LENGTH = 90;

function clamp90(text: string): string {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= MAX_STRING_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_STRING_LENGTH - 1) + "…";
}

const INITIAL_NOTIFICATIONS: SmartNotification[] = [
  {
    id: "notif-goal-nido-1",
    type: "goal",
    title: "🐷 NIDO: Meta Fondo al 25%",
    body: "Tu colchón tiene $150 de $600. Un aporte de $20 te acerca a tu siguiente insignia.",
    timestamp: "Hace 15 min",
    read: false,
    priority: "high",
    iconType: "nido",
    character: "nido",
  },
  {
    id: "notif-budget-alert-1",
    type: "budget",
    title: "⚡ TOTO: Presupuesto al 82%",
    body: "Gastaste $82 de $100 en Ocio. Cuida tu margen operativo para el cierre de mes.",
    timestamp: "Hace 2 horas",
    read: false,
    priority: "high",
    iconType: "toto",
    character: "toto",
  },
  {
    id: "notif-streak-1",
    type: "streak",
    title: "📐 CHISPA: Racha de Clan 🔥",
    body: "¡Llevas 4 días registrando! Chequea los gastos de hoy antes de medianoche.",
    timestamp: "Hace 4 horas",
    read: false,
    priority: "medium",
    iconType: "chispa",
    character: "chispa",
  },
  {
    id: "notif-flow-1",
    type: "system",
    title: "🪙 TOTO: Flujo Continuo Activo 🌊",
    body: "Remanente previo (+ $680.00) disponible en tu balance. Tu dinero nunca va a cero.",
    timestamp: "Ayer",
    read: true,
    priority: "low",
    iconType: "toto",
    character: "toto",
  },
];

export function getStoredSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: NotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getStoredNotifications(): SmartNotification[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(list: SmartNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function addSmartNotification(notif: Omit<SmartNotification, "id" | "timestamp" | "read">) {
  const current = getStoredNotifications();
  const newNotif: SmartNotification = {
    ...notif,
    title: clamp90(notif.title),
    body: clamp90(notif.body),
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: "Hace un momento",
    read: false,
  };
  saveStoredNotifications([newNotif, ...current]);
  return newNotif;
}

export function markNotificationAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead() {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveStoredNotifications(updated);
}

export function useNotificationCenter() {
  const [settings, setSettings] = useState<NotificationSettings>(getStoredSettings);
  const [notifications, setNotifications] = useState<SmartNotification[]>(getStoredNotifications);
  const [detectedPlace, setDetectedPlace] = useState<LocationRadarResult | null>(null);
  const [scanningLocation, setScanningLocation] = useState(false);

  useEffect(() => {
    function refresh() {
      setSettings(getStoredSettings());
      setNotifications(getStoredNotifications());
    }
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function triggerLocationScan(simulatedType?: string) {
    if (!settings.masterEnabled || !settings.locationRadarEnabled) {
      return null;
    }

    setScanningLocation(true);
    try {
      let lat = 8.9824;
      let lng = -79.5199;

      if (!simulatedType && typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 6000,
              enableHighAccuracy: true,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // If user denies or GPS times out, fallback to default coordinates
        }
      }

      const res = await fetch("/api/location-radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          simulatePlace: simulatedType,
        }),
      });

      if (!res.ok) throw new Error("Location radar failed");
      const result: LocationRadarResult = await res.json();
      setDetectedPlace(result);

      // Add to notifications feed
      addSmartNotification({
        type: "location",
        title: `📍 Cerca de: ${result.placeName}`,
        body: result.nudgeMessage,
        priority: "high",
        iconType:
          result.category === "gasolinera"
            ? "gas"
            : result.category === "supermercado"
              ? "store"
              : "store",
        character: result.character,
        groundingLinks: result.groundingLinks,
        actionPayload: {
          type: "new_transaction",
          category: result.suggestedBudgetCategory,
          note: `Compra en ${result.placeName}`,
        },
      });

      // Browser Notification if granted
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(`📍 ${result.placeName} — UALÍ Finanzas`, {
            body: result.nudgeMessage,
            icon: "/icon-192.png",
          });
        } catch {
          // Ignore
        }
      }

      return result;
    } catch (err) {
      console.warn("Location scan warning:", err);
      return null;
    } finally {
      setScanningLocation(false);
    }
  }

  function dismissDetectedPlace() {
    setDetectedPlace(null);
  }

  function updateSettings(patch: Partial<NotificationSettings>) {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveStoredSettings(updated);
  }

  return {
    settings,
    updateSettings,
    notifications,
    unreadCount,
    detectedPlace,
    scanningLocation,
    triggerLocationScan,
    dismissDetectedPlace,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}

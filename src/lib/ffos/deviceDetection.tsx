import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type LayoutMode = "auto" | "mobile" | "tablet" | "desktop";

interface DeviceLayoutContextValue {
  deviceType: DeviceType;
  detectedType: DeviceType;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  browserName: string;
}

const STORAGE_KEY = "uali_device_layout_mode";

export function detectDevice(): { type: DeviceType; isTouch: boolean; browser: string } {
  if (typeof window === "undefined") {
    return { type: "mobile", isTouch: false, browser: "Server" };
  }

  const ua = navigator.userAgent || "";
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;

  // Detectar navegador Brave o Chromium / Safari
  let browser = "Navegador";
  if ((navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave) {
    browser = "Brave";
  } else if (/Brave/i.test(ua)) {
    browser = "Brave";
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = "Firefox";
  }

  // Detectar iPad (incluye iPadOS moderno que reporta Macintosh con touch points)
  const isIPad =
    /iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Detectar tablets Android u otros tablets táctiles
  const isAndroidTablet = /Android/i.test(ua) && !/Mobile/i.test(ua);
  const isTabletUA = isIPad || isAndroidTablet || /Tablet|PlayBook|Silk|Kindle/i.test(ua);

  // Medidas de la pantalla física (inmunes a la opción "Sitio de escritorio" de Brave)
  const screenW = Math.min(window.screen.width, window.screen.height);
  const screenH = Math.max(window.screen.width, window.screen.height);
  const windowW = window.innerWidth;

  // 1. Pantalla física de teléfono (ancho menor a 600px en vertical): SIEMPRE Móvil
  // Esto protege a teléfonos abriendo Brave con "Sitio para computadoras" activo
  if (screenW < 600) {
    return { type: "mobile", isTouch, browser };
  }

  // 2. Dispositivo Tablet táctil (iPad, Galaxy Tab, tablet Android o pantalla táctil de 600-1100px)
  if (isTabletUA || (isTouch && screenW >= 600 && screenW <= 1100)) {
    // Si la ventana visible es muy estrecha (pantalla dividida o móvil vertical)
    if (windowW < 768) {
      return { type: "mobile", isTouch, browser };
    }
    return { type: "tablet", isTouch, browser };
  }

  // 3. Resolución de ventana estrecha (< 768px): modo móvil
  if (windowW < 768) {
    return { type: "mobile", isTouch, browser };
  }

  // 4. Resolución de ventana entre 768px y 1024px o táctil < 1200px: modo tablet
  if (windowW < 1024 || (isTouch && windowW <= 1280)) {
    return { type: "tablet", isTouch, browser };
  }

  // 5. Monitor de escritorio / laptop amplio con cursor fino
  return { type: "desktop", isTouch, browser };
}

const DeviceLayoutContext = createContext<DeviceLayoutContextValue | null>(null);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    if (typeof window === "undefined") return "auto";
    const stored = localStorage.getItem(STORAGE_KEY) as LayoutMode;
    return stored === "mobile" || stored === "tablet" || stored === "desktop" ? stored : "auto";
  });

  const [deviceInfo, setDeviceInfo] = useState(() => detectDevice());

  useEffect(() => {
    function handleUpdate() {
      setDeviceInfo(detectDevice());
    }

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("orientationchange", handleUpdate);

    // Detección asíncrona de Brave si está disponible
    if ((navigator as unknown as { brave?: { isBrave?: () => Promise<boolean> } }).brave?.isBrave) {
      (navigator as unknown as { brave: { isBrave: () => Promise<boolean> } }).brave
        .isBrave()
        .then((isBrave) => {
          if (isBrave) {
            setDeviceInfo((prev) => ({ ...prev, browser: "Brave" }));
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("orientationchange", handleUpdate);
    };
  }, []);

  function setLayoutMode(mode: LayoutMode) {
    setLayoutModeState(mode);
    if (typeof window !== "undefined") {
      if (mode === "auto") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    }
  }

  const effectiveType: DeviceType = useMemo(() => {
    if (layoutMode !== "auto") return layoutMode;
    return deviceInfo.type;
  }, [layoutMode, deviceInfo.type]);

  const value: DeviceLayoutContextValue = useMemo(
    () => ({
      deviceType: effectiveType,
      detectedType: deviceInfo.type,
      layoutMode,
      setLayoutMode,
      isMobile: effectiveType === "mobile",
      isTablet: effectiveType === "tablet",
      isDesktop: effectiveType === "desktop",
      isTouch: deviceInfo.isTouch,
      browserName: deviceInfo.browser,
    }),
    [effectiveType, deviceInfo, layoutMode],
  );

  return <DeviceLayoutContext.Provider value={value}>{children}</DeviceLayoutContext.Provider>;
}

export function useDeviceLayout(): DeviceLayoutContextValue {
  const context = useContext(DeviceLayoutContext);
  if (!context) {
    // Retorno seguro si se llama fuera de Provider
    const detected = detectDevice();
    return {
      deviceType: detected.type,
      detectedType: detected.type,
      layoutMode: "auto",
      setLayoutMode: () => {},
      isMobile: detected.type === "mobile",
      isTablet: detected.type === "tablet",
      isDesktop: detected.type === "desktop",
      isTouch: detected.isTouch,
      browserName: detected.browser,
    };
  }
  return context;
}

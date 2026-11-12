import React, { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  PieChart,
  ArrowLeftRight,
  Compass,
  CreditCard,
  LayoutGrid,
  Plus,
  PiggyBank,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { openGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { useBudgetsQuery, useTransactionsQuery, useProfileQuery } from "@/lib/supabase/queries";
import { sameMonth } from "@/lib/ffos/format";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useDeviceLayout } from "@/lib/ffos/deviceDetection";
import { setNavDrawerListener } from "@/lib/ffos/navDrawerStore";
import { UserAvatarDisplay } from "./UserAvatarDisplay";
import { DailyStreakBadge } from "./DailyStreakBadge";
import { UaliBrandLogo } from "./characters/Characters";
import { cn } from "@/lib/utils";

interface DesktopNavProps {
  onOpenNewTx?: () => void;
  onOpenProfile?: () => void;
}

export function DesktopNav({ onOpenNewTx }: DesktopNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === "dark");

  const { isMobile, isTablet, layoutMode, setLayoutMode, detectedType, browserName } =
    useDeviceLayout();

  const profile = useProfileQuery();
  const budgetsQuery = useBudgetsQuery();
  const txQuery = useTransactionsQuery();

  useEffect(() => {
    setNavDrawerListener(setMenuOpen);
    return () => setNavDrawerListener(null);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [menuOpen]);

  function handleToggleTheme() {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    applyTheme(nextDark ? "dark" : "light");
  }

  const hasBudgetAlert = React.useMemo(() => {
    const budgets = budgetsQuery.data ?? [];
    const transactions = txQuery.data ?? [];
    if (budgets.length === 0) return false;

    const spentByCategory = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "gasto" || !sameMonth(t.date)) continue;
      spentByCategory.set(t.category, (spentByCategory.get(t.category) ?? 0) + t.amount);
    }

    return budgets.some((b) => {
      const spent = spentByCategory.get(b.name) ?? 0;
      return b.planned > 0 && spent > b.planned;
    });
  }, [budgetsQuery.data, txQuery.data]);

  const NAV_ITEMS = [
    {
      id: "inicio",
      label: "Inicio",
      description: "Flujo personal, familiar y de equipo",
      to: "/",
      icon: Home,
    },
    {
      id: "presupuesto",
      label: "Plan y Presupuesto",
      description: "Asignación consciente y topes por rubro",
      to: "/presupuesto",
      icon: PieChart,
      badge: hasBudgetAlert,
    },
    {
      id: "aprender",
      label: "Simulador de Casos",
      description: "Laboratorio práctico con Toto, Nido y Chispa",
      to: "/aprender",
      icon: Compass,
    },
    {
      id: "movimientos",
      label: "Movimientos",
      description: "Historial completo y exportación de registros",
      to: "/movimientos",
      icon: ArrowLeftRight,
    },
    {
      id: "ahorro",
      label: "Metas con Nido",
      description: "Fondo de paz y metas de ahorro protegido",
      to: "/ahorro",
      icon: PiggyBank,
    },
    {
      id: "deudas",
      label: "Deudas",
      description: "Simulador de salida bola de nieve y avalancha",
      to: "/deudas",
      icon: CreditCard,
    },
    {
      id: "mas",
      label: "Espacios y Ajustes",
      description: "Gestión familiar, en equipo y preferencias",
      to: "/mas",
      icon: LayoutGrid,
    },
  ];

  function isActive(to: string) {
    if (to === "/") return pathname === "/" || pathname === "/inicio";
    return pathname.startsWith(to);
  }

  const handleNewTx = () => {
    if (onOpenNewTx) {
      onOpenNewTx();
    } else {
      openGlobalTransactionSheet();
    }
  };

  return (
    <>
      {isMobile ? (
        <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border px-3.5 h-13 flex items-center justify-between transition-colors">
          <Link to="/" className="flex items-center gap-2 group outline-hidden">
            <UaliBrandLogo className="size-8" />
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-foreground">
                Ualí
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
                Finanzas
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Alternar tema claro u oscuro"
              className="size-8 rounded-xl border border-border bg-card flex items-center justify-center text-foreground cursor-pointer"
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              <Menu className="size-4 text-primary" />
              <span className="text-[11px] font-bold">Menú</span>
              {hasBudgetAlert && (
                <span className="size-2 rounded-full bg-[#E06D53] ring-1 ring-card" />
              )}
            </button>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-md border-b border-border transition-colors">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group outline-hidden">
              <UaliBrandLogo className="size-10" />
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-lg tracking-tight text-foreground leading-none flex items-center gap-1.5">
                  <span>Ualí</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary tracking-normal">
                    70·20·10
                  </span>
                  {isTablet && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-secondary text-foreground">
                      Tablet
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground leading-tight mt-0.5">
                  Finanzas personales, familiares y de equipo
                </span>
              </div>
            </Link>

            <nav aria-label="Navegación de escritorio" className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menú de navegación"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                <Menu className="size-4 text-primary" />
                <span>Secciones</span>
                {hasBudgetAlert && (
                  <span className="size-2 rounded-full bg-[#E06D53] ring-2 ring-card" />
                )}
              </button>

              <div className="hidden lg:flex items-center gap-1 ml-1 border-l border-border pl-2">
                {NAV_ITEMS.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none",
                        active
                          ? "bg-primary-soft text-primary font-extrabold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="size-2 rounded-full bg-[#E06D53] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-2.5 shrink-0">
              <DailyStreakBadge variant="badge" onOpenNewTx={handleNewTx} />

              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label="Alternar modo claro u oscuro"
                className="size-9 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground cursor-pointer"
                title="Alternar Modo Día (Alabastro) / Noche (Pizarra)"
              >
                {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <button
                type="button"
                onClick={handleNewTx}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-tactile-terra font-extrabold text-xs cursor-pointer"
              >
                <Plus className="size-4 stroke-[2.8]" />
                <span>Registrar</span>
              </button>

              <Link
                to="/mas"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-secondary/60 transition outline-hidden"
                title="Espacios y perfil"
              >
                <div className="size-8 rounded-full overflow-hidden border-2 border-primary bg-card">
                  <UserAvatarDisplay displayName={profile.data?.display_name} />
                </div>
                <span className="text-xs font-bold text-foreground max-w-[100px] truncate hidden xl:inline">
                  {profile.data?.display_name || "Eduardo"}
                </span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-[#131B2A]/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal de navegación"
            className="relative z-50 w-full max-w-sm sm:max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UaliBrandLogo className="size-10" />
                <div>
                  <h2 className="text-base font-extrabold text-foreground tracking-tight">
                    Ualí Finanzas
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Navegación y espacios compartidos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                className="size-9 rounded-xl bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 no-scrollbar">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-2xl transition-all border",
                      active
                        ? "bg-primary-soft border-primary/30 text-foreground"
                        : "bg-card hover:bg-secondary/70 border-border text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "size-9 rounded-xl flex items-center justify-center shrink-0",
                          active
                            ? "bg-primary text-primary-foreground font-extrabold"
                            : "bg-secondary text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-extrabold truncate",
                              active && "text-primary",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#E06D53] text-[#F7F5F0]">
                              Revisar
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border bg-secondary/40 space-y-2.5">
              <div className="p-2.5 rounded-2xl bg-card border border-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-extrabold text-foreground text-[11px]">
                    <Smartphone className="size-3.5 text-primary" />
                    Modo de Pantalla
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {browserName}:{" "}
                    <strong className="text-foreground capitalize">{detectedType}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-secondary rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setLayoutMode("auto")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all text-center text-[10.5px]",
                      layoutMode === "auto"
                        ? "bg-primary text-primary-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("mobile")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-0.5 text-[10.5px]",
                      layoutMode === "mobile"
                        ? "bg-primary text-primary-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Smartphone className="size-2.5" />
                    Móvil
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("tablet")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-0.5 text-[10.5px]",
                      layoutMode === "tablet"
                        ? "bg-primary text-primary-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Tablet className="size-2.5" />
                    Tablet
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("desktop")}
                    className={cn(
                      "py-1 px-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-0.5 text-[10.5px]",
                      layoutMode === "desktop"
                        ? "bg-primary text-primary-foreground font-extrabold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Monitor className="size-2.5" />
                    PC
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  {darkMode ? (
                    <Moon className="size-4 text-primary" />
                  ) : (
                    <Sun className="size-4 text-[#E06D53]" />
                  )}
                  <span>Modo oscuro</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  className="px-3 py-1 rounded-lg bg-secondary text-xs font-extrabold text-foreground border border-border hover:bg-secondary/80 transition"
                >
                  {darkMode ? "Activado" : "Desactivado"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export const AppNav = DesktopNav;
export default DesktopNav;

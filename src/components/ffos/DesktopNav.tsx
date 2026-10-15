import React, { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  PieChart,
  ArrowLeftRight,
  Sparkles,
  CreditCard,
  LayoutGrid,
  Plus,
  PiggyBank,
  Wallet,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
  Bell,
} from "lucide-react";
import { openGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { useBudgetsQuery, useTransactionsQuery, useProfileQuery } from "@/lib/supabase/queries";
import { sameMonth } from "@/lib/ffos/format";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { UserAvatarDisplay } from "./UserAvatarDisplay";
import { cn } from "@/lib/utils";

interface DesktopNavProps {
  onOpenNewTx?: () => void;
  onOpenProfile?: () => void;
}

export function DesktopNav({ onOpenNewTx, onOpenProfile }: DesktopNavProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getStoredTheme() === "dark");

  const profile = useProfileQuery();
  const budgetsQuery = useBudgetsQuery();
  const txQuery = useTransactionsQuery();

  // Cerrar el menú automáticamente al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Bloquear scroll y escuchar tecla Escape al abrir el menú de hamburguesa
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
      description: "Panel general y balance consolidado",
      to: "/",
      icon: Home,
    },
    {
      id: "presupuesto",
      label: "Presupuesto",
      description: "Sobres mensuales y control de gastos",
      to: "/presupuesto",
      icon: PieChart,
      badge: hasBudgetAlert,
    },
    {
      id: "movimientos",
      label: "Movimientos",
      description: "Historial y registro de ingresos y gastos",
      to: "/movimientos",
      icon: ArrowLeftRight,
    },
    {
      id: "aprender",
      label: "Aprender",
      description: "Misiones y lecciones de educación financiera",
      to: "/aprender",
      icon: Sparkles,
    },
    {
      id: "ahorro",
      label: "Metas & Ahorro",
      description: "Caja Nido y metas de corto y mediano plazo",
      to: "/ahorro",
      icon: PiggyBank,
    },
    {
      id: "deudas",
      label: "Deudas",
      description: "Plan de amortización bola de nieve",
      to: "/deudas",
      icon: CreditCard,
    },
    {
      id: "mas",
      label: "Más Ajustes",
      description: "Gestión en pareja, reportes y configuración",
      to: "/mas",
      icon: LayoutGrid,
    },
  ];

  function isActive(to: string) {
    if (to === "/") return pathname === "/";
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
      <header className="hidden md:block sticky top-0 z-40 w-full bg-card/90 dark:bg-[#0B1323]/95 backdrop-blur-md border-b border-border/80 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Marca y Logotipo UALÍ */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group outline-hidden">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#1E968B] via-[#2EC4B6] to-[#4EE2D5] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#2EC4B6]/25 group-hover:scale-105 transition-transform">
              <Wallet className="size-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-tight text-foreground leading-none flex items-center gap-1.5">
                <span>UALÍ</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#2EC4B6]/15 text-[#2EC4B6] tracking-normal">
                  Finanzas
                </span>
              </span>
              <span className="text-[11px] font-bold text-muted-foreground leading-tight mt-0.5">
                Gestión inteligente y en equipo
              </span>
            </div>
          </Link>

          {/* Navegación para Versiones de Pantalla Ancha (Tablet y Web) con Menú de Hamburguesa */}
          <nav aria-label="Navegación de escritorio" className="flex items-center gap-2">
            {/* Botón Principal Menú de Hamburguesa para Tablet y Web */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/90 bg-secondary/70 hover:bg-secondary text-foreground text-xs font-black transition-all active:scale-95 shadow-2xs cursor-pointer group"
            >
              <Menu className="size-4.5 stroke-[2.3] text-[#2EC4B6] group-hover:scale-110 transition-transform" />
              <span>Menú</span>
              {hasBudgetAlert && (
                <span className="size-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-card" />
              )}
            </button>

            {/* Accesos rápidos visibles en pantallas amplias */}
            <div className="hidden lg:flex items-center gap-1 ml-1 border-l border-border/60 pl-2">
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
                        ? "bg-primary/10 text-primary dark:text-[#4EE2D5] font-extrabold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        active ? "scale-110 stroke-[2.3]" : "stroke-[1.8]",
                      )}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0 ring-2 ring-card" />
                    )}
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary dark:bg-[#4EE2D5] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Acciones de Cabecera: Botón Crear Movimiento + Perfil */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleNewTx}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1E968B] via-[#2EC4B6] to-[#4EE2D5] text-slate-950 font-black text-xs shadow-md shadow-[#2EC4B6]/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.8]" />
              <span>Nuevo Movimiento</span>
            </button>

            <Link
              to="/mas"
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-secondary/60 transition outline-hidden group"
              title="Ajustes y perfil"
            >
              <div className="size-8 rounded-full overflow-hidden border-2 border-[#F6BE22] bg-[#141F36] ring-1 ring-[#F6BE22]/20">
                <UserAvatarDisplay displayName={profile.data?.display_name} />
              </div>
              <span className="text-xs font-bold text-foreground max-w-[100px] truncate hidden xl:inline">
                {profile.data?.display_name || "Explorador"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* PANEL LATERAL DESPLEGABLE (DRAWER) DEL MENÚ DE HAMBURGUESA PARA TABLET Y WEB */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Fondo oscuro con desenfoque al hacer clic para cerrar */}
          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer animate-in fade-in duration-200"
          />

          {/* Panel deslizante lateral */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal de navegación"
            className="relative z-50 w-full max-w-sm sm:max-w-md h-full bg-card dark:bg-[#0B1323] border-l border-border/80 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
          >
            {/* Cabecera del Drawer */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#1E968B] via-[#2EC4B6] to-[#4EE2D5] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#2EC4B6]/25">
                  <Wallet className="size-5 text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground tracking-tight flex items-center gap-1.5">
                    <span>UALÍ Finanzas</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#2EC4B6]/15 text-[#2EC4B6]">
                      Menú
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">Panel de navegación rápida</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                className="size-9 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Tarjeta de Usuario en el Menú */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/60">
                <div className="size-10 rounded-full overflow-hidden border-2 border-[#F6BE22] bg-[#141F36] ring-1 ring-[#F6BE22]/20 shrink-0">
                  <UserAvatarDisplay displayName={profile.data?.display_name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-foreground truncate">
                    {profile.data?.display_name || "Explorador Ualí"}
                  </p>
                  <p className="text-[11px] font-semibold text-teal-400 truncate">
                    Sesión iniciada
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewTx}
                  className="px-2.5 py-1.5 rounded-xl bg-[#2EC4B6] text-slate-950 font-black text-[11px] shadow-xs active:scale-95 transition hover:brightness-105 shrink-0"
                >
                  + Movimiento
                </button>
              </div>
            </div>

            {/* Lista Completa de Secciones */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 no-scrollbar">
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
                        ? "bg-primary/10 border-primary/30 text-foreground shadow-2xs dark:border-[#4EE2D5]/30"
                        : "bg-card/50 hover:bg-secondary/70 border-border/50 text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={cn(
                          "size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          active
                            ? "bg-primary text-primary-foreground dark:bg-[#2EC4B6] dark:text-slate-950 font-black"
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
                              active && "text-primary dark:text-[#4EE2D5]",
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                              Alerta
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5",
                        active && "text-primary dark:text-[#4EE2D5]",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Pie del Drawer con Toggle Modo Oscuro y Accesos Rápidos */}
            <div className="p-4 border-t border-border/60 bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-card border border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  {darkMode ? (
                    <Moon className="size-4 text-indigo-400" />
                  ) : (
                    <Sun className="size-4 text-amber-500" />
                  )}
                  <span>Modo oscuro</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  className="px-3 py-1 rounded-lg bg-secondary text-xs font-extrabold text-foreground border border-border hover:bg-secondary/80 active:scale-95 transition"
                >
                  {darkMode ? "Activado" : "Desactivado"}
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 pt-1">
                <span>UALÍ Finanzas PWA</span>
                <span className="font-semibold">Versión 2.0 Web & Tablet</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

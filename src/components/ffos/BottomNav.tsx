import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  ArrowLeftRight,
  Sparkles,
  PieChart,
  CreditCard,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { openGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { useBudgetsQuery, useTransactionsQuery } from "@/lib/supabase/queries";
import { sameMonth } from "@/lib/ffos/format";
import { cn } from "@/lib/utils";

export type NavTabId = "inicio" | "movimientos" | "aprendizaje" | "presupuesto" | "deudas" | "mas";

export interface NavItemConfig {
  id: NavTabId;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
  activeColorClass: string;
  activeGlowClass: string;
  badge?: {
    type: "dot" | "count";
    value?: number;
    colorClass: string;
  };
}

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  // Chequeo reactivo de si hay alerta de sobregiro en presupuesto
  const budgetsQuery = useBudgetsQuery();
  const txQuery = useTransactionsQuery();

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

  const LEFT_ITEMS: NavItemConfig[] = [
    {
      id: "inicio",
      label: "Inicio",
      to: "/",
      icon: Home,
      activeColor: "#2EC4B6",
      activeColorClass: "text-[#2EC4B6]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(46,196,182,0.45)]",
    },
    {
      id: "movimientos",
      label: "Movimientos",
      to: "/movimientos",
      icon: ArrowLeftRight,
      activeColor: "#3B82F6",
      activeColorClass: "text-[#3B82F6]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(59,130,246,0.45)]",
    },
    {
      id: "aprendizaje",
      label: "Aprendizaje",
      to: "/aprender",
      icon: Sparkles,
      activeColor: "#A855F7",
      activeColorClass: "text-[#A855F7]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(168,85,247,0.45)]",
    },
  ];

  const RIGHT_ITEMS: NavItemConfig[] = [
    {
      id: "presupuesto",
      label: "Presupuesto",
      to: "/presupuesto",
      icon: PieChart,
      activeColor: "#F59E0B",
      activeColorClass: "text-[#F59E0B]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(245,158,11,0.45)]",
      badge: hasBudgetAlert ? { type: "dot", colorClass: "bg-rose-500 animate-pulse" } : undefined,
    },
    {
      id: "deudas",
      label: "Deudas",
      to: "/deudas",
      icon: CreditCard,
      activeColor: "#F43F5E",
      activeColorClass: "text-[#F43F5E]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(244,63,94,0.45)]",
    },
    {
      id: "mas",
      label: "Más",
      to: "/mas",
      icon: LayoutGrid,
      activeColor: "#6366F1",
      activeColorClass: "text-[#6366F1]",
      activeGlowClass: "drop-shadow-[0_2px_10px_rgba(99,102,241,0.45)]",
    },
  ];

  function isItemActive(item: NavItemConfig): boolean {
    if (item.to === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(item.to);
  }

  function renderNavItem(item: NavItemConfig) {
    const Icon = item.icon;
    const isActive = isItemActive(item);

    return (
      <Link
        key={item.id}
        to={item.to}
        className="group relative flex flex-1 flex-col items-center justify-center py-1 outline-none transition-transform duration-200 active:scale-90 select-none"
        aria-selected={isActive}
        role="tab"
      >
        {/* Contenedor del ícono con animación al activarse */}
        <div className="relative flex items-center justify-center size-6 mb-0.5">
          <Icon
            className={cn(
              "size-5 transition-all duration-300 ease-out",
              isActive
                ? cn(item.activeColorClass, item.activeGlowClass, "scale-115 -translate-y-0.5")
                : "text-muted-foreground group-hover:text-foreground group-hover:scale-105",
            )}
          />

          {item.badge && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-card dark:ring-[#0B1323]",
                item.badge.colorClass,
              )}
            />
          )}
        </div>

        {/* Etiqueta de texto */}
        <span
          className={cn(
            "text-[9.5px] leading-tight tracking-tight transition-all duration-200 truncate max-w-full px-0.5",
            isActive
              ? cn(item.activeColorClass, "font-black scale-105")
              : "font-medium text-muted-foreground group-hover:text-foreground",
          )}
        >
          {item.label}
        </span>

        {/* Indicador de píldora activa inferior animada */}
        <div
          className={cn(
            "h-0.5 rounded-full mt-1 transition-all duration-300",
            isActive ? "w-3.5 opacity-100 scale-100" : "w-0 opacity-0 scale-50",
            item.activeColorClass,
          )}
          style={{ backgroundColor: isActive ? item.activeColor : "transparent" }}
        />
      </Link>
    );
  }

  return (
    <nav
      aria-label="Navegación principal de la aplicación"
      className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-md mx-auto
                 bg-card/90 dark:bg-[#0B1323]/95 backdrop-blur-xl
                 border-t border-border/40 dark:border-[#1E293B]/80
                 shadow-lg shadow-black/20
                 transition-all duration-200"
    >
      <div className="flex items-center justify-between px-1.5 pt-2 pb-0.5">
        {/* 3 pestañas izquierdas: Inicio, Movimientos, Aprendizaje */}
        <div className="flex flex-1 items-center justify-around">
          {LEFT_ITEMS.map(renderNavItem)}
        </div>

        {/* BOTÓN CENTRAL HERO "+": Nuevo Movimiento (Ubicación central ergonómica) */}
        <div className="-mt-5 flex flex-col items-center px-1 shrink-0">
          <button
            type="button"
            onClick={openGlobalTransactionSheet}
            aria-label="Nuevo movimiento"
            className="group relative flex flex-col items-center outline-none select-none active:scale-90 transition-transform duration-200"
          >
            <div
              className="size-11.5 rounded-full bg-gradient-to-tr from-[#1E968B] via-[#2EC4B6] to-[#4EE2D5]
                         flex items-center justify-center text-slate-950 font-black
                         shadow-lg shadow-[#2EC4B6]/35 border-2 border-background dark:border-[#0B1323]
                         group-hover:scale-105 transition-all duration-200"
            >
              <Plus className="size-6 stroke-[2.6] transition-transform duration-300 group-hover:rotate-90 text-slate-950" />
            </div>
            <span className="text-[9.5px] font-black text-[#2EC4B6] mt-0.5 tracking-tight">
              Nuevo
            </span>
          </button>
        </div>

        {/* 3 pestañas derechas: Presupuesto, Deudas, Más */}
        <div className="flex flex-1 items-center justify-around">
          {RIGHT_ITEMS.map(renderNavItem)}
        </div>
      </div>

      {/* Barra de seguridad iOS / Android (Home Bar Safe Area) */}
      <div className="w-28 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-0.5 mb-1" />
    </nav>
  );
}

export default BottomNav;

import React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, PieChart, Compass, LayoutGrid, Plus } from "lucide-react";
import { openGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { useBudgetsQuery, useTransactionsQuery } from "@/lib/supabase/queries";
import { sameMonth } from "@/lib/ffos/format";
import { useDeviceLayout } from "@/lib/ffos/deviceDetection";
import { cn } from "@/lib/utils";

export type NavTabId = "inicio" | "movimientos" | "aprendizaje" | "presupuesto" | "deudas" | "mas";

export interface NavItemConfig {
  id: NavTabId;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    type: "dot" | "count";
    value?: number;
    colorClass: string;
  };
}

export function BottomNav() {
  const { isMobile } = useDeviceLayout();
  const location = useLocation();
  const pathname = location.pathname;

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
    },
    {
      id: "presupuesto",
      label: "Plan",
      to: "/presupuesto",
      icon: PieChart,
      badge: hasBudgetAlert ? { type: "dot", colorClass: "bg-[#E06D53]" } : undefined,
    },
  ];

  const RIGHT_ITEMS: NavItemConfig[] = [
    {
      id: "aprendizaje",
      label: "Simulador",
      to: "/aprender",
      icon: Compass,
    },
    {
      id: "mas",
      label: "Espacios",
      to: "/mas",
      icon: LayoutGrid,
    },
  ];

  function isItemActive(item: NavItemConfig): boolean {
    if (item.to === "/") {
      return pathname === "/" || pathname === "/inicio";
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
        className="group relative flex flex-1 flex-col items-center justify-center py-1.5 px-1 outline-none transition-transform duration-150 active:scale-95 select-none min-h-[48px]"
        aria-selected={isActive}
        role="tab"
      >
        <div
          className={cn(
            "relative flex items-center justify-center w-9 h-7 rounded-xl mb-0.5 transition-colors",
            isActive ? "bg-primary-soft text-primary" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          <Icon className={cn("size-5 transition-transform", isActive ? "stroke-[2.4]" : "stroke-[1.9]")} />
          {item.badge && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-card",
                item.badge.colorClass,
              )}
            />
          )}
        </div>

        <span
          className={cn(
            "text-[11px] leading-tight tracking-tight transition-colors truncate max-w-full",
            isActive ? "text-primary font-extrabold" : "text-muted-foreground font-semibold",
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  }

  if (!isMobile) return null;

  return (
    <nav
      aria-label="Navegación principal de la aplicación"
      className="fixed bottom-0 left-0 right-0 z-40 w-full max-w-md mx-auto bg-card/95 backdrop-blur-md border-t border-border pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] transition-colors"
    >
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
        <div className="flex flex-1 items-center justify-around">
          {LEFT_ITEMS.map(renderNavItem)}
        </div>

        {/* BOTÓN CENTRAL HERO "+" EN EL 10% DE ACENTO TERRACOTA (#E06D53) */}
        <div className="-mt-5 flex flex-col items-center px-2 shrink-0">
          <button
            type="button"
            onClick={openGlobalTransactionSheet}
            aria-label="Nuevo movimiento"
            className="group relative flex flex-col items-center outline-none select-none cursor-pointer"
          >
            <div className="size-12 rounded-2xl btn-tactile-terra flex items-center justify-center font-black shadow-md">
              <Plus className="size-6 stroke-[2.8] text-[#F7F5F0]" />
            </div>
            <span className="text-[11px] font-extrabold text-[#E06D53] mt-1 tracking-tight">
              Registrar
            </span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-around">
          {RIGHT_ITEMS.map(renderNavItem)}
        </div>
      </div>
    </nav>
  );
}

export default BottomNav;

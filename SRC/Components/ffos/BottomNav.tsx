import { Link } from "@tanstack/react-router";
import { Home, ArrowLeftRight, PieChart, Landmark, LayoutGrid } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/movimientos", label: "Movimientos", icon: ArrowLeftRight, exact: false },
  { to: "/presupuesto", label: "Presupuesto", icon: PieChart, exact: false },
  { to: "/deudas", label: "Deudas", icon: Landmark, exact: false },
  { to: "/mas", label: "Más", icon: LayoutGrid, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card"
    >
      <ul className="flex h-14 items-stretch">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

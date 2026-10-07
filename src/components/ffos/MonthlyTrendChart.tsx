import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { inMonthOffset, monthLabelOffset } from "@/lib/ffos/format";
import type { Transaction } from "@/lib/ffos/types";

// Ingreso/gasto no son identidad arbitraria: son el mismo par semántico que
// ya usan KpiCard y TransactionRow en toda la app (verde = entra, rojo =
// sale), así que reusan --accent/--danger en vez de la paleta categórica.
const config: ChartConfig = {
  ingreso: { label: "Ingresos", color: "var(--accent)" },
  gasto: { label: "Gastos", color: "var(--danger)" },
};

const MONTHS_BACK = 6;

export function MonthlyTrendChart({ transactions }: { transactions: Transaction[] }) {
  const data = Array.from({ length: MONTHS_BACK }, (_, i) => {
    const offset = -(MONTHS_BACK - 1 - i);
    const month = transactions.filter((t) => inMonthOffset(t.date, offset));
    const ingreso = month.filter((t) => t.type === "ingreso").reduce((a, t) => a + t.amount, 0);
    const gasto = month.filter((t) => t.type === "gasto").reduce((a, t) => a + t.amount, 0);
    return { month: monthLabelOffset(offset), ingreso, gasto };
  });

  const hasData = data.some((d) => d.ingreso > 0 || d.gasto > 0);
  if (!hasData) return null;

  return (
    <ChartContainer config={config} className="aspect-auto h-52 w-full">
      <BarChart data={data} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="ingreso" fill="var(--color-ingreso)" radius={4} maxBarSize={16} />
        <Bar dataKey="gasto" fill="var(--color-gasto)" radius={4} maxBarSize={16} />
      </BarChart>
    </ChartContainer>
  );
}

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CATEGORIES } from "@/lib/ffos/types";

// Orden fijo de la paleta categórica (skill de dataviz): la identidad de una
// categoría no puede cambiar de color según qué tan seguido aparece.
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

/** i siempre cae dentro de COLORS: el módulo lo garantiza. */
function colorAt(i: number): string {
  return COLORS[i % COLORS.length]!;
}

const config: ChartConfig = Object.fromEntries(
  CATEGORIES.gasto.map((c, i) => [c, { label: c, color: colorAt(i) }]),
);

export function CategorySpendChart({ spentByCategory }: { spentByCategory: Map<string, number> }) {
  const data = CATEGORIES.gasto
    .map((category, i) => ({
      category,
      amount: spentByCategory.get(category) ?? 0,
      fill: colorAt(i),
    }))
    .filter((d) => d.amount > 0);

  if (data.length === 0) return null;

  return (
    <ChartContainer config={config} className="aspect-auto h-52 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          axisLine={false}
          width={90}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="amount" radius={4} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

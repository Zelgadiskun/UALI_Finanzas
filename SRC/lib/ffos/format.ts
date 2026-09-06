import { format, isSameMonth, isSameYear, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formats a currency amount. Values whose absolute magnitude reaches
 * `compactAbove` render as "$12.3K" instead of the full figure — used in
 * narrow KPI tiles where a five-digit number would overflow the card.
 */
export function money(value: number, compactAbove = Infinity): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= compactAbove) {
    const compact = new Intl.NumberFormat("es-AR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(abs);
    return `${sign}$${compact}`;
  }

  const formatted = abs.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function shortDate(iso: string): string {
  return format(parseISO(iso), "d MMM", { locale: es });
}

export function groupLabel(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  if (isSameYear(d, new Date())) return format(d, "d 'de' MMMM", { locale: es });
  return format(d, "d 'de' MMMM yyyy", { locale: es });
}

export function sameMonth(iso: string): boolean {
  return isSameMonth(parseISO(iso), new Date());
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

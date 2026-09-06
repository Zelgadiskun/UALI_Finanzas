import {
  addMonths,
  format,
  isSameMonth,
  isSameYear,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
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

/** True when `iso` falls in the calendar month `offset` months from now (negative = past). */
export function inMonthOffset(iso: string, offset: number): boolean {
  return isSameMonth(parseISO(iso), addMonths(new Date(), offset));
}

/**
 * Percent change from `previous` to `current`, rounded to a whole number.
 * Returns undefined when there's no prior-period baseline to compare against
 * — showing "+100%" (or any number) off a zero baseline would be fabricated.
 */
export function percentChange(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

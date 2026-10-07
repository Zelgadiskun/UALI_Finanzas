import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { money, percentChange, groupLabel, sameMonth, monthLabelOffset, greeting } from "./format";

// Intl's compact notation joins the number and unit with a non-breaking
// space (U+00A0), not a regular one — spelled out explicitly since that
// byte is invisible in a normal diff.
const NBSP = " ";

describe("money", () => {
  it("formats positive amounts with es-AR thousands/decimal separators", () => {
    expect(money(1234.5)).toBe("$1.234,50");
  });

  it("prefixes negative amounts with a minus sign, not a leading zero-width dash", () => {
    expect(money(-1234.5)).toBe("-$1.234,50");
  });

  it("formats zero without a sign", () => {
    expect(money(0)).toBe("$0,00");
  });

  it("switches to compact notation once the magnitude reaches compactAbove", () => {
    expect(money(12345, 10000)).toBe(`$12,3${NBSP}k`);
  });

  it("keeps full notation just under the compactAbove threshold", () => {
    expect(money(9999, 10000)).toBe("$9.999,00");
  });

  it("compacts negative amounts too, keeping the sign", () => {
    expect(money(-12345, 10000)).toBe(`-$12,3${NBSP}k`);
  });
});

describe("percentChange", () => {
  it("computes a rounded percentage against a positive baseline", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it("returns undefined with no baseline to compare against — never fabricates a delta", () => {
    expect(percentChange(100, 0)).toBeUndefined();
    expect(percentChange(100, -5)).toBeUndefined();
  });
});

describe("dates (fixed system clock)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sameMonth is true for a date in the current calendar month", () => {
    expect(sameMonth("2026-09-01")).toBe(true);
    expect(sameMonth("2026-08-30")).toBe(false);
  });

  it("groupLabel says Hoy for the current date", () => {
    expect(groupLabel("2026-09-06")).toBe("Hoy");
  });

  it("groupLabel says Ayer for yesterday", () => {
    expect(groupLabel("2026-09-05")).toBe("Ayer");
  });

  it("monthLabelOffset names the month N months from now", () => {
    expect(monthLabelOffset(0)).toBe("sep");
    expect(monthLabelOffset(-1)).toBe("ago");
  });

  it("greeting depends on the hour of day", () => {
    vi.setSystemTime(new Date("2026-09-06T09:00:00"));
    expect(greeting()).toBe("Buenos días");
    vi.setSystemTime(new Date("2026-09-06T15:00:00"));
    expect(greeting()).toBe("Buenas tardes");
    vi.setSystemTime(new Date("2026-09-06T22:00:00"));
    expect(greeting()).toBe("Buenas noches");
  });
});

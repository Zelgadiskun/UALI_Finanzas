import { describe, it, expect } from "vitest";

describe("TotoPerpetualCogs Inflation & Asset Yields Logic", () => {
  const inflationRate = 0.06; // 6% anual
  const totalCapital = 10000;

  it("calculates real yield erosion when 100% is held in static cash", () => {
    const yieldCash = 0.0;
    const realYield = yieldCash - inflationRate; // -6%
    const years = 5;
    const finalValue = totalCapital * Math.pow(1 + realYield, years);

    expect(realYield).toBe(-0.06);
    expect(finalValue).toBeLessThan(totalCapital);
    // 10000 * (0.94)^5 = 7339
    expect(Math.round(finalValue)).toBe(7339);
  });

  it("calculates positive real yield when modern assets beat inflation", () => {
    // 50% Acciones (+10%), 30% Bienes Raíces (+7.5%), 20% Bonos (+5.5%)
    const weightedYield = 0.5 * 0.1 + 0.3 * 0.075 + 0.2 * 0.055; // 0.05 + 0.0225 + 0.011 = 0.0835 (8.35%)
    const realYield = weightedYield - inflationRate; // 8.35% - 6% = +2.35%

    expect(realYield).toBeGreaterThan(0.02);

    const years = 5;
    const finalValue = totalCapital * Math.pow(1 + realYield, years);
    expect(finalValue).toBeGreaterThan(totalCapital);
  });
});

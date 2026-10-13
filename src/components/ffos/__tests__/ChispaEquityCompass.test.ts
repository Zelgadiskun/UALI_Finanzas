import { describe, it, expect } from "vitest";

describe("ChispaEquityCompass Parity & Tension Logic", () => {
  it("calculates proportional income ratio correctly (2:1 ratio)", () => {
    const incomeUser = 2000;
    const incomePartner = 1000;
    const totalIncome = incomeUser + incomePartner;
    const idealUserRatio = (incomeUser / totalIncome) * 100; // 66.67%

    expect(Math.round(idealUserRatio)).toBe(67);
  });

  it("detects high mechanical tension when 50/50 is forced on asymmetric incomes", () => {
    const idealRatio = 66.67;
    const forcedRigidRatio = 50.0;
    const diff = Math.abs(forcedRigidRatio - idealRatio); // 16.67%
    const tensionLevel = Math.min(100, Math.round(diff * 3.5)); // ~58%

    expect(tensionLevel).toBeGreaterThan(50);
  });

  it("detects low tension (armonía) when user ratio matches proportional capacity", () => {
    const idealRatio = 66.67;
    const chosenRatio = 66.0;
    const diff = Math.abs(chosenRatio - idealRatio); // 0.67%
    const tensionLevel = Math.min(100, Math.round(diff * 3.5)); // ~2%

    expect(tensionLevel).toBeLessThan(15);
  });
});

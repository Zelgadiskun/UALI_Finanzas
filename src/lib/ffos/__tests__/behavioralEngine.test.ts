import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  calculateLevelProgress,
  computeVirtualTelemetry,
  formatSafeBudgetPercent,
  GUARDIAN_IDENTITIES,
  UALI_CONFIG_V2,
} from "../behavioralEngine";

describe("Behavioral Health and Dopamine Engine v2.0.0", () => {
  it("cumple con la fórmula universal de nivel: level = Math.floor(xp / 250) + 1", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(1);
    expect(calculateLevel(249)).toBe(1);
    expect(calculateLevel(250)).toBe(2);
    expect(calculateLevel(499)).toBe(2);
    expect(calculateLevel(500)).toBe(3);
    expect(calculateLevel(750)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
  });

  it("calcula el desglose proporcional exacto de XP en calculateLevelProgress", () => {
    const p1 = calculateLevelProgress(0);
    expect(p1.level).toBe(1);
    expect(p1.xpIntoLevel).toBe(0);
    expect(p1.pct).toBe(0);
    expect(p1.xpToNext).toBe(250);

    const p2 = calculateLevelProgress(375); // Mitad del nivel 2 (250 a 500)
    expect(p2.level).toBe(2);
    expect(p2.xpIntoLevel).toBe(125);
    expect(p2.pct).toBe(50);
    expect(p2.xpToNext).toBe(125);
  });

  it("aplica zero_bug_fallback erradicando cualquier cadena NaN% cuando planned <= 0", () => {
    expect(formatSafeBudgetPercent(0, 0)).toBe("0% utilizado de tu cupo");
    expect(formatSafeBudgetPercent(150, 0)).toBe("0% utilizado de tu cupo");
    expect(formatSafeBudgetPercent(0, 0, "badge")).toBe("0% cupo");
    expect(formatSafeBudgetPercent(0, 0, "number")).toBe("0");

    // Cuando el presupuesto tiene cupo válido
    expect(formatSafeBudgetPercent(250, 500)).toBe("50% utilizado de tu cupo");
    expect(formatSafeBudgetPercent(250, 500, "badge")).toBe("50% usado");
  });

  it("ejecuta el mapeo de telemetría real a virtual (Escudo Nido, Estrés y Batería)", () => {
    const telemetry = computeVirtualTelemetry({
      savingsThisMonth: 150, // 3 depósitos de $50 = +30 HP
      totalSpentThisMonth: 800,
      totalPlannedThisMonth: 1000,
      sharedExpensesCount: 2,
      sharedExpensesTotal: 120,
      overdrawnCategoriesCount: 0,
    });

    // Escudo base 60 + 30 = 90 HP
    expect(telemetry.escudoNidoHp).toBe(90);
    expect(telemetry.fisurasEstres).toBe(0);
    expect(telemetry.indiceEstres).toBe(0);
    expect(telemetry.bateriaClanVoltaje).toBeGreaterThanOrEqual(30);
    expect(telemetry.sharkLeagueTier).toBeDefined();
  });

  it("mantiene las identidades canónicas de los 3 guardianes según el pilar 3", () => {
    expect(GUARDIAN_IDENTITIES.nido.avatar).toBe("Cerdito de Titanio");
    expect(GUARDIAN_IDENTITIES.nido.focus).toContain("Ahorro básico");

    expect(GUARDIAN_IDENTITIES.chispa.avatar).toBe("Triángulo Compás");
    expect(GUARDIAN_IDENTITIES.chispa.focus).toContain("Crédito");

    expect(GUARDIAN_IDENTITIES.toto.avatar).toBe("Moneda Holográfica");
    expect(GUARDIAN_IDENTITIES.toto.focus).toContain("Inversión");
  });

  it("la configuración global v2.0.0 contiene las 3 rutas objetivo y especificación de telemetría", () => {
    expect(UALI_CONFIG_V2.target_routes).toEqual([
      "src/routes/aprender.tsx",
      "src/routes/inicio.tsx",
      "src/routes/presupuesto.tsx",
    ]);
    expect(UALI_CONFIG_V2.system_telemetry.real_to_virtual_mapping.real_savings_deposit).toBe(
      "recargar_escudo_nido_hp",
    );
  });
});

import { describe, it, expect } from "vitest";
import {
  GUARDIAN_PROFILES,
  GUARDIAN_TOPICS,
  sanitizeSimulationMetric,
  getLowCortisolTransitionDuration,
} from "../guardianDialoguesEngine";
import { sanitizePercentage } from "../format";

describe("Motor de Diálogos de Guardianes UALÍ (guardianDialoguesEngine)", () => {
  it("contiene los perfiles de los tres guardianes con identidad y filosofía definidas", () => {
    expect(GUARDIAN_PROFILES.nido).toBeDefined();
    expect(GUARDIAN_PROFILES.nido.name).toBe("Nido");
    expect(GUARDIAN_PROFILES.nido.emoji).toBe("🐷");

    expect(GUARDIAN_PROFILES.chispa).toBeDefined();
    expect(GUARDIAN_PROFILES.chispa.name).toBe("Chispa");
    expect(GUARDIAN_PROFILES.chispa.emoji).toBe("📐");

    expect(GUARDIAN_PROFILES.toto).toBeDefined();
    expect(GUARDIAN_PROFILES.toto.name).toBe("Toto");
    expect(GUARDIAN_PROFILES.toto.emoji).toBe("🪙");
  });

  it("ofrece temas de diálogo con opiniones independientes para cada guardián", () => {
    expect(GUARDIAN_TOPICS.length).toBeGreaterThanOrEqual(3);

    for (const topic of GUARDIAN_TOPICS) {
      expect(topic.opinions.nido).toBeDefined();
      expect(topic.opinions.chispa).toBeDefined();
      expect(topic.opinions.toto).toBeDefined();
      expect(topic.testChoices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("calcula la duración de amortiguación visual (+40% de tiempo si el cortisol supera 60%)", () => {
    // Modo en calma (<60%): 0.30s
    expect(getLowCortisolTransitionDuration(30)).toBe(0.3);
    expect(getLowCortisolTransitionDuration(59)).toBe(0.3);

    // Modo alerta crítica (>=60%): 0.42s (+40% extra para suavizar impacto)
    expect(getLowCortisolTransitionDuration(60)).toBe(0.42);
    expect(getLowCortisolTransitionDuration(85)).toBe(0.42);

    // Fallbacks para NaN o valores indefinidos
    expect(getLowCortisolTransitionDuration(NaN as number)).toBe(0.3);
  });
});

describe("Sanitización Estricta de Variables Matemáticas (Zero-Bug Fallback)", () => {
  it("previene NaN% y rupturas visuales ante denominadores 0 o nulos", () => {
    expect(sanitizePercentage(0, 0)).toBe(0);
    expect(sanitizePercentage(150, 0)).toBe(0);
    expect(sanitizePercentage(NaN, 100)).toBe(0);
    expect(sanitizePercentage(100, NaN)).toBe(0);
    expect(sanitizePercentage(undefined, 100)).toBe(0);
    expect(sanitizePercentage(null, 100)).toBe(0);
    expect(sanitizePercentage(50, -10)).toBe(0);
    expect(sanitizePercentage(Infinity, 100)).toBe(0);
  });

  it("calcula porcentajes válidos y los contiene dentro de los límites esperados", () => {
    expect(sanitizePercentage(50, 100)).toBe(50);
    expect(sanitizePercentage(25, 100)).toBe(25);
    expect(sanitizePercentage(300, 100, 100)).toBe(100); // Clamped al max
    expect(sanitizeSimulationMetric(75, 100)).toBe(75);
  });
});

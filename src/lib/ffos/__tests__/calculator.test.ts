import { describe, expect, it } from "vitest";
import {
  sanitizeMathExpression,
  evaluateMathExpression,
  hasMathOperators,
  formatCalculatedResult,
} from "../calculator";

describe("FFOS Money Calculator Engine", () => {
  describe("sanitizeMathExpression", () => {
    it("normaliza símbolos matemáticos y comas decimales", () => {
      expect(sanitizeMathExpression("10 × 2")).toBe("10*2");
      expect(sanitizeMathExpression("10 ÷ 2")).toBe("10/2");
      expect(sanitizeMathExpression("15,50 + 4,50")).toBe("15.50+4.50");
    });
  });

  describe("hasMathOperators", () => {
    it("detecta operadores matemáticos correctamente", () => {
      expect(hasMathOperators("1500")).toBe(false);
      expect(hasMathOperators("1500.50")).toBe(false);
      expect(hasMathOperators("100 + 50")).toBe(true);
      expect(hasMathOperators("100 - 20")).toBe(true);
      expect(hasMathOperators("20 * 5")).toBe(true);
      expect(hasMathOperators("100 / 2")).toBe(true);
      expect(hasMathOperators("100 × 2")).toBe(true);
      expect(hasMathOperators("100 ÷ 2")).toBe(true);
      expect(hasMathOperators("100 + 10%")).toBe(true);
    });
  });

  describe("evaluateMathExpression", () => {
    it("evalúa sumas y restas básicas", () => {
      expect(evaluateMathExpression("100 + 50")).toBe(150);
      expect(evaluateMathExpression("200 - 45")).toBe(155);
      expect(evaluateMathExpression("10.5 + 4.5")).toBe(15);
      expect(evaluateMathExpression("10,50 + 4,50")).toBe(15);
    });

    it("evalúa multiplicaciones y divisiones con precedencia", () => {
      expect(evaluateMathExpression("10 + 5 * 2")).toBe(20);
      expect(evaluateMathExpression("(10 + 5) * 2")).toBe(30);
      expect(evaluateMathExpression("100 / 4")).toBe(25);
      expect(evaluateMathExpression("50 × 3")).toBe(150);
      expect(evaluateMathExpression("60 ÷ 3")).toBe(20);
    });

    it("soporta auto-cierre de paréntesis mientras se escribe", () => {
      expect(evaluateMathExpression("(50 + 20")).toBe(70);
      expect(evaluateMathExpression("((10 + 5) * 2")).toBe(30);
    });

    it("soporta operadores pendientes al final sin fallar", () => {
      expect(evaluateMathExpression("100 +")).toBe(100);
      expect(evaluateMathExpression("50 *")).toBe(50);
      expect(evaluateMathExpression("75.")).toBe(75);
    });

    it("evalúa porcentajes comerciales", () => {
      // 100 + 10% = 110 (adición de porcentaje)
      expect(evaluateMathExpression("100 + 10%")).toBe(110);
      // 100 - 20% = 80 (descuento de porcentaje)
      expect(evaluateMathExpression("100 - 20%")).toBe(80);
      // 50 * 10% = 5 (cálculo de fracción de porcentaje)
      expect(evaluateMathExpression("50 * 10%")).toBe(5);
    });

    it("previene división por cero y entradas no numéricas", () => {
      expect(evaluateMathExpression("100 / 0")).toBeNull();
      expect(evaluateMathExpression("abc")).toBeNull();
      expect(evaluateMathExpression("")).toBeNull();
    });
  });

  describe("formatCalculatedResult", () => {
    it("redondea hasta 2 decimales limpios", () => {
      expect(formatCalculatedResult(10)).toBe("10");
      expect(formatCalculatedResult(10.5)).toBe("10.5");
      expect(formatCalculatedResult(10.555)).toBe("10.56");
      expect(formatCalculatedResult(NaN)).toBe("0");
    });
  });
});

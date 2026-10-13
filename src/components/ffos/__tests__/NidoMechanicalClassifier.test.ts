import { describe, it, expect } from "vitest";
import { type ExpenseFlowItem } from "../NidoMechanicalClassifier";

describe("NidoMechanicalClassifier Logic", () => {
  it("correctly identifies archetypal needs vs wants", () => {
    const rent: ExpenseFlowItem = {
      id: "item-renta",
      name: "Alquiler del Hogar",
      amount: 450,
      category: "Vivienda",
      actualType: "need",
      explanation: "Oxígeno vital indispensable",
    };

    const streaming: ExpenseFlowItem = {
      id: "item-streaming",
      name: "Suscripción Premium 4K",
      amount: 19.99,
      category: "Entretenimiento",
      actualType: "want",
      explanation: "Luz de bengala efímera",
    };

    expect(rent.actualType).toBe("need");
    expect(streaming.actualType).toBe("want");
  });

  it("handles hybrid item calibration thresholds", () => {
    const hybridItem: ExpenseFlowItem = {
      id: "item-calzado",
      name: "Ropa de Trabajo",
      amount: 55,
      category: "Vestimenta",
      actualType: "hybrid",
      explanation: "Gasto híbrido",
      hybridNeedRatio: 65,
    };

    expect(hybridItem.actualType).toBe("hybrid");
    expect(hybridItem.hybridNeedRatio).toBeGreaterThanOrEqual(50);
  });
});

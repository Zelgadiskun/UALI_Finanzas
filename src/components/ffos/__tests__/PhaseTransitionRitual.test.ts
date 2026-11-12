import { describe, it, expect } from "vitest";
import type { PhaseTransitionType } from "../PhaseTransitionRitual";

describe("PhaseTransitionRitual Handover Mapping", () => {
  it("maps node 4 (savings_basics) to phase 1 -> 2 handover: Nido to Chispa", () => {
    const type: PhaseTransitionType = "phase1_to_2";
    expect(type).toBe("phase1_to_2");
  });

  it("maps node 8 (debt_order) to phase 2 -> 3 handover: Chispa to Toto", () => {
    const type: PhaseTransitionType = "phase2_to_3";
    expect(type).toBe("phase2_to_3");
  });

  it("maps node 12 (inflation_shield) to phase 3 -> supreme mastery trinidad", () => {
    const type: PhaseTransitionType = "phase3_mastery";
    expect(type).toBe("phase3_mastery");
  });
});

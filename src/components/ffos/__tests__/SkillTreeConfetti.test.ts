import { describe, it, expect, vi, beforeEach } from "vitest";
import confetti from "canvas-confetti";
import { fireMilestoneConfetti, NODOS_LECCION, type SkillNode } from "../SkillTree";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("SkillTree Milestone Confetti Animation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports fireMilestoneConfetti and invokes canvas confetti with milestone colors", () => {
    fireMilestoneConfetti();

    expect(confetti).toHaveBeenCalled();
    // Verifies dual cannons were fired
    expect(vi.mocked(confetti)).toHaveBeenCalledTimes(2);

    const firstCallArgs = vi.mocked(confetti).mock.calls[0][0];
    expect(firstCallArgs).toBeDefined();
    expect(firstCallArgs?.colors).toContain("#10b981");
    expect(firstCallArgs?.disableForReducedMotion).toBe(true);
  });

  it("fires targeted confetti at specific click coordinates when passed", () => {
    fireMilestoneConfetti({ x: 300, y: 400 });

    // 1 targeted burst + 2 dual cannons = 3 calls
    expect(vi.mocked(confetti)).toHaveBeenCalledTimes(3);
    const targetCallArgs = vi.mocked(confetti).mock.calls[0][0];
    expect(targetCallArgs?.origin?.x).toBeGreaterThan(0);
    expect(targetCallArgs?.origin?.y).toBeGreaterThan(0);
  });

  it("defines the standard 5 lesson milestones in ascending XP order", () => {
    expect(NODOS_LECCION.length).toBe(5);
    for (let i = 1; i < NODOS_LECCION.length; i++) {
      expect(NODOS_LECCION[i].xp_requerida).toBeGreaterThan(NODOS_LECCION[i - 1].xp_requerida);
    }
  });

  it("correctly identifies when an XP increment reaches the next node", () => {
    const prevXP = 150;
    const newXP = 260; // Crosses Node 2 threshold (250 XP)

    const newlyUnlocked: SkillNode[] = NODOS_LECCION.filter(
      (nodo) => prevXP < nodo.xp_requerida && newXP >= nodo.xp_requerida,
    );

    expect(newlyUnlocked.length).toBe(1);
    expect(newlyUnlocked[0].id).toBe(2);
    expect(newlyUnlocked[0].titulo).toBe("El Escudo de Nido (Ahorro)");
  });
});

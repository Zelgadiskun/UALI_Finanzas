import { describe, expect, it } from "vitest";
import { levelInfo, LEVELS } from "./gamification";

describe("levelInfo", () => {
  it("starts at level 1 with 0 xp", () => {
    const info = levelInfo(0);
    expect(info.level).toBe(1);
    expect(info.name).toBe("Aprendiz");
    expect(info.pct).toBe(0);
  });

  it("stays on the current level right up to the xp boundary", () => {
    expect(levelInfo(249).level).toBe(1);
    expect(levelInfo(250).level).toBe(2);
    expect(levelInfo(499).level).toBe(2);
    expect(levelInfo(500).level).toBe(3);
  });

  it("computes progress within the current level against the next threshold", () => {
    const info = levelInfo(125); // halfway from 0 to 250
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(125);
    expect(info.xpForLevel).toBe(250);
    expect(info.pct).toBe(50);
    expect(info.xpToNext).toBe(125);
    expect(info.levelCap).toBe(250);
    expect(info.next?.name).toBe("Organizador");

    const infoLvl2 = levelInfo(375); // halfway from 250 to 500
    expect(infoLvl2.level).toBe(2);
    expect(infoLvl2.xpIntoLevel).toBe(125);
    expect(infoLvl2.levelCap).toBe(500); // Nivel 2 = Máximo 500 XP acumulados
  });

  it("reports the max level with no next level and 100% — never over 100", () => {
    const maxLevel = LEVELS.at(-1)!;
    const info = levelInfo(maxLevel.xpRequired + 10_000);
    expect(info.level).toBe(maxLevel.level);
    expect(info.next).toBeNull();
    expect(info.pct).toBe(100);
    expect(info.xpToNext).toBe(0);
  });
});

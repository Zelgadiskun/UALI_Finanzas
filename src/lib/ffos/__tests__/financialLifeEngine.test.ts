import { describe, it, expect } from "vitest";
import {
  SIMULATION_ROLES,
  ROLE_DILEMMAS,
  initializeSimulation,
  applyDilemmaChoice,
  evaluateSimulationOutcome,
} from "../financialLifeEngine";
import { getPillarNavigationBridge, APP_ROUTES } from "../appRoutes";

describe("Motor de Videojuego UALÍ - Simulación de Vida Financiera", () => {
  it("inicializa el rol de freelancer (Mateo) con valores sanitizados y en calma", () => {
    const state = initializeSimulation("freelance");
    expect(state.role.id).toBe("freelance");
    expect(state.roundIndex).toBe(0);
    expect(state.cashflow).toBe(1400);
    expect(state.shield).toBe(800);
    expect(state.cortisol).toBe(30);
    expect(state.isComplete).toBe(false);
    expect(state.history).toHaveLength(0);
  });

  it("inicializa el rol de asalariada (Sofía) y emprendedor (Leo) correctamente", () => {
    const sofia = initializeSimulation("salaried");
    expect(sofia.role.id).toBe("salaried");
    expect(sofia.cashflow).toBe(950);
    expect(sofia.shield).toBe(1600);

    const leo = initializeSimulation("entrepreneur");
    expect(leo.role.id).toBe("entrepreneur");
    expect(leo.cashflow).toBe(2100);
    expect(leo.shield).toBe(700);
  });

  it("aplica una elección prudente reduciendo el cortisol e incrementando la sabiduría", () => {
    const state = initializeSimulation("freelance");
    const dilemma = ROLE_DILEMMAS.freelance[0];
    const prudentChoice = dilemma.choices.find((c) => c.badge === "Prudente")!;

    const nextState = applyDilemmaChoice(state, prudentChoice);
    expect(nextState.roundIndex).toBe(1);
    expect(nextState.shield).toBe(state.shield + prudentChoice.deltaShield);
    expect(nextState.cortisol).toBeLessThanOrEqual(state.cortisol);
    expect(nextState.wisdom).toBeGreaterThan(state.wisdom);
    expect(nextState.xpEarned).toBeGreaterThan(0);
    expect(nextState.history).toHaveLength(1);
  });

  it("mantiene el cortisol contenido dentro del rango 0 a 100 sin fallos de desborde", () => {
    let state = initializeSimulation("freelance");
    const dilemma = ROLE_DILEMMAS.freelance[0];
    const impulsiveChoice = dilemma.choices.find((c) => c.badge === "Impulsivo")!;

    // Aplicar múltiples veces la opción impulsiva simulada
    for (let i = 0; i < 5; i++) {
      state = applyDilemmaChoice(state, impulsiveChoice);
    }
    expect(state.cortisol).toBeLessThanOrEqual(100);
    expect(state.cortisol).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(state.cortisol)).toBe(false);
  });

  it("evalúa el arquetipo de bienestar clínico según el cortisol y fondo de escudo", () => {
    const calmState = {
      ...initializeSimulation("freelance"),
      cortisol: 25,
      shield: 900,
      cashflow: 1500,
    };
    const outcomeCalm = evaluateSimulationOutcome(calmState);
    expect(outcomeCalm.mentalHealthStatus).toBe("Calma Total");
    expect(outcomeCalm.archetype).toBe("Arquitecto de Resiliencia");

    const highCortisolState = {
      ...initializeSimulation("freelance"),
      cortisol: 75,
      shield: 200,
      cashflow: 300,
    };
    const outcomeHigh = evaluateSimulationOutcome(highCortisolState);
    expect(outcomeHigh.mentalHealthStatus).toBe("Alerta de Estrés");
    expect(outcomeHigh.archetype).toBe("Explorador en Aprendizaje");
  });
});

describe("Puente de Rutas Canónicas UALÍ (appRoutes)", () => {
  it("devuelve los tres pilares conectados desde Inicio", () => {
    const bridge = getPillarNavigationBridge(APP_ROUTES.INICIO);
    expect(bridge.isInicio).toBe(true);
    expect(bridge.isPresupuesto).toBe(false);
    expect(bridge.isAprender).toBe(false);
    expect(bridge.nextPillars).toHaveLength(3);
  });

  it("detecta correctamente la ruta de Presupuesto y Aprender", () => {
    const bridgeBudget = getPillarNavigationBridge("/presupuesto");
    expect(bridgeBudget.isPresupuesto).toBe(true);

    const bridgeLearn = getPillarNavigationBridge("/aprender");
    expect(bridgeLearn.isAprender).toBe(true);
  });
});

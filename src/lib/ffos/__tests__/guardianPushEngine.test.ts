import { describe, expect, it } from "vitest";
import {
  GUARDIANS_META,
  GUARDIAN_TEMPLATES,
  MAX_PUSH_STRING_LENGTH,
  dispatchGuardianPushNotification,
  enforceMax90,
  validatePushString,
} from "../guardianPushEngine";

describe("Guardian Push Notification Engine — Cadencia de Retención", () => {
  describe("Regla 3: Restricción estricta de 90 caracteres por string", () => {
    it("todos los templates predefinidos deben tener título <= 90 caracteres", () => {
      for (const tpl of GUARDIAN_TEMPLATES) {
        expect(tpl.title.length).toBeLessThanOrEqual(MAX_PUSH_STRING_LENGTH);
      }
    });

    it("todos los templates predefinidos deben tener cuerpo <= 90 caracteres", () => {
      for (const tpl of GUARDIAN_TEMPLATES) {
        expect(tpl.body.length).toBeLessThanOrEqual(MAX_PUSH_STRING_LENGTH);
      }
    });

    it("enforceMax90 recorta strings largos preservando longitud máxima de 90", () => {
      const longText =
        "Este es un texto excesivamente largo diseñado para probar la disciplina móvil de no sobrepasar los noventa caracteres bajo ninguna circunstancia en la interfaz.";
      expect(longText.length).toBeGreaterThan(90);

      const truncated = enforceMax90(longText);
      expect(truncated.length).toBeLessThanOrEqual(90);
      expect(truncated.endsWith("…")).toBe(true);
    });

    it("validatePushString reporta validez y caracteres restantes con exactitud", () => {
      const valid = validatePushString("🐷 NIDO: Meta al 25%");
      expect(valid.valid).toBe(true);
      expect(valid.remaining).toBe(MAX_PUSH_STRING_LENGTH - valid.length);
    });
  });

  describe("Regla 1: Asignación personalizada por Guardián y Disparador", () => {
    it("NIDO debe estar mapeado a eventos individuales y de ahorro", () => {
      expect(GUARDIANS_META.nido.triggerCategory).toBe("individual_ahorro");
      expect(GUARDIANS_META.nido.anatomy).toBe("Cerdito Alcancía blindado");
    });

    it("CHISPA debe estar mapeado a sincronización de equipo (Team_ID)", () => {
      expect(GUARDIANS_META.chispa.triggerCategory).toBe("team_sync");
      expect(GUARDIANS_META.chispa.anatomy).toBe("Triángulo Compás de Brújula de navegación");
    });

    it("TOTO debe estar mapeado a eventos globales de la Liga", () => {
      expect(GUARDIANS_META.toto.triggerCategory).toBe("liga_global");
      expect(GUARDIANS_META.toto.anatomy).toBe("Moneda holográfica geométrica");
    });

    it("Chispa incorpora el Team_ID respetando los 90 caracteres", () => {
      const res = dispatchGuardianPushNotification({
        guardian: "chispa",
        triggerCategory: "team_sync",
        title: "📐 CHISPA: Equipo al día",
        body: "Gasto compartido registrado en Clan",
        teamId: "TIBURONES-01",
        stressLevelOverride: 30,
      });

      expect(res.dispatched).toBe(true);
      expect(res.guardian).toBe("chispa");
      expect(res.body).toContain("TIBURONES-01");
      expect(res.body.length).toBeLessThanOrEqual(90);
    });
  });

  describe("Regla 2: Comportamiento bajo Barra de Estrés > 75%", () => {
    it("con estrés > 75%, las alertas promocionales de Toto se bloquean/desactivan", () => {
      const res = dispatchGuardianPushNotification({
        guardian: "toto",
        triggerCategory: "liga_global",
        title: "🪙 TOTO: ¡Nuevo torneo de Liga!",
        body: "Compite con tu clan por 500 FFOS en la Liga semanal.",
        isPromo: true,
        stressLevelOverride: 85, // Estrés crítico
      });

      expect(res.dispatched).toBe(false);
      expect(res.blocked).toBe(true);
      expect(res.reason).toContain("desactivadas por Barra de Estrés > 75%");
    });

    it("con estrés <= 75%, las alertas promocionales de Toto se despachan normalmente", () => {
      const res = dispatchGuardianPushNotification({
        guardian: "toto",
        triggerCategory: "liga_global",
        title: "🪙 TOTO: Desafío Flash de la Liga",
        body: "Micro-dilema de 30s disponible. Gana +50 FFOS hoy.",
        isPromo: true,
        stressLevelOverride: 45, // Estrés normal
      });

      expect(res.dispatched).toBe(true);
      expect(res.blocked).toBe(false);
      expect(res.title.length).toBeLessThanOrEqual(90);
      expect(res.body.length).toBeLessThanOrEqual(90);
    });

    it("con estrés > 75%, las notificaciones de Nido conmutan a 'S.O.S. de Reparación'", () => {
      const res = dispatchGuardianPushNotification({
        guardian: "nido",
        triggerCategory: "individual_ahorro",
        title: "🐷 NIDO: Recordatorio de ahorro",
        body: "Tienes fondos disponibles para apartar hoy.",
        stressLevelOverride: 82, // Estrés crítico
      });

      expect(res.dispatched).toBe(true);
      expect(res.isSOS).toBe(true);
      expect(res.title).toContain("S.O.S.");
      expect(res.body.length).toBeLessThanOrEqual(90);
    });

    it("con estrés <= 75%, Nido emite notificaciones estándar de ahorro", () => {
      const res = dispatchGuardianPushNotification({
        guardian: "nido",
        triggerCategory: "individual_ahorro",
        title: "🐷 NIDO: Meta de Ahorro",
        body: "Aportaste a tu reserva blindada. Tu colchón crece.",
        stressLevelOverride: 30, // Estrés normal
      });

      expect(res.dispatched).toBe(true);
      expect(res.isSOS).toBe(false);
      expect(res.title).not.toContain("S.O.S.");
      expect(res.title.length).toBeLessThanOrEqual(90);
      expect(res.body.length).toBeLessThanOrEqual(90);
    });
  });
});

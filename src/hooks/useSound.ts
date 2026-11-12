import confetti from "canvas-confetti";
import { useCallback } from "react";

/**
 * Hook useSound() - Pilar 1: Retroalimentación Inmediata
 *
 * Utiliza Web Audio API nativo del navegador para garantizar:
 * - Latencia de reproducción < 20ms (muy por debajo del límite de 100ms).
 * - Funcionamiento 100% offline sin descargas de audio externas que puedan fallar.
 * - Tintineos sónicos en depósitos de ahorro real, recarga de escudo y micro-animaciones.
 */

// Contexto de audio reutilizable en memoria
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function useSound() {
  /**
   * Tintineo sónico para depósitos de ahorro (monedas de titanio cayendo en el nido)
   */
  const playDepositChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Secuencia de campana armónica pentatónica
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch (e) {
      console.warn("Audio chime prevented:", e);
    }
  }, []);

  /**
   * Acorde de éxito / Misión completada
   */
  const playSuccessChord = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + 0.5);
      });
    } catch (e) {
      void e;
    }
  }, []);

  /**
   * Blindaje del Escudo de Nido (Refuerzo metálico de titanio)
   */
  const playShieldRecharge = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      void e;
    }
  }, []);

  /**
   * Feedback suave de reintento formativo (Pilar 6: El error como aprendizaje, no punitivo)
   */
  const playLearningRetry = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(329.63, now); // E4 cálido
      osc.frequency.setValueAtTime(293.66, now + 0.1); // D4

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      void e;
    }
  }, []);

  /**
   * Disparar micro-animación de confeti dopamine
   */
  const triggerConfetti = useCallback((options?: confetti.Options) => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#2EC4B6", "#FF9F1C", "#E71D36", "#A855F7"],
        ...options,
      });
    } catch (e) {
      console.warn("Confetti animation:", e);
    }
  }, []);

  return {
    playDepositChime,
    playSuccessChord,
    playShieldRecharge,
    playLearningRetry,
    triggerConfetti,
  };
}

export default useSound;

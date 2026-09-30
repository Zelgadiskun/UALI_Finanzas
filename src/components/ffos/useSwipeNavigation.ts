import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

const TABS = [
  "/",
  "/movimientos",
  "/presupuesto",
  "/deudas",
  "/mas",
] as const;

export function useSwipeNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const pathname = location.pathname;
    const currentIndex = TABS.indexOf(pathname as (typeof TABS)[number]);

    function isInteractive(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      // Do not swipe if interacting with forms, horizontal carousels, or bottom sheet
      return !!target.closest(
        "input, select, textarea, button, role[slider], [data-no-swipe], .overflow-x-auto, [role='dialog']"
      );
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      if (isInteractive(e.target)) {
        touchStartRef.current = null;
        return;
      }
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      // Thresholds: at least 60px horizontal, fast enough (< 500ms), and mostly horizontal (deltaX > 1.8 * deltaY)
      if (deltaTime > 600) return;
      if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < 1.8 * Math.abs(deltaY)) return;

      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Swipe Left -> next tab
        if (currentIndex < TABS.length - 1) {
          navigate({ to: TABS[currentIndex + 1] });
        }
      } else {
        // Swipe Right -> previous tab
        if (currentIndex > 0) {
          navigate({ to: TABS[currentIndex - 1] });
        }
      }
    }

    // Also support desktop responsiveness: Alt + ArrowLeft / ArrowRight
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        if (currentIndex === -1) return;
        if (e.key === "ArrowRight" && currentIndex < TABS.length - 1) {
          e.preventDefault();
          navigate({ to: TABS[currentIndex + 1] });
        } else if (e.key === "ArrowLeft" && currentIndex > 0) {
          e.preventDefault();
          navigate({ to: TABS[currentIndex - 1] });
        }
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [location.pathname, navigate]);
}

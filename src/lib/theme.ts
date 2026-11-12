import { safeLocalStorage } from "./safeStorage";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ffos-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    return safeLocalStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    safeLocalStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore iframe storage restriction
  }
}

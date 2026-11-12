/**
 * Safe Storage utility for cross-origin iframes (e.g. Google AI Studio preview).
 * When third-party cookies or storage access are blocked, accessing window.localStorage
 * or window.sessionStorage directly throws a SecurityError DOMException.
 * This fallback transparently provides an in-memory Storage implementation.
 */

class MemoryStorage implements Storage {
  private mem = new Map<string, string>();

  get length(): number {
    return this.mem.size;
  }

  clear(): void {
    this.mem.clear();
  }

  getItem(key: string): string | null {
    return this.mem.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.mem.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.mem.delete(key);
  }

  setItem(key: string, value: string): void {
    this.mem.set(key, String(value));
  }
}

const fallbackStorage = new MemoryStorage();

export function getSafeLocalStorage(): Storage {
  if (typeof window === "undefined") return fallbackStorage;
  try {
    const testKey = "__uali_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return fallbackStorage;
  }
}

export function getSafeSessionStorage(): Storage {
  if (typeof window === "undefined") return fallbackStorage;
  try {
    const testKey = "__uali_session_test__";
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return window.sessionStorage;
  } catch {
    return fallbackStorage;
  }
}

export const safeLocalStorage = getSafeLocalStorage();
export const safeSessionStorage = getSafeSessionStorage();

// Auto-patch Window.prototype and window if third-party storage throws
if (typeof window !== "undefined") {
  try {
    const testKey = "__probe_store__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch {
    try {
      if (typeof Window !== "undefined" && Window.prototype) {
        Object.defineProperty(Window.prototype, "localStorage", {
          get: () => fallbackStorage,
          configurable: true,
          enumerable: true,
        });
        Object.defineProperty(Window.prototype, "sessionStorage", {
          get: () => fallbackStorage,
          configurable: true,
          enumerable: true,
        });
      }
    } catch {}
    try {
      Object.defineProperty(window, "localStorage", {
        get: () => fallbackStorage,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(window, "sessionStorage", {
        get: () => fallbackStorage,
        configurable: true,
        enumerable: true,
      });
    } catch {}
  }
}

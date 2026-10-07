import { useState, useEffect } from "react";

export type SubscriptionTier = "free" | "pro";

export interface SubscriptionState {
  tier: SubscriptionTier;
  planCycle?: "monthly" | "yearly";
  activatedAt?: string;
  expiresAt?: string;
  isTrial?: boolean;
}

const STORAGE_KEY = "uali_subscription_v1";
const EVENT_NAME = "uali_subscription_changed";

const DEFAULT_STATE: SubscriptionState = {
  tier: "free",
};

export function getStoredSubscription(): SubscriptionState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveSubscription(state: SubscriptionState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function activateSubscription(
  cycle: "monthly" | "yearly" = "yearly",
  isTrial = false,
): SubscriptionState {
  const now = new Date();
  const expires = new Date();
  if (isTrial) {
    expires.setDate(now.getDate() + 7);
  } else if (cycle === "yearly") {
    expires.setFullYear(now.getFullYear() + 1);
  } else {
    expires.setMonth(now.getMonth() + 1);
  }

  const newState: SubscriptionState = {
    tier: "pro",
    planCycle: cycle,
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isTrial,
  };

  saveSubscription(newState);
  return newState;
}

export function cancelSubscription() {
  saveSubscription(DEFAULT_STATE);
}

// Global hook for reactive state across pages and components
let globalPaywallOpen = false;
const paywallListeners = new Set<(open: boolean) => void>();

export function openPaywallModal() {
  globalPaywallOpen = true;
  paywallListeners.forEach((fn) => fn(true));
}

export function closePaywallModal() {
  globalPaywallOpen = false;
  paywallListeners.forEach((fn) => fn(false));
}

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionState>(getStoredSubscription);
  const [paywallOpen, setPaywallOpen] = useState(globalPaywallOpen);

  useEffect(() => {
    function handleStorageChange() {
      setSub(getStoredSubscription());
    }
    const paywallListener = (open: boolean) => setPaywallOpen(open);
    paywallListeners.add(paywallListener);

    window.addEventListener(EVENT_NAME, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      paywallListeners.delete(paywallListener);
      window.removeEventListener(EVENT_NAME, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isPro = sub.tier === "pro";

  return {
    sub,
    isPro,
    planCycle: sub.planCycle,
    expiresAt: sub.expiresAt,
    isTrial: sub.isTrial,
    paywallOpen,
    openPaywall: openPaywallModal,
    closePaywall: closePaywallModal,
    activatePro: (cycle?: "monthly" | "yearly", isTrial?: boolean) =>
      activateSubscription(cycle, isTrial),
    cancelPro: cancelSubscription,
  };
}

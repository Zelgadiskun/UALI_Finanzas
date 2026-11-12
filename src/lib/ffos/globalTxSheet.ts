import { useEffect } from "react";

const EVENT_NAME = "ffos-open-transaction-sheet";

export function openGlobalTransactionSheet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function useGlobalTransactionSheet(onOpen: () => void) {
  useEffect(() => {
    function handle() {
      onOpen();
    }
    window.addEventListener(EVENT_NAME, handle);
    return () => window.removeEventListener(EVENT_NAME, handle);
  }, [onOpen]);
}

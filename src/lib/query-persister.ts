import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/query-persist-client-core";

// Lets a mutation made while offline (add a transaction, complete a lesson...)
// survive closing the PWA and come back: TanStack Query already pauses and
// auto-resumes mutations across an online/offline transition on its own —
// this only extends that across a reload, which matters once the app is
// installed and someone closes it mid-flight without a connection.
//
// The one-time build-time shell prerender runs in Node, where `window`
// doesn't exist — restoreClient/persistClient never actually run there
// (only inside a useEffect), so a no-op stand-in is enough to satisfy the
// type without touching a real store.
const noopPersister: Persister = {
  persistClient: () => undefined,
  restoreClient: () => undefined,
  removeClient: () => undefined,
};

export const queryPersister: Persister =
  typeof window === "undefined"
    ? noopPersister
    : createSyncStoragePersister({ storage: window.localStorage, key: "ffos-query-cache" });

import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCurrentUserId } from "@/lib/supabase/queries";
import { useOfflineSync } from "@/lib/offline-sync";
import { useQueryClient } from "@tanstack/react-query";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const { pendingCount, isSyncing } = useOfflineSync(userId, queryClient);

  if (isOnline && !isSyncing) return null;

  if (isOnline && isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-blue-200 shadow-xl animate-fade-in"
      >
        <RefreshCw className="size-3.5 animate-spin text-blue-300" />
        <span>Sincronizando movimientos guardados...</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-xl animate-fade-in"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      <WifiOff className="size-3.5 text-amber-300" />
      <span>
        {pendingCount > 0
          ? `Modo sin conexión — ${pendingCount} movimiento${pendingCount > 1 ? "s" : ""} guardado${pendingCount > 1 ? "s" : ""} localmente`
          : "Modo sin conexión — datos persistidos localmente"}
      </span>
    </div>
  );
}

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/ffos/BottomNav";
import { Celebration } from "@/components/ffos/Celebration";
import { AuthScreen } from "@/components/ffos/AuthScreen";
import { TransactionSheet } from "@/components/ffos/TransactionSheet";
import { useSwipeNavigation } from "@/components/ffos/useSwipeNavigation";
import { useGlobalTransactionSheet } from "@/lib/ffos/globalTxSheet";
import { useSession } from "@/lib/supabase/auth";
import { queryPersister } from "@/lib/query-persister";
import { getStoredTheme } from "@/lib/theme";
import { OfflineIndicator } from "@/components/ffos/OfflineIndicator";
import { DesktopNav } from "@/components/ffos/DesktopNav";
import { DeviceProvider, useDeviceLayout } from "@/lib/ffos/deviceDetection";
import { cn } from "@/lib/utils";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { title: "UALI Finanzas" },
      {
        name: "description",
        content:
          "Aplicación de finanzas personales y educación financiera en compañía o equipo con seguimiento de presupuesto, deudas y gamificación.",
      },
      { property: "og:title", content: "UALI Finanzas" },
      {
        property: "og:description",
        content:
          "Aplicación de finanzas personales y educación financiera en compañía o equipo con seguimiento de presupuesto, deudas y gamificación.",
      },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      },
      { name: "theme-color", content: "#2EC4B6" },
      { name: "author", content: "UALI Finanzas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "UALI Finanzas" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    sessionStorage.removeItem('warmup_start_time');
    sessionStorage.removeItem('warmup_last_reload_time');
    sessionStorage.removeItem('warmup_failed_sent');
  } catch(e) {}
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: '__aistudio_warmup_succeeded' }, '*');
    }
  } catch(e) {}
  var mem = {};
  var dummy = {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function(k,v){ mem[k] = String(v); },
    removeItem: function(k){ delete mem[k]; },
    clear: function(){ mem = {}; },
    get length(){ return Object.keys(mem).length; },
    key: function(i){ return Object.keys(mem)[i] || null; }
  };
  var needsPatch = false;
  try {
    window.localStorage.setItem('__test_probe__', '1');
    window.localStorage.removeItem('__test_probe__');
  } catch(e) {
    needsPatch = true;
  }
  if (needsPatch) {
    try {
      if (typeof Window !== 'undefined' && Window.prototype) {
        Object.defineProperty(Window.prototype, 'localStorage', { get: function(){ return dummy; }, configurable: true, enumerable: true });
        Object.defineProperty(Window.prototype, 'sessionStorage', { get: function(){ return dummy; }, configurable: true, enumerable: true });
      }
    } catch(e1) {}
    try {
      Object.defineProperty(window, 'localStorage', { get: function(){ return dummy; }, configurable: true, enumerable: true });
      Object.defineProperty(window, 'sessionStorage', { get: function(){ return dummy; }, configurable: true, enumerable: true });
    } catch(e2) {}
  }
})();`,
          }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (getStoredTheme() === "dark") document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (!import.meta.env.PROD) {
      // En entorno de desarrollo (Google AI Studio): desregistrar Service Worker previo y purgar cachés obsoletas
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // En producción (PWA instalable): registrar con actualización inmediata y bypass de caché
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update();
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                installingWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch(() => {
        // Sin service worker la app sigue funcionando online
      });
  }, []);

  return (
    <DeviceProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: 1000 * 60 * 60 * 24,
          buster: "2",
        }}
        onSuccess={() => queryClient.resumePausedMutations()}
      >
        <AppGate />
        <Toaster position="top-center" richColors closeButton />
      </PersistQueryClientProvider>
    </DeviceProvider>
  );
}

function AppGate() {
  const { session, loading } = useSession();
  const [globalTxOpen, setGlobalTxOpen] = useState(false);
  const { isMobile } = useDeviceLayout();
  useSwipeNavigation();
  useGlobalTransactionSheet(() => setGlobalTxOpen(true));

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="size-11 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <p className="mt-4 text-xs font-bold text-muted-foreground animate-pulse tracking-wide uppercase">
          Cargando UALÍ Finanzas...
        </p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DesktopNav onOpenNewTx={() => setGlobalTxOpen(true)} />
      <div
        className={cn(
          "flex-1 w-full mx-auto transition-all",
          isMobile
            ? "max-w-full pb-[calc(76px+env(safe-area-inset-bottom,0px))]"
            : "max-w-4xl lg:max-w-6xl px-4 sm:px-6 pb-12 pt-3",
        )}
      >
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
      {isMobile && <BottomNav />}
      <OfflineIndicator />
      <TransactionSheet open={globalTxOpen} onClose={() => setGlobalTxOpen(false)} />
      <Celebration />
    </div>
  );
}

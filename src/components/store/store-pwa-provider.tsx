"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { PwaIosInstallDialog } from "@/components/pwa-ios-install-dialog";
import { useStoreSettings } from "@/lib/store-settings-context";
import { isIOSNonSafariUA } from "@/lib/is-ios-non-safari";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
};

type StorePwaContextValue = {
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  promptInstall: () => void;
};

const StorePwaContext = createContext<StorePwaContextValue>({
  isStandalone: false,
  isIOS: false,
  canInstall: false,
  promptInstall: () => {},
});

// Mismo truco que components/admin/pwa-provider.tsx: useSyncExternalStore en
// vez de useEffect+setState evita el parpadeo de hidratación (el primer
// render de cliente tiene que coincidir con el del server).
function subscribeNever() {
  return () => {};
}
function getIsIOSSnapshot() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function getIsIOSNonSafariSnapshot() {
  return isIOSNonSafariUA(navigator.userAgent);
}
function getServerSnapshotFalse() {
  return false;
}

function subscribeStandalone(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function getStandaloneSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function StorePwaProvider({ children }: { children: React.ReactNode }) {
  const { storeName } = useStoreSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const isIOS = useSyncExternalStore(subscribeNever, getIsIOSSnapshot, getServerSnapshotFalse);
  const isIOSNonSafari = useSyncExternalStore(subscribeNever, getIsIOSNonSafariSnapshot, getServerSnapshotFalse);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, getServerSnapshotFalse);

  useEffect(() => {
    // Scope "/" a propósito: cubre todo el storefront (/, /carrito,
    // /mi-cuenta, /pedidos, /perfil, etc.), no una sola página. El SW de
    // /admin registra el mismo archivo con scope "/admin", que gana sobre
    // este en las páginas del panel por ser el scope más específico.
    navigator.serviceWorker?.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("No se pudo registrar el service worker de la tienda", error);
    });

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setDeferredPrompt(null);
      return;
    }
    if (isIOS) setIosDialogOpen(true);
  }, [deferredPrompt, isIOS]);

  const canInstall = !isStandalone && (deferredPrompt !== null || isIOS);

  return (
    <StorePwaContext.Provider value={{ isStandalone, isIOS, canInstall, promptInstall }}>
      {children}
      <PwaIosInstallDialog
        open={iosDialogOpen}
        onOpenChange={setIosDialogOpen}
        title={`Instalar ${storeName}`}
        description="Agregá la app a tu pantalla de inicio en dos pasos."
        needsSafari={isIOSNonSafari}
      />
    </StorePwaContext.Provider>
  );
}

export function useStorePwa() {
  return useContext(StorePwaContext);
}

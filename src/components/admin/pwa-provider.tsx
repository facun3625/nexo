"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { PwaIosInstallDialog } from "@/components/pwa-ios-install-dialog";
import { isIOSNonSafariUA } from "@/lib/is-ios-non-safari";

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
};

type AdminPwaContextValue = {
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  promptInstall: () => void;
};

const AdminPwaContext = createContext<AdminPwaContextValue>({
  isStandalone: false,
  isIOS: false,
  canInstall: false,
  promptInstall: () => {},
});

// Lecturas de APIs que solo existen en el browser (navigator, matchMedia).
// useSyncExternalStore, no useEffect+setState: evita el "set-state-in-effect"
// del lint y, más importante, evita el parpadeo de hidratación — React
// fuerza el primer render del cliente a usar getServerSnapshot (false) y
// recién después actualiza, igual que el server.
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

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const isIOS = useSyncExternalStore(subscribeNever, getIsIOSSnapshot, getServerSnapshotFalse);
  const isIOSNonSafari = useSyncExternalStore(subscribeNever, getIsIOSNonSafariSnapshot, getServerSnapshotFalse);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getStandaloneSnapshot, getServerSnapshotFalse);

  useEffect(() => {
    // El scope se compara como prefijo de string literal: "/admin/" (con
    // barra) NO cubre la página "/admin" (el dashboard, justo donde aparece
    // el banner de notificaciones), así que ahí la página nunca quedaba
    // controlada y navigator.serviceWorker.ready esperaba para siempre.
    // Con scope "/admin" entran tanto "/admin" como "/admin/...", pero para
    // eso el script tiene que vivir en la raíz: un SW solo puede tomar un
    // scope dentro de su propia carpeta (/admin/sw.js estaba limitado a
    // "/admin/" y registrarlo más ancho tira SecurityError).
    navigator.serviceWorker?.register("/sw.js", { scope: "/admin" }).catch((error) => {
      console.error("No se pudo registrar el service worker del panel", error);
    });

    // Limpia el registro viejo en "/admin/" de quienes ya habían entrado
    // antes de este cambio: si queda, convive con el nuevo y controla las
    // subpáginas por ser el scope más específico.
    navigator.serviceWorker?.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        if (registration.scope.endsWith("/admin/")) registration.unregister();
      }
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
    <AdminPwaContext.Provider value={{ isStandalone, isIOS, canInstall, promptInstall }}>
      {children}
      <PwaIosInstallDialog open={iosDialogOpen} onOpenChange={setIosDialogOpen} needsSafari={isIOSNonSafari} />
    </AdminPwaContext.Provider>
  );
}

export function useAdminPwa() {
  return useContext(AdminPwaContext);
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Registra solamente navegaciones que llegaron a mostrarse en el navegador. */
export function PublicAnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const isPublicEstatePage =
      pathname === "/" ||
      pathname === "/propiedades" ||
      pathname.startsWith("/propiedades/") ||
      pathname.startsWith("/arquitectura/") ||
      [
        "/mapa",
        "/sobre-nosotros",
        "/contacto",
        "/alertas",
        "/favoritos",
      ].includes(pathname);
    if (!isPublicEstatePage || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

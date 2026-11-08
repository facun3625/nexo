import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/email/picture/"],
      // Panel, API y páginas personales: no tienen nada que indexar.
      disallow: [
        "/admin/",
        "/api/",
        "/agente",
        "/perfil",
        "/favoritos",
        "/mi-alquiler",
        "/login",
        "/recuperar-contrasena",
        "/restablecer-contrasena",
        "/cerrar-sesion",
        "/baja",
        "/qr/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}

import { cache } from "react";
import { prisma } from "@/lib/prisma";

import type { MaintenanceConfig } from "@/lib/maintenance-shared";

export { DEFAULT_MAINTENANCE_HTML, type MaintenanceConfig } from "@/lib/maintenance-shared";

const KEYS = ["maintenance_enabled", "maintenance_html"] as const;

export const getMaintenanceConfig = cache(async (tenantId: string): Promise<MaintenanceConfig> => {
  const rows = await prisma.settings.findMany({
    where: { tenantId, key: { in: [...KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.maintenance_enabled === "true",
    html: map.maintenance_html ?? null,
  };
});

// Rutas que siguen andando con el sitio en mantenimiento: el panel y todo
// lo necesario para que el equipo pueda entrar (login, recuperar clave) y
// la baja de mails (el link llega por correo y tiene que funcionar igual).
const ALLOWED_PREFIXES = [
  "/admin",
  "/login",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
  "/cerrar-sesion",
  "/baja",
];

export function isMaintenanceExempt(pathname: string) {
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}-`));
}

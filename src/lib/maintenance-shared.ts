// Sin imports de servidor: lo usan tanto el layout como el formulario
// (client component) del admin.
export type MaintenanceConfig = {
  enabled: boolean;
  html: string | null;
};

export const DEFAULT_MAINTENANCE_HTML =
  "<h2>Estamos haciendo mejoras</h2><p>El sitio vuelve a estar disponible en unas horas. Gracias por la paciencia.</p>";

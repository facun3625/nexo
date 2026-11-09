import { RichText } from "@/components/catalog/rich-text";
import { DEFAULT_MAINTENANCE_HTML } from "@/lib/maintenance-shared";

// Pantalla que reemplaza todo el sitio público mientras el modo
// mantenimiento está activo (Configuración → Mantenimiento).
export function MaintenanceScreen({
  storeName,
  logoUrl,
  logoHeight,
  html,
}: {
  storeName: string;
  logoUrl: string | null;
  logoHeight: number;
  html: string | null;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo puede venir de R2 o de /uploads
        <img
          src={logoUrl}
          alt={storeName}
          style={{ height: Math.max(logoHeight, 64) }}
          className="w-auto max-w-[80vw] object-contain"
        />
      ) : (
        <span className="text-3xl font-bold">{storeName}</span>
      )}
      <RichText html={html || DEFAULT_MAINTENANCE_HTML} className="max-w-xl text-base text-muted-foreground [&_h2]:text-2xl [&_h2]:text-foreground" />
    </main>
  );
}

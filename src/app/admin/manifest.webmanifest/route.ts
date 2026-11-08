import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// No es el archivo especial app/manifest.ts de Next (ese solo funciona en
// la raíz de app/) — es un Route Handler común que arma el mismo JSON a
// mano, servido en /admin/manifest.webmanifest. A propósito SIN
// requireTenantAdmin(): src/proxy.ts deja pasar esta ruta sin sesión (ver
// isPublicAdminAsset ahí) porque iOS Safari busca el ícono con un
// mecanismo propio que no manda la cookie — exigir login acá hacía que
// cayera al ícono genérico con la inicial del nombre en vez del logo real.
export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return new NextResponse("Tienda no encontrada", { status: 404 });
  const { storeName } = await getStoreSettings(tenant.id);

  const manifest = {
    name: `${storeName} — Panel`,
    short_name: storeName,
    start_url: "/admin",
    // Sin barra final a propósito: el scope se compara como prefijo literal,
    // así que "/admin/" dejaría fuera al propio start_url "/admin".
    scope: "/admin",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/admin/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/admin/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/admin/icon/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}

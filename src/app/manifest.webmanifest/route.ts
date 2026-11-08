import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// Manifest de la PWA del storefront — mismo patrón que
// admin/manifest.webmanifest/route.ts (Route Handler a mano, no el archivo
// especial app/manifest.ts, ver ese archivo para el porqué). start_url/scope
// en la raíz porque acá cubre todo el storefront (/, /carrito, /mi-cuenta,
// /pedidos, /perfil, etc.), no solo una sección.
export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return new NextResponse("Tienda no encontrada", { status: 404 });
  const { storeName } = await getStoreSettings(tenant.id);

  const manifest = {
    name: storeName,
    short_name: storeName,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}

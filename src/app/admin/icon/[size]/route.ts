import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { renderIcon, loadIconSource, FALLBACK_ICON } from "@/lib/tenant-icon";

// A propósito SIN requireTenantAdmin(): src/proxy.ts deja pasar esta ruta
// sin sesión (ver isPublicAdminAsset ahí) porque iOS Safari busca el
// apple-touch-icon con un mecanismo propio que no manda la cookie — el
// nombre y el logo de la tienda ya son públicos en la tienda, no hace
// falta exigir login para esto.
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const tenant = await getCurrentTenant();
  if (!tenant) return new NextResponse("Tienda no encontrada", { status: 404 });
  const { size: rawSize } = await params;

  const isMaskable = rawSize.endsWith("-maskable");
  const px = parseInt(isMaskable ? rawSize.replace("-maskable", "") : rawSize, 10);
  if (!Number.isFinite(px) || px <= 0 || px > 1024) {
    return new NextResponse("Tamaño inválido", { status: 400 });
  }

  const { logoUrl, faviconUrl } = await getStoreSettings(tenant.id);

  let png: Buffer;
  try {
    png = await renderIcon(await loadIconSource(faviconUrl ?? logoUrl), px, isMaskable);
  } catch {
    png = await renderIcon(FALLBACK_ICON, px, isMaskable);
  }

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

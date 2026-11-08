import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { renderIcon, loadIconSource, FALLBACK_ICON } from "@/lib/tenant-icon";

// Ícono de la PWA del storefront (mismo patrón que admin/icon/[size]/route.ts,
// ver ese archivo para el porqué de no exigir sesión acá).
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

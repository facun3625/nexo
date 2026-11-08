import sharp from "sharp";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// Logo del sitio en PNG para el encabezado de los mails (Gmail no muestra
// SVG). Alto fijo de 88px = 44px a doble densidad.
export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return new Response("Not found", { status: 404 });
  const { logoUrl } = await getStoreSettings(tenant.id);
  if (!logoUrl) return new Response("Not found", { status: 404 });

  const upstream = await fetch(logoUrl);
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });
  const png = await sharp(Buffer.from(await upstream.arrayBuffer()), { density: 300 })
    .resize({ height: 88, fit: "inside" })
    .png()
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}

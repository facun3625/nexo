import path from "node:path";
import sharp from "sharp";

export const ICON_BG = { r: 255, g: 255, b: 255, alpha: 1 };
export const FALLBACK_ICON = path.join(process.cwd(), "public", "favicon2.png");

// Compartido entre el ícono del panel admin y el del storefront: mismo
// resize "contain" para el caso normal, y para maskable el logo va al 60%
// centrado sobre un lienzo sólido (zona segura que los launchers de Android
// no recortan al aplicar la máscara círculo/squircle/gota).
// El favicon/logo puede ser una URL pública de R2 (https://...) o un path
// local bajo /public (/uploads/...). sharp no lee URLs, así que las remotas
// se bajan a un Buffer. Se prefiere el favicon (cuadrado) sobre el logo
// (suele ser horizontal y en un ícono cuadrado queda chiquito).
export async function loadIconSource(url: string | null): Promise<string | Buffer> {
  if (!url) return FALLBACK_ICON;
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`No se pudo bajar el ícono (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  return path.join(process.cwd(), "public", url);
}

export async function renderIcon(source: string | Buffer, px: number, maskable: boolean): Promise<Buffer> {
  if (!maskable) {
    return sharp(source).resize(px, px, { fit: "contain", background: ICON_BG }).png().toBuffer();
  }

  const inner = Math.round(px * 0.6);
  const logo = await sharp(source).resize(inner, inner, { fit: "contain", background: ICON_BG }).png().toBuffer();

  return sharp({ create: { width: px, height: px, channels: 4, background: ICON_BG } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

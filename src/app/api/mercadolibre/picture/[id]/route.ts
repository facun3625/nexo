import sharp from "sharp";
import { prisma } from "@/lib/prisma";

// Foto de una propiedad en JPG para Mercado Libre: ML descarga las fotos de
// la URL que le pasamos al publicar, y las nuestras están en WEBP. Las
// fotos ya son públicas (R2), así que no hace falta sesión.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.estateMedia.findUnique({ where: { id }, select: { url: true } });
  if (!media) return new Response("Not found", { status: 404 });

  const upstream = await fetch(media.url);
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });
  const jpeg = await sharp(Buffer.from(await upstream.arrayBuffer()))
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

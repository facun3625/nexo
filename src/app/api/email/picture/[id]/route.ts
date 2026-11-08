import sharp from "sharp";
import { prisma } from "@/lib/prisma";

// Foto de una propiedad u obra en JPG para los mails: Outlook y otros
// clientes no muestran WEBP. Las fotos ya son públicas, no hace falta sesión.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media =
    (await prisma.estateMedia.findUnique({ where: { id }, select: { url: true } })) ??
    (await prisma.estateDevelopmentImage.findUnique({ where: { id }, select: { url: true } }));
  if (!media) return new Response("Not found", { status: 404 });

  const upstream = await fetch(media.url);
  if (!upstream.ok) return new Response("Upstream error", { status: 502 });
  const jpeg = await sharp(Buffer.from(await upstream.arrayBuffer()))
    .rotate()
    .resize(1200, 800, { fit: "cover", position: "attention" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=604800" },
  });
}

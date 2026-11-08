import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

// Next indexa public/ una sola vez, al arrancar el server: cualquier archivo
// subido después (todas las fotos que carga una tienda) da 404 hasta el
// próximo reinicio. Por eso los uploads no se sirven como estáticos sino por
// esta ruta, que lee del disco en cada request. next.config.ts reescribe
// /uploads/* hacia acá, así las URLs ya guardadas en la base no cambian.
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Resolver y confirmar que el resultado sigue dentro de public/uploads —
  // sin esto, un ".." en la URL leería cualquier archivo del server.
  const filePath = path.resolve(UPLOADS_ROOT, ...segments);
  if (filePath !== UPLOADS_ROOT && !filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return new NextResponse("Not found", { status: 404 });

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(info.size),
      // Esto es contenido que subió un tercero, servido desde nuestro propio
      // origen. "sandbox" lo deja en un origen opaco: un SVG con <script>
      // adentro (los nuevos ya no se pueden subir, pero puede haber alguno
      // viejo) no ejecuta nada si lo abren directo, y sigue viéndose igual
      // dentro de un <img>. "nosniff" evita que el navegador adivine un tipo
      // distinto del que declaramos.
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
      // El nombre de archivo es un UUID nuevo por subida, así que el
      // contenido de una URL nunca cambia: se puede cachear para siempre.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

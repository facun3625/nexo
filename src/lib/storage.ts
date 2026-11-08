import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import DOMPurify from "isomorphic-dompurify";

import { ActionError } from "@/lib/action-error";

// R2 es compatible con la API de S3 — mismo cliente, solo cambia el
// endpoint. "auto" es la región que pide Cloudflare para R2.
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

// La extensión sale del tipo declarado, nunca del nombre del archivo. Antes
// se tomaba de file.name, que lo elige quien sube: alcanzaba con llamarlo
// "comprobante.svg" para que quedara servido como image/svg+xml desde
// nuestro propio origen, y un SVG puede traer <script> adentro. Un tipo que
// no esté acá se rechaza en vez de caer a .jpg. SVG sí se acepta (útil para
// logos), pero se sanitiza con DOMPurify antes de subirse — ver más abajo.
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const CONTENT_TYPE_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSION_BY_TYPE).map(([type, ext]) => [ext, type]),
);

// Foto de celular sin comprimir: 4-8 MB. A escala (miles de propiedades ×
// varias fotos cada una) eso es plata de almacenamiento tirada. GIF (se
// perdería la animación) y PDF/video quedan afuera — todo lo demás se
// reduce a un tamaño máximo razonable de pantalla y se pasa a WebP, que a
// igual calidad visual pesa una fracción de JPG/PNG.
const COMPRESSIBLE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

async function uploadToR2(buffer: Buffer, folder: string, filename: string): Promise<string> {
  const key = `${folder}/${filename}`;
  const ext = filename.slice(filename.lastIndexOf("."));
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
    }),
  );
  return `${PUBLIC_URL}/${key}`;
}

export async function saveUploadedFile(file: File, folder: string): Promise<string> {
  const type = file.type.toLowerCase();
  const ext = EXTENSION_BY_TYPE[type];
  if (!ext) {
    throw new ActionError(
      "Ese tipo de archivo no está permitido. Usá JPG, PNG, WEBP, GIF, PDF o un video MP4.",
    );
  }
  if (type === "image/svg+xml") {
    const raw = await file.text();
    // USE_PROFILES: {svg: true} deja pasar los tags/atributos propios de
    // SVG pero igual saca <script>, on*="" y href javascript: — lo que
    // usábamos como excusa para rechazar el tipo entero.
    const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { svg: true, svgFilters: true } });
    return uploadToR2(Buffer.from(clean, "utf-8"), folder, `${randomUUID()}.svg`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (COMPRESSIBLE_TYPES.has(type)) {
    const compressed = await sharp(buffer)
      .rotate() // respeta la orientación EXIF de la cámara antes de perderla al recomprimir
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return uploadToR2(compressed, folder, `${randomUUID()}.webp`);
  }

  return uploadToR2(buffer, folder, `${randomUUID()}${ext}`);
}

// El favicon se ve mejor recortado a un cuadrado con esquinas redondeadas
// (como el ícono de una app) en vez del cuadrado a filo que sube el admin —
// eso no se puede lograr con CSS porque la pestaña del navegador renderiza
// el archivo tal cual. Se recorta a cuadrado, se redondea con una máscara
// SVG y se exporta a PNG para conservar la transparencia en las esquinas.
export async function saveFaviconWithRoundedCorners(
  file: File,
  folder: string,
  radiusPercent = 25,
): Promise<string> {
  const size = 256;
  const radius = Math.round((size * radiusPercent) / 100);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/></svg>`,
  );

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const rounded = await sharp(inputBuffer)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const filename = `${randomUUID()}.png`;
  return uploadToR2(rounded, folder, filename);
}

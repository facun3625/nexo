// Paso 1 de la migración del WordPress viejo de Nexo (theme Houzez).
// Corre en la máquina local, donde están los archivos:
//   - export de propiedades  (Herramientas → Exportar → Propiedades)
//   - export de medios       (Herramientas → Exportar → Medios) — mapea el
//     ID de cada adjunto a su archivo, que el export de propiedades no trae
//   - los zips de wp-content/uploads por año (2016.zip … 2026.zip)
//
// Saca de los zips las fotos de las propiedades publicadas, las pasa a WebP
// y las sube al bucket R2, y deja todo en prisma/seed-data/nexo-wp-import.json.
// Ese JSON (solo datos + URLs públicas) es lo que se commitea y lo que lee
// el paso 2 (import.ts) en cualquier base, incluida la de producción — así
// no hace falta llevar los zips al servidor.
//
// Las keys en R2 son fijas por adjunto (wp-<id>.webp): re-correrlo no
// duplica archivos, saltea los que ya están subidos.
//
// Uso:
//   npx tsx prisma/wp-nexo/build.ts             (sube a R2 y escribe el JSON)
//   DRY_RUN=1 npx tsx prisma/wp-nexo/build.ts   (no sube nada; igual escribe el JSON para revisarlo)
// Rutas configurables: WP_PROPERTIES_XML, WP_MEDIA_XML, WP_UPLOADS_DIR.
import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const DOWNLOADS = path.join(os.homedir(), "Downloads");
const PROPERTIES_XML = process.env.WP_PROPERTIES_XML ?? path.join(DOWNLOADS, "inmobiliaria.WordPress.2026-11-03.xml");
const MEDIA_XML = process.env.WP_MEDIA_XML ?? path.join(DOWNLOADS, "inmobiliaria.WordPress.2026-11-03 (1).xml");
const UPLOADS_DIR = process.env.WP_UPLOADS_DIR ?? DOWNLOADS;
const OUT_PATH = path.join(__dirname, "../seed-data/nexo-wp-import.json");
const TENANT_ID = "nexo-tenant";
const R2_FOLDER = `${TENANT_ID}/properties`;
const DRY_RUN = Boolean(process.env.DRY_RUN);

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

// ---------------- Parsing del XML (WXR) ----------------

function metaValues(item: string, key: string): string[] {
  const re = new RegExp(
    `<wp:meta_key><!\\[CDATA\\[${key}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`,
    "g",
  );
  return [...item.matchAll(re)].map((m) => m[1]);
}
const metaValue = (item: string, key: string) => metaValues(item, key)[0] ?? null;
function categories(item: string, domain: string): string[] {
  const re = new RegExp(`<category domain="${domain}"[^>]*><!\\[CDATA\\[([^\\]]*)\\]\\]></category>`, "g");
  return [...item.matchAll(re)].map((m) => decodeEntities(m[1]));
}
function cdataField(item: string, tag: string): string | null {
  const m = item.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`));
  return m ? m[1] : null;
}
function plainField(item: string, tag: string): string | null {
  const m = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1] : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

// La descripción en la app es texto plano (se muestra con white-space: pre-wrap).
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|ul)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/ /g, " ")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// "250,88" / "402.96" / "300,85" → número. Los valores de WP son cortos y
// sin separador de miles, así que la coma es siempre decimal.
function parseNumber(raw: string | null): number | null {
  if (!raw) return null;
  const m = raw.replace(/m[²2]/gi, "").match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function titleCase(s: string): string {
  const keepUpper = new Set(["CAM", "PH", "SUM", "II", "IV", "B"]);
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.-?$/, "")
    .split(" ")
    .map((w, i, words) => {
      if (keepUpper.has(w.toUpperCase())) return w.toUpperCase();
      if (/^\d/.test(w) || w.length <= 1) return w;
      const lower = w.toLocaleLowerCase("es");
      const afterDash = i === 0 || words[i - 1] === "-";
      if (!afterDash && ["de", "del", "la", "las", "los", "y", "en", "esq."].includes(lower)) return lower;
      return lower[0].toLocaleUpperCase("es") + lower.slice(1);
    })
    .join(" ")
    .replace(/^./, (c) => c.toLocaleUpperCase("es"));
}

// ---------------- Mapeos de catálogo ----------------

// Primer tipo de esta lista presente en las categorías gana.
const TYPE_PRIORITY: { match: string; mapTo: string }[] = [
  { match: "cabañas", mapTo: "Cabaña" },
  { match: "casa quinta - countries", mapTo: "Casa Quinta" },
  { match: "casa", mapTo: "Casa" },
  { match: "departamento", mapTo: "Departamento" },
  { match: "oficinas", mapTo: "Oficina" },
  { match: "cochera", mapTo: "Cochera" },
  { match: "cocheras", mapTo: "Cochera" },
  { match: "terreno", mapTo: "Terreno" },
];

const NEIGHBORHOOD_FIX: Record<string, string> = {
  "Bulevard Galvez": "Bulevar Gálvez",
  "Santo Tome": "",
  "Puerto de Santa Fe": "Puerto",
};

// Correcciones puntuales por ID de WordPress: datos que en el sitio viejo
// faltaban o estaban mal cargados (sacados de la descripción de cada aviso).
type Override = Partial<{
  title: string;
  propertyType: string;
  city: string;
  operation: "SALE" | "RENT";
  price: number;
  bedrooms: number;
  coveredArea: number;
  totalArea: number;
}>;
const OVERRIDES: Record<string, Override> = {
  "8051": { title: "CAM de la Legislatura | 3 de Febrero 3174" },
  "9922": { city: "Santa Fe" }, // Bv. Gálvez 1846
  "11122": { title: "Obispo Príncipe esq. Tacuarí" }, // typo en el título de WP
  "11282": { totalArea: 800, city: "San José del Rincón" }, // Ruta 1 km 10: el texto dice 800 m² de terreno (WP tenía 1600)
  "11323": { title: "Bv. Gálvez 1000" },
  "12367": { city: "San José del Rincón" }, // Ruta 1 km 8 - Los Colibríes
  "12387": { bedrooms: 2, coveredArea: 100.21, totalArea: 439.8 }, // Las Lechucitas: datos del texto
  "12716": { bedrooms: 3, coveredArea: 129, totalArea: 250.88 }, // Gral. Paz 8100: WP tenía 129 dormitorios
  "12853": { city: "Santa Fe" }, // Alvear 8267
  "12875": { propertyType: "Terreno", city: "Grutly", operation: "SALE", price: 10000 }, // San Juan Bautista
  "12877": { price: 35000 }, // Loteo del Sol: precio contado del texto
  "13225": { city: "Recreo" }, // Recreo Sur
  "13236": { title: "1° Junta 2757 - Cochera" }, // sin título en WP
  "13765": { propertyType: "Departamento", operation: "RENT" }, // Castellanos 1500: sin categorías en WP
};

// Coordenada por defecto de Houzez (Miami): si quedó esa, no se cargó ubicación real.
const isRealCoord = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat < -20 && lat > -40 && lng < -55 && lng > -70;

// ---------------- Medios ----------------

function loadMediaMap(): Map<string, string> {
  const xml = fs.readFileSync(MEDIA_XML, "utf-8");
  const map = new Map<string, string>();
  for (const item of xml.split("<item>").slice(1)) {
    const id = plainField(item, "wp:post_id");
    const url = cdataField(item, "wp:attachment_url");
    if (id && url) map.set(id, url);
  }
  return map;
}

// "https://…/wp-content/uploads/2019/07/012.jpg" → "2019/07/012.jpg"
const uploadsPath = (url: string) => decodeURIComponent(url.split("/wp-content/uploads/")[1] ?? "");

function readFromZips(relPath: string): Buffer {
  const year = relPath.slice(0, 4);
  const zip = path.join(UPLOADS_DIR, `${year}.zip`);
  return execFileSync("unzip", ["-p", zip, relPath], { maxBuffer: 200 * 1024 * 1024 });
}

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

async function existsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

const stats = { uploaded: 0, skipped: 0, failed: 0 };

async function migrateImage(relPath: string, keyName: string): Promise<string | null> {
  const key = `${R2_FOLDER}/${keyName}.webp`;
  const url = `${PUBLIC_URL}/${key}`;
  if (DRY_RUN) return url;
  if (await existsInR2(key)) {
    stats.skipped++;
    return url;
  }
  try {
    const original = readFromZips(relPath);
    const webp = await sharp(original)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: webp, ContentType: "image/webp" }));
    stats.uploaded++;
    return url;
  } catch (err) {
    stats.failed++;
    console.error(`  ! ${relPath}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function mapPool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------------- Main ----------------

export type ImportedProperty = {
  wpId: string;
  code: string;
  title: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  coveredArea: number | null;
  totalArea: number | null;
  latitude: number | null;
  longitude: number | null;
  mapAddress: string | null;
  videoUrl: string | null;
  floorPlanUrl: string | null;
  featured: boolean;
  createdAt: string;
  listing: {
    operation: "SALE" | "RENT";
    currency: "USD" | "ARS";
    price: number | null;
    showPrice: boolean;
    status: "AVAILABLE" | "RESERVED";
  };
  media: string[];
};

async function main() {
  const media = loadMediaMap();
  const xml = fs.readFileSync(PROPERTIES_XML, "utf-8");
  const items = xml
    .split("<item>")
    .slice(1)
    .filter((i) => i.includes("<wp:post_type><![CDATA[property]]></wp:post_type>"))
    .filter((i) => cdataField(i, "wp:status") === "publish");
  console.log(`${items.length} propiedades publicadas en el export. ${media.size} adjuntos en el export de medios.`);

  const result: ImportedProperty[] = [];

  for (const item of items) {
    const wpId = plainField(item, "wp:post_id")!;
    const ov = OVERRIDES[wpId] ?? {};
    const rawTypes = categories(item, "property_type").map((t) => t.toLowerCase());
    const statuses = categories(item, "property_status");
    const cities = categories(item, "property_city");
    const areas = categories(item, "property_area");
    const content = cdataField(item, "content:encoded") ?? "";
    const description = htmlToText(content);

    const propertyType =
      ov.propertyType ?? TYPE_PRIORITY.find((r) => rawTypes.includes(r.match))?.mapTo ?? "Casa";
    const operation =
      ov.operation ?? (statuses.includes("Alquiler") || /se\s+alquila/i.test(description) ? "RENT" : "SALE");
    const city = ov.city ?? cities[0] ?? "Santa Fe";
    let neighborhood = areas[0] ?? "";
    if (neighborhood in NEIGHBORHOOD_FIX) neighborhood = NEIGHBORHOOD_FIX[neighborhood];
    if (neighborhood.toLowerCase() === city.toLowerCase()) neighborhood = "";

    const rawTitle = decodeEntities(cdataField(item, "title") ?? "").trim();
    const title = ov.title ?? titleCase(rawTitle || metaValue(item, "fave_property_address") || `Propiedad ${wpId}`);

    const price = ov.price ?? parseNumber(metaValue(item, "fave_property_price"));
    const [lat, lng] = (metaValue(item, "fave_property_location") ?? "").split(",").map((s) => parseFloat(s));
    const hasCoords = isRealCoord(lat, lng) && metaValue(item, "fave_property_map") !== "0";

    let coveredArea = ov.coveredArea ?? parseNumber(metaValue(item, "fave_property_size"));
    let totalArea = ov.totalArea ?? parseNumber(metaValue(item, "fave_property_land"));
    if (propertyType === "Terreno" && totalArea == null && coveredArea != null) {
      totalArea = coveredArea;
      coveredArea = null;
    }

    // Fotos: portada primero, después la galería en el orden de WP, sin repetidos.
    const thumb = metaValue(item, "_thumbnail_id");
    const imageIds = [...new Set([...(thumb ? [thumb] : []), ...metaValues(item, "fave_property_images")])];
    const missing = imageIds.filter((id) => !media.has(id));
    if (missing.length) console.warn(`  ! ${wpId}: adjuntos sin URL en el export de medios: ${missing.join(", ")}`);

    console.log(`[NX-${wpId}] ${title} — ${operation} ${price ?? "s/precio"} — ${propertyType} — ${city}${neighborhood ? ` / ${neighborhood}` : ""} — ${imageIds.length} fotos`);

    const mediaUrls = (
      await mapPool(
        imageIds.filter((id) => media.has(id)),
        6,
        (id) => migrateImage(uploadsPath(media.get(id)!), `wp-${id}`),
      )
    ).filter((u): u is string => Boolean(u));

    // Plano: el primero de floor_plans (meta serializada de PHP con URLs).
    let floorPlanUrl: string | null = null;
    const plans = metaValue(item, "floor_plans");
    const planUrl = plans?.match(/https?:\/\/[^"]+\/wp-content\/uploads\/[^"]+/)?.[0];
    if (planUrl) {
      floorPlanUrl = await migrateImage(uploadsPath(planUrl), `wp-plan-${wpId}`);
    }

    const video = metaValue(item, "fave_video_url");

    result.push({
      wpId,
      code: `NX-${wpId}`,
      title,
      description,
      propertyType,
      address: (metaValue(item, "fave_property_address") ?? "").trim().replace(/\.-?$/, ""),
      city,
      neighborhood,
      bedrooms: ov.bedrooms ?? Math.round(parseNumber(metaValue(item, "fave_property_bedrooms")) ?? 0),
      bathrooms: Math.round(parseNumber(metaValue(item, "fave_property_bathrooms")) ?? 0),
      garages: Math.round(parseNumber(metaValue(item, "fave_property_garage")) ?? 0),
      coveredArea,
      totalArea,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,
      mapAddress: hasCoords ? metaValue(item, "fave_property_map_address") : null,
      videoUrl: video ? (video.startsWith("http") ? video : `https://${video}`) : null,
      floorPlanUrl,
      featured: metaValue(item, "fave_featured") === "1",
      createdAt: new Date(`${cdataField(item, "wp:post_date_gmt")}Z`.replace(" ", "T")).toISOString(),
      listing: {
        operation,
        currency: operation === "RENT" ? "ARS" : "USD",
        price,
        showPrice: price != null,
        status: /R\s?E\s?S\s?E\s?R\s?V\s?A\s?D/i.test(description.slice(0, 40)) ? "RESERVED" : "AVAILABLE",
      },
      media: mediaUrls,
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2) + "\n");
  console.log(
    `\n${DRY_RUN ? "[DRY RUN] " : ""}${result.length} propiedades → ${path.relative(process.cwd(), OUT_PATH)}. ` +
      `Imágenes: ${stats.uploaded} subidas, ${stats.skipped} ya estaban, ${stats.failed} fallaron.`,
  );
  if (stats.failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

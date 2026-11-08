// Migra las propiedades del sitio viejo de WordPress (theme Houzez) al
// catálogo de Gerreli. Fuente: prisma/seed-data/wordpress-export.xml
// (Herramientas → Exportar de WordPress). Reusable: se puede correr de
// nuevo contra cualquier base apuntada por DATABASE_URL (local u, una vez
// deployado, producción) — no depende de ninguna base ya migrada.
//
// Uso:
//   npx tsx prisma/migrate-wordpress.ts            (inserta de verdad)
//   DRY_RUN=1 npx tsx prisma/migrate-wordpress.ts   (solo imprime, no escribe nada)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "../src/lib/prisma";

const TENANT_ID = "gerelli-tenant";
const SITE_ORIGIN = "https://gerellicorrenti.com.ar";
const XML_PATH = path.join(__dirname, "seed-data/wordpress-export.xml");
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
function metaValue(item: string, key: string): string | null {
  return metaValues(item, key)[0] ?? null;
}
function categories(item: string, domain: string): string[] {
  const re = new RegExp(`<category domain="${domain}"[^>]*><!\\[CDATA\\[([^\\]]*)\\]\\]></category>`, "g");
  return [...item.matchAll(re)].map((m) => m[1]);
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

// ---------------- Parsing de números en texto libre ----------------

// Áreas (size/land): números chicos, la coma es decimal ("12,50 m2" -> 12.5).
// "m2"/"m²" tienen un dígito pegado a una letra ("m2") que si no se saca
// antes, el regex de números lo cuenta como una medida más (ej. "300 m2 y
// 400 m2" daría [300, 2, 400, 2] en vez de [300, 400]).
function stripAreaUnit(text: string): string {
  return text.replace(/m[²2]/gi, "");
}

function parseAreaNumber(text: string | null): number | null {
  if (!text) return null;
  const m = stripAreaUnit(text).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// Cuando un mismo post describe varias unidades (ej. "2 lotes contiguos ...
// 300 m2 y 400 m2"), hay más de un número en el texto — se devuelven todos,
// en orden, para poder emparejarlos con cada precio.
function parseAllAreaNumbers(text: string | null): number[] {
  if (!text) return [];
  return [...stripAreaUnit(text).matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => parseFloat(m[1].replace(",", ".")));
}

// Precios: formato argentino con punto de miles ("U$S 90.000" -> 90000).
// Puede venir más de un precio separados por "/" (ej: dos lotes en un mismo post).
function parsePrices(text: string | null): number[] {
  if (!text) return [];
  return text
    .split("/")
    .map((part) => {
      const m = part.match(/[\d.,]+/);
      if (!m) return null;
      // saca separadores de miles (punto o coma seguidos de exactamente 3 dígitos)
      const raw = m[0].replace(/[.,](?=\d{3}(\D|$))/g, "");
      const n = parseFloat(raw.replace(",", "."));
      return Number.isFinite(n) ? n : null;
    })
    .filter((n): n is number => n != null);
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ---------------- Catálogo / mapeos ----------------

// Orden de prioridad: el primer tipo real de esta lista que aparezca en las
// categorías de la propiedad gana. "A refaccionar"/"Desarrollos" no son
// tipos, son condición/etiqueta — se ignoran acá y quedan solo como nota en
// la descripción.
const TYPE_PRIORITY: { match: string[]; mapTo: string }[] = [
  { match: ["casa quinta"], mapTo: "Casa Quinta" },
  { match: ["casa", "casa interna"], mapTo: "Casa" },
  { match: ["departamento", "departamento interno"], mapTo: "Departamento" },
  { match: ["local o salón", "local o salon"], mapTo: "Local" },
  { match: ["oficina"], mapTo: "Oficina" },
  { match: ["galpón", "galpon"], mapTo: "Galpón" },
  { match: ["cochera"], mapTo: "Cochera" },
  { match: ["terreno"], mapTo: "Terreno" },
];

function resolvePropertyType(rawTypes: string[]): string {
  const normalized = rawTypes.map((t) => t.toLowerCase());
  for (const rule of TYPE_PRIORITY) {
    if (rule.match.some((m) => normalized.includes(m))) return rule.mapTo;
  }
  return rawTypes[0] ?? "Casa";
}

const NEIGHBORHOOD_MAP: Record<string, string> = {
  candioti: "Candioti Norte",
  "angel gallardo": "Ángel Gallardo",
  guadalupe: "Guadalupe",
  "arroyo leyes": "Arroyo Leyes",
  sur: "Sur",
  countries: "Countries",
  "sargento cabral": "Sargento Cabral",
};

function resolveNeighborhood(rawAreas: string[], title: string): string {
  if (rawAreas.length > 0) {
    const key = rawAreas[0].toLowerCase().trim();
    return NEIGHBORHOOD_MAP[key] ?? titleCase(rawAreas[0]);
  }
  // Único caso sin taxonomía de zona en los datos reales: se extrae del título.
  if (/nueva esperanza/i.test(title)) return "Nueva Esperanza";
  return "";
}

// ---------------- Imágenes ----------------

type WpMedia = { source_url: string; title: { rendered: string }; mime_type: string };

async function fetchMediaInfo(id: string): Promise<WpMedia | null> {
  try {
    const res = await fetch(`${SITE_ORIGIN}/wp-json/wp/v2/media/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as WpMedia;
  } catch {
    return null;
  }
}

const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 82;

async function uploadImageToR2(sourceUrl: string, folder: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(buffer)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    const key = `${folder}/${randomUUID()}.webp`;
    if (!DRY_RUN) {
      await r2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: webp, ContentType: "image/webp" }));
    }
    return `${PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error(`  ! no se pudo migrar imagen ${sourceUrl}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ---------------- Main ----------------

type ParsedProperty = {
  wpId: string;
  title: string;
  description: string;
  published: boolean;
  propertyType: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  coveredArea: number | null;
  totalArea: number | null;
  // Todas las superficies mencionadas en el texto, en orden — se usan para
  // emparejar con cada precio cuando hay más de una unidad en el mismo post
  // (ver prices). Si solo hay un valor, coinciden con covered/totalArea.
  allSizeNumbers: number[];
  allLandNumbers: number[];
  latitude: number | null;
  longitude: number | null;
  imageIds: string[];
  prices: number[]; // uno o dos (lotes combinados)
};

function parseProperty(item: string): ParsedProperty {
  const wpId = plainField(item, "wp:post_id") ?? "";
  const title = decodeEntities(cdataField(item, "title") ?? "(sin título)");
  const contentHtml = cdataField(item, "content:encoded") ?? "";
  const status = cdataField(item, "wp:status") ?? "";

  const rawTypes = categories(item, "property_type");
  const rawAreas = categories(item, "property_area");
  const labels = categories(item, "property_label");

  const sizeRaw = metaValue(item, "fave_property_size");
  const landRaw = metaValue(item, "fave_property_land");
  const bedroomsRaw = metaValue(item, "fave_property_bedrooms");
  const bathroomsRaw = metaValue(item, "fave_property_bathrooms");
  const garageRaw = metaValue(item, "fave_property_garage");
  const priceRaw = metaValue(item, "fave_property_price");
  const location = metaValue(item, "fave_property_location"); // "lat,lng,zoom"
  const mapAddress = metaValue(item, "fave_property_map_address");
  const directAddress = metaValue(item, "fave_property_address");

  // El dato está repartido de forma inconsistente entre "size" y "land"
  // según quién lo haya cargado (a veces "size" es m² cubiertos y "land" el
  // terreno, a veces al revés, a veces solo uno de los dos existe). Se
  // prioriza: si el texto menciona "cubiert" ese es coveredArea; si
  // menciona "terreno" ese es totalArea. Si no hay pistas, "land" = total,
  // "size" = cubierta (es el caso más común en los datos reales).
  let coveredArea = parseAreaNumber(sizeRaw);
  let totalArea = parseAreaNumber(landRaw);
  if (sizeRaw && /terreno/i.test(sizeRaw)) [coveredArea, totalArea] = [totalArea, parseAreaNumber(sizeRaw)];
  if (landRaw && /cubiert/i.test(landRaw)) [coveredArea, totalArea] = [parseAreaNumber(landRaw), coveredArea];
  if (totalArea == null && coveredArea != null && rawTypes.includes("Terreno")) {
    // Para un terreno sin "land", el único número que hay (size) es la
    // superficie total del lote, no "cubierta" (no hay construcción).
    totalArea = coveredArea;
    coveredArea = null;
  }

  const [lat, lng] = (location ?? "").split(",").map((s) => parseFloat(s.trim()));

  const noteParts: string[] = [];
  if (labels.includes("Desarrollos")) noteParts.push("A estrenar / desarrollo nuevo (dato original del sitio).");
  if (rawTypes.includes("A refaccionar")) noteParts.push("A refaccionar (dato original del sitio).");
  if (status === "houzez_sold") noteParts.push("Marcada como VENDIDA en el sitio anterior — revisar antes de publicar.");

  const description = [htmlToText(contentHtml), noteParts.length ? `\n\n— ${noteParts.join(" ")}` : ""].join("").trim();

  return {
    wpId,
    title,
    description,
    published: status === "publish",
    propertyType: resolvePropertyType(rawTypes),
    neighborhood: resolveNeighborhood(rawAreas, title),
    address: directAddress?.trim() || mapAddress?.split(",")[0]?.trim() || "",
    bedrooms: bedroomsRaw ? Math.round(parseAreaNumber(bedroomsRaw) ?? 0) : 0,
    bathrooms: bathroomsRaw ? Math.round(parseAreaNumber(bathroomsRaw) ?? 0) : 0,
    garages: garageRaw ? Math.round(parseAreaNumber(garageRaw) ?? 0) : 0,
    coveredArea,
    totalArea,
    allSizeNumbers: parseAllAreaNumbers(sizeRaw),
    allLandNumbers: parseAllAreaNumbers(landRaw),
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lng) ? lng : null,
    imageIds: metaValues(item, "fave_property_images"),
    prices: parsePrices(priceRaw),
  };
}

async function main() {
  const xml = fs.readFileSync(XML_PATH, "utf-8");
  const items = xml.split("<item>").slice(1);
  const propertyItems = items.filter((i) => i.includes("<wp:post_type><![CDATA[property]]></wp:post_type>"));
  console.log(`Encontradas ${propertyItems.length} propiedades en el XML.`);

  const existingTypes = new Set((await prisma.estatePropertyType.findMany({ where: { tenantId: TENANT_ID } })).map((t) => t.name));
  const existingNeighborhoods = new Set((await prisma.estateNeighborhood.findMany({ where: { tenantId: TENANT_ID } })).map((n) => n.name));
  const existingCities = new Set((await prisma.estateCity.findMany({ where: { tenantId: TENANT_ID } })).map((c) => c.name));

  let code = 1;
  let created = 0;
  let skipped = 0;

  for (const item of propertyItems) {
    const parsed = parseProperty(item);
    if (parsed.prices.length === 0) {
      console.warn(`- sin precio, se saltea: ${parsed.title}`);
      skipped++;
      continue;
    }

    // Si hay dos precios en el mismo post (ej. "2 lotes contiguos", cada uno
    // con el suyo), se crean dos propiedades separadas — una por unidad.
    const multi = parsed.prices.length > 1;
    for (const [index, price] of parsed.prices.entries()) {
      const suffix = multi ? ` (${index + 1}/${parsed.prices.length})` : "";
      const propCode = `GC-${String(code).padStart(3, "0")}`;
      code++;

      // Con varias unidades en el mismo post, cada una toma el número de
      // superficie que le corresponde por posición (ver parseAllAreaNumbers).
      let coveredArea = multi ? (parsed.allSizeNumbers[index] ?? parsed.coveredArea) : parsed.coveredArea;
      let totalArea = multi ? (parsed.allLandNumbers[index] ?? parsed.allSizeNumbers[index] ?? parsed.totalArea) : parsed.totalArea;
      // Un lote (Terreno) no tiene "superficie cubierta" — si solo había un
      // número disponible, es la superficie total del lote, no la cubierta.
      if (multi && parsed.propertyType === "Terreno" && parsed.allLandNumbers[index] == null) {
        totalArea = coveredArea;
        coveredArea = null;
      }

      console.log(`\n[${propCode}] ${parsed.title}${suffix} — USD ${price} — ${parsed.propertyType} — ${parsed.neighborhood || "(sin zona)"}`);
      console.log(`  cubierta=${coveredArea ?? "-"} total=${totalArea ?? "-"} hab=${parsed.bedrooms} baños=${parsed.bathrooms} cochera=${parsed.garages} publicada=${parsed.published}`);

      if (DRY_RUN) {
        created++;
        continue;
      }

      // Catálogos: crea sobre la marcha lo que falte (tipo/ciudad/barrio).
      if (!existingTypes.has(parsed.propertyType)) {
        await prisma.estatePropertyType.create({ data: { tenantId: TENANT_ID, name: parsed.propertyType, order: existingTypes.size + 10 } });
        existingTypes.add(parsed.propertyType);
      }
      if (!existingCities.has("Santa Fe")) {
        await prisma.estateCity.create({ data: { tenantId: TENANT_ID, name: "Santa Fe", order: existingCities.size } });
        existingCities.add("Santa Fe");
      }
      if (parsed.neighborhood && !existingNeighborhoods.has(parsed.neighborhood)) {
        await prisma.estateNeighborhood.create({ data: { tenantId: TENANT_ID, name: parsed.neighborhood, order: existingNeighborhoods.size + 10 } });
        existingNeighborhoods.add(parsed.neighborhood);
      }

      // Imágenes: baja cada una desde WordPress y la sube al bucket propio.
      // Una imagen titulada "plano"/"plan" va al plano, no a la galería.
      const mediaUrls: string[] = [];
      let floorPlanUrl: string | null = null;
      for (const imgId of parsed.imageIds) {
        const info = await fetchMediaInfo(imgId);
        if (!info?.source_url) continue;
        const isPlan = /plano|plan/i.test(info.title?.rendered ?? "");
        const uploaded = await uploadImageToR2(info.source_url, isPlan ? "branding" : `${TENANT_ID}/properties`);
        if (!uploaded) continue;
        if (isPlan && !floorPlanUrl) floorPlanUrl = uploaded;
        else mediaUrls.push(uploaded);
      }
      console.log(`  ${mediaUrls.length} fotos migradas${floorPlanUrl ? " + 1 plano" : ""}`);

      const property = await prisma.estateProperty.create({
        data: {
          tenantId: TENANT_ID,
          code: propCode,
          title: suffix ? `${parsed.title}${suffix}` : parsed.title,
          description: parsed.description,
          propertyType: parsed.propertyType,
          address: parsed.address,
          city: "Santa Fe",
          neighborhood: parsed.neighborhood,
          bedrooms: parsed.bedrooms,
          bathrooms: parsed.bathrooms,
          garages: parsed.garages,
          coveredArea,
          totalArea,
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          floorPlanUrl,
          published: parsed.published,
        },
      });
      await prisma.estateListing.create({
        data: {
          tenantId: TENANT_ID,
          propertyId: property.id,
          operation: "SALE",
          currency: "USD",
          price,
          status: "AVAILABLE",
          showPrice: true,
        },
      });
      if (mediaUrls.length) {
        await prisma.estateMedia.createMany({
          data: mediaUrls.map((url, i) => ({ tenantId: TENANT_ID, propertyId: property.id, url, position: i })),
        });
      }
      created++;
    }
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Listo. ${created} propiedades creadas, ${skipped} salteadas (sin precio).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

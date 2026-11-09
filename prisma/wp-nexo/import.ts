// Paso 2 de la migración del WordPress viejo de Nexo: carga en la base
// apuntada por DATABASE_URL las propiedades de prisma/seed-data/nexo-wp-import.json
// (generado por build.ts, con las fotos ya subidas a R2). Sirve igual para
// la base local que para producción — en el VPS alcanza con git pull + este
// comando, no necesita los zips ni acceso a R2.
//
// Idempotente: cada propiedad se identifica por su código NX-<id de WordPress>.
// Por defecto solo crea las que faltan; las que ya existen no se tocan (por
// si después se editaron desde el panel).
//
// Uso:
//   DRY_RUN=1 npx tsx prisma/wp-nexo/import.ts   (muestra qué haría, no escribe)
//   npx tsx prisma/wp-nexo/import.ts             (crea las que faltan)
// Opcionales:
//   UPDATE_EXISTING=1  pisa también las que ya existen (datos, oferta y fotos)
//   REMOVE_DEMO=1      borra las propiedades ficticias del seed (HZ-xxx)
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../../src/lib/prisma";
import type { ImportedProperty } from "./build";

const TENANT_ID = "nexo-tenant";
const DATA_PATH = path.join(__dirname, "../seed-data/nexo-wp-import.json");
const DRY_RUN = Boolean(process.env.DRY_RUN);
const UPDATE_EXISTING = Boolean(process.env.UPDATE_EXISTING);
const REMOVE_DEMO = Boolean(process.env.REMOVE_DEMO);
const DEMO_MARKER = "Propiedad ficticia de demostración";

async function ensureCatalog(model: "estatePropertyType" | "estateCity" | "estateNeighborhood", names: string[]) {
  // Prisma no deja indexar el delegate por string con tipos; los tres
  // catálogos tienen la misma forma (tenantId, name, order).
  const delegate = prisma[model] as unknown as {
    findMany(args: object): Promise<{ name: string; order: number }[]>;
    create(args: object): Promise<unknown>;
  };
  const existing = await delegate.findMany({ where: { tenantId: TENANT_ID } });
  const have = new Set(existing.map((e) => e.name));
  let order = Math.max(0, ...existing.map((e) => e.order)) + 1;
  for (const name of [...new Set(names)].filter((n) => n && !have.has(n)).sort()) {
    console.log(`  + ${model}: ${name}`);
    if (!DRY_RUN) await delegate.create({ data: { tenantId: TENANT_ID, name, order: order++ } });
  }
}

function propertyData(p: ImportedProperty) {
  return {
    title: p.title,
    description: p.description,
    propertyType: p.propertyType,
    address: p.address,
    city: p.city,
    neighborhood: p.neighborhood,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    garages: p.garages,
    coveredArea: p.coveredArea,
    totalArea: p.totalArea,
    latitude: p.latitude,
    longitude: p.longitude,
    mapAddress: p.mapAddress,
    videoUrl: p.videoUrl,
    floorPlanUrl: p.floorPlanUrl,
    featured: p.featured,
    published: true,
  };
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) throw new Error(`No existe el tenant ${TENANT_ID} en esta base (¿corriste el seed?).`);

  const data: ImportedProperty[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}${data.length} propiedades en el JSON.`);

  if (REMOVE_DEMO) {
    const demos = await prisma.estateProperty.findMany({
      where: { tenantId: TENANT_ID, description: { startsWith: DEMO_MARKER } },
      select: { id: true, code: true, title: true },
    });
    for (const d of demos) {
      console.log(`  - demo ${d.code} ${d.title}`);
      if (DRY_RUN) continue;
      try {
        await prisma.estateProperty.delete({ where: { id: d.id } });
      } catch {
        // Tiene datos colgados (consultas, visitas…): se despublica en vez de borrar.
        await prisma.estateProperty.update({ where: { id: d.id }, data: { published: false, featured: false } });
        console.log(`    (tiene datos relacionados: quedó despublicada en vez de borrada)`);
      }
    }
  }

  console.log("Catálogos:");
  await ensureCatalog("estatePropertyType", data.map((p) => p.propertyType));
  await ensureCatalog("estateCity", data.map((p) => p.city));
  await ensureCatalog("estateNeighborhood", data.map((p) => p.neighborhood));

  let created = 0;
  let updated = 0;
  let untouched = 0;

  for (const p of data) {
    const existing = await prisma.estateProperty.findUnique({
      where: { tenantId_code: { tenantId: TENANT_ID, code: p.code } },
      select: { id: true },
    });
    if (existing && !UPDATE_EXISTING) {
      untouched++;
      continue;
    }
    console.log(`${existing ? "~" : "+"} ${p.code} ${p.title} (${p.media.length} fotos)`);
    if (DRY_RUN) {
      existing ? updated++ : created++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const property = existing
        ? await tx.estateProperty.update({ where: { id: existing.id }, data: propertyData(p) })
        : await tx.estateProperty.create({
            data: { tenantId: TENANT_ID, code: p.code, createdAt: new Date(p.createdAt), ...propertyData(p) },
          });

      // Una sola oferta por propiedad (la operación que tenía en WordPress).
      await tx.estateListing.deleteMany({ where: { propertyId: property.id, operation: { not: p.listing.operation } } });
      await tx.estateListing.upsert({
        where: { propertyId_operation: { propertyId: property.id, operation: p.listing.operation } },
        create: { tenantId: TENANT_ID, propertyId: property.id, ...p.listing },
        update: p.listing,
      });

      await tx.estateMedia.deleteMany({ where: { propertyId: property.id } });
      if (p.media.length) {
        await tx.estateMedia.createMany({
          data: p.media.map((url, position) => ({ tenantId: TENANT_ID, propertyId: property.id, url, position })),
        });
      }
    });
    existing ? updated++ : created++;
  }

  console.log(
    `\n${DRY_RUN ? "[DRY RUN] " : ""}Listo: ${created} creadas, ${updated} actualizadas, ${untouched} ya existían (sin tocar).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

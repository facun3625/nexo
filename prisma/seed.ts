import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import demoData from "./seed-data/demo-inmo-export.json";
import urlMap from "./seed-data/r2-url-map.json";

const TENANT_ID = "gerelli-tenant";
const ADMIN_EMAIL = "admin@gerellicorrenti.com.ar";

// Contenido inicial copiado del tenant demo-inmo de Urbi, como punto de
// partida editable desde el admin — ver PLAN_FORK.md.
function mapUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return (urlMap as Record<string, string>)[url] ?? url;
}

async function main() {
  const existing = await prisma.tenant.findFirst();
  if (existing) {
    console.log(`Ya existe un Tenant (${existing.id}) — no se vuelve a sembrar.`);
    return;
  }

  await prisma.tenant.create({ data: { id: TENANT_ID } });

  // ---------- Settings (branding + identidad) ----------
  const settingsOverrides: Record<string, string> = {
    store_name: "Gerreli",
    seo_title: "Gerreli · Propiedades en Córdoba",
  };
  const skipKeys = new Set(["ai_agent_enabled"]);
  await prisma.settings.createMany({
    data: demoData.settings
      .filter((s) => !skipKeys.has(s.key))
      .map((s) => {
        let value = settingsOverrides[s.key] ?? mapUrl(s.value) ?? s.value;
        if (s.key === "about_text") value = value.replaceAll("Horizonte", "Gerreli");
        return { tenantId: TENANT_ID, key: s.key, value };
      }),
  });

  // ---------- Sobre nosotros ----------
  await prisma.aboutMedia.createMany({
    data: demoData.aboutMedia.map((m) => ({
      tenantId: TENANT_ID,
      type: m.type as "IMAGE" | "VIDEO",
      url: mapUrl(m.url)!,
      order: m.order,
    })),
  });

  // ---------- Catálogos (categorías, ciudades, barrios, etc.) ----------
  await prisma.estatePropertyType.createMany({
    data: demoData.propertyTypes.map((t) => ({ tenantId: TENANT_ID, name: t.name, order: t.order })),
  });
  await prisma.estateCity.createMany({
    data: demoData.cities.map((c) => ({ tenantId: TENANT_ID, name: c.name, order: c.order })),
  });
  await prisma.estateNeighborhood.createMany({
    data: demoData.neighborhoods.map((n) => ({ tenantId: TENANT_ID, name: n.name, order: n.order })),
  });
  await prisma.estateContractType.createMany({
    data: demoData.contractTypes.map((t) => ({ tenantId: TENANT_ID, name: t.name, order: t.order })),
  });
  await prisma.estatePropertyDestination.createMany({
    data: demoData.propertyDestinations.map((d) => ({ tenantId: TENANT_ID, name: d.name, order: d.order })),
  });

  // ---------- Contacto propietario ----------
  const contactIdMap = new Map<string, string>();
  for (const c of demoData.contacts) {
    const created = await prisma.estateContact.create({
      data: {
        tenantId: TENANT_ID,
        name: c.name,
        email: c.email,
        phone: c.phone,
        roles: c.roles,
        notes: c.notes,
      },
    });
    contactIdMap.set(c.id, created.id);
  }

  // ---------- Emprendimiento ----------
  const developmentIdMap = new Map<string, string>();
  for (const d of demoData.developments) {
    const created = await prisma.estateDevelopment.create({
      data: {
        tenantId: TENANT_ID,
        name: d.name,
        address: d.address,
        city: d.city,
        stage: d.stage,
        description: d.description,
        developer: d.developer,
        amenities: d.amenities,
        financing: d.financing,
        videoUrl: d.videoUrl,
        formTitle: d.formTitle,
        submitLabel: d.submitLabel,
        published: d.published,
        latitude: d.latitude,
        longitude: d.longitude,
      },
    });
    developmentIdMap.set(d.id, created.id);
  }
  const developmentImagesByDevelopment = new Map<string, typeof demoData.developmentImages>();
  for (const img of demoData.developmentImages) {
    const list = developmentImagesByDevelopment.get(img.developmentId) ?? [];
    list.push(img);
    developmentImagesByDevelopment.set(img.developmentId, list);
  }
  for (const [oldDevId, newDevId] of developmentIdMap) {
    const images = developmentImagesByDevelopment.get(oldDevId) ?? [];
    if (images.length) {
      await prisma.estateDevelopmentImage.createMany({
        data: images.map((img) => ({
          developmentId: newDevId,
          url: mapUrl(img.url)!,
          order: img.order,
        })),
      });
    }
  }

  // ---------- Propiedades ----------
  const listingsByProperty = new Map<string, typeof demoData.listings>();
  for (const l of demoData.listings) {
    const list = listingsByProperty.get(l.propertyId) ?? [];
    list.push(l);
    listingsByProperty.set(l.propertyId, list);
  }
  const mediaByProperty = new Map<string, typeof demoData.media>();
  for (const m of demoData.media) {
    const list = mediaByProperty.get(m.propertyId) ?? [];
    list.push(m);
    mediaByProperty.set(m.propertyId, list);
  }

  for (const p of demoData.properties) {
    const created = await prisma.estateProperty.create({
      data: {
        tenantId: TENANT_ID,
        code: p.code,
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
        published: p.published,
        featured: p.featured,
        featuredOrder: p.featuredOrder,
        latitude: p.latitude,
        longitude: p.longitude,
        ownerId: p.ownerId ? contactIdMap.get(p.ownerId) : null,
        developmentId: p.developmentId ? developmentIdMap.get(p.developmentId) : null,
      },
    });

    const listings = listingsByProperty.get(p.id) ?? [];
    for (const l of listings) {
      await prisma.estateListing.create({
        data: {
          tenantId: TENANT_ID,
          propertyId: created.id,
          operation: l.operation,
          currency: l.currency,
          price: l.price,
          status: l.status,
          temporary: l.temporary,
          whatsapp: l.whatsapp,
          showPrice: l.showPrice,
        },
      });
    }

    const media = mediaByProperty.get(p.id) ?? [];
    if (media.length) {
      await prisma.estateMedia.createMany({
        data: media.map((m) => ({
          tenantId: TENANT_ID,
          propertyId: created.id,
          url: mapUrl(m.url)!,
          position: m.position,
        })),
      });
    }
  }

  // ---------- Usuario ADMIN ----------
  const password = randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
  await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      name: "Admin",
      email: ADMIN_EMAIL,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  console.log("Seed completo.");
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Admin:  ${ADMIN_EMAIL} / ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

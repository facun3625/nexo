import "server-only";
import { prisma } from "@/lib/prisma";
import { mlFetch, MercadoLibreApiError } from "@/lib/mercadolibre/client";
import { getMercadoLibreSettings } from "@/lib/mercadolibre/settings";
import { resolveLeafCategory, getCategoryAttributes } from "@/lib/mercadolibre/categories";
import {
  buildAttributeValues,
  toPlainText,
  validateListingBeforePublish,
  type MissingAttribute,
  type PropertyForMl,
} from "@/lib/mercadolibre/mapping";
import type { EstateListing } from "@/generated/prisma/client";

export class MercadoLibreValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join(" / "));
  }
}

type MlItemResponse = { id: string; permalink: string; status: string };
type MlListingType = { id: string; name: string };

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3011";
const IS_LOCAL = ROOT_DOMAIN.startsWith("localhost");

// ML descarga cada foto desde la URL que le pasamos. Las nuestras son WEBP
// en R2; se le pasa una ruta propia que las entrega en JPG (el formato que
// ML acepta siempre). En local ML no llega a localhost, así que ahí va la
// URL de R2 directa (igual no se puede publicar desde local).
function pictureUrl(media: { id: string; url: string }) {
  return IS_LOCAL ? media.url : `https://${ROOT_DOMAIN}/api/mercadolibre/picture/${media.id}`;
}

async function loadListing(tenantId: string, listingId: string) {
  const listing = await prisma.estateListing.findFirst({
    where: { id: listingId, tenantId },
    include: { property: { include: { media: { orderBy: { position: "asc" } } } } },
  });
  if (!listing) throw new Error("Oferta no encontrada");
  return listing;
}

async function findLocation(tenantId: string, property: PropertyForMl) {
  return prisma.estateMlLocation.findUnique({
    where: { tenantId_city_neighborhood: { tenantId, city: property.city, neighborhood: property.neighborhood } },
  });
}

function locationLabel(property: PropertyForMl) {
  return `${property.city}${property.neighborhood ? " / " + property.neighborhood : ""}`;
}

async function availableListingTypes(tenantId: string, userId: string | null, categoryId: string): Promise<MlListingType[]> {
  if (!userId) return [];
  try {
    return await mlFetch<MlListingType[]>(tenantId, `/users/${userId}/available_listing_types?category_id=${categoryId}`);
  } catch {
    return [];
  }
}

export type MercadoLibreRequirements = {
  categoryPath: string | null;
  issues: string[];
  missing: MissingAttribute[];
  values: Record<string, string>;
  listingTypes: MlListingType[];
  listingTypeId: string | null;
};

// Lo que muestra la ficha antes de publicar: dónde va a caer en ML, qué
// falta, y qué tipos de publicación tiene disponibles la cuenta.
export async function getListingRequirements(tenantId: string, listingId: string): Promise<MercadoLibreRequirements> {
  const listing = await loadListing(tenantId, listingId);
  const property = listing.property;
  const issues = validateListingBeforePublish(property, listing).map((i) => i.message);
  if (!(await findLocation(tenantId, property))) {
    issues.push(`Falta mapear la ubicación "${locationLabel(property)}" en Configuración → Mercado Libre.`);
  }
  const values = (listing.mlAttributes && typeof listing.mlAttributes === "object" ? listing.mlAttributes : {}) as Record<string, string>;
  const settings = await getMercadoLibreSettings(tenantId);
  try {
    const category = await resolveLeafCategory(tenantId, settings.siteId, property.propertyType, listing.operation);
    const attributes = await getCategoryAttributes(tenantId, category.id);
    const { missing } = buildAttributeValues(attributes, property, listing);
    // Los que ya se completaron a mano también se muestran, para poder
    // cambiarlos.
    const editable = [
      ...missing,
      ...attributes
        .filter((a) => values[a.id] && !missing.some((m) => m.id === a.id))
        .map((a) => ({ id: a.id, name: a.name, valueType: a.valueType, options: a.values })),
    ];
    const listingTypes = await availableListingTypes(tenantId, settings.userId, category.id);
    return {
      categoryPath: category.path,
      issues,
      missing: editable,
      values,
      listingTypes,
      listingTypeId: listing.mlListingTypeId && listingTypes.some((t) => t.id === listing.mlListingTypeId)
        ? listing.mlListingTypeId
        : (listingTypes[0]?.id ?? listing.mlListingTypeId),
    };
  } catch (err) {
    issues.push(err instanceof Error ? err.message : "No se pudo resolver la categoría de Mercado Libre");
    return { categoryPath: null, issues, missing: [], values, listingTypes: [], listingTypeId: listing.mlListingTypeId };
  }
}

async function buildPayload(tenantId: string, property: PropertyForMl, listing: EstateListing) {
  const preIssues = validateListingBeforePublish(property, listing);
  if (preIssues.length > 0) throw new MercadoLibreValidationError(preIssues.map((i) => i.message));

  const settings = await getMercadoLibreSettings(tenantId);
  const location = await findLocation(tenantId, property);
  if (!location) {
    throw new MercadoLibreValidationError([
      `Falta mapear "${locationLabel(property)}" a una ubicación de Mercado Libre — resolvelo en Configuración → Mercado Libre.`,
    ]);
  }
  const category = await resolveLeafCategory(tenantId, settings.siteId, property.propertyType, listing.operation);
  const { attributes, missing } = buildAttributeValues(await getCategoryAttributes(tenantId, category.id), property, listing);
  if (missing.length > 0) {
    throw new MercadoLibreValidationError(missing.map((a) => `Completá "${a.name}" en el panel de Mercado Libre de la propiedad.`));
  }

  let listingTypeId = listing.mlListingTypeId;
  if (!listingTypeId) {
    listingTypeId = (await availableListingTypes(tenantId, settings.userId, category.id))[0]?.id ?? "silver";
  }

  return {
    categoryId: category.id,
    listingTypeId,
    body: {
      title: property.title.slice(0, 60),
      category_id: category.id,
      price: Number(listing.price),
      currency_id: listing.currency,
      buying_mode: "classified" as const,
      listing_type_id: listingTypeId,
      available_quantity: 1,
      condition: "not_specified",
      // ML solo quiere UN id (barrio o ciudad) — si mandás el de barrio
      // completa estado y ciudad solo.
      // No mandamos address_line a propósito: EstateProperty.address es
      // privada (no se muestra en la web pública, ver estate/modules.ts).
      // lat/long sí son públicas (se usan en /mapa).
      location: {
        ...(location.mlNeighborhoodId ? { neighborhood: { id: location.mlNeighborhoodId } } : { city: { id: location.mlCityId } }),
        ...(property.latitude != null && property.longitude != null
          ? { latitude: Number(property.latitude), longitude: Number(property.longitude) }
          : {}),
      },
      pictures: property.media.slice(0, 30).map((m) => ({ source: pictureUrl(m) })),
      attributes,
    },
  };
}

async function setDescription(tenantId: string, itemId: string, text: string, isUpdate: boolean) {
  const plain = toPlainText(text).slice(0, 50_000);
  if (!plain) return;
  try {
    await mlFetch(tenantId, `/items/${itemId}/description`, { method: isUpdate ? "PUT" : "POST", body: { plain_text: plain } });
  } catch {
    // La descripción es secundaria — si falla no abortamos una publicación
    // que ya quedó creada en Mercado Libre.
  }
}

async function persistSyncResult(listingId: string, data: {
  mlItemId?: string | null;
  mlPermalink?: string | null;
  mlCategoryId?: string | null;
  mlListingTypeId?: string | null;
  mlStatus?: string | null;
  mlLastError?: string | null;
}) {
  await prisma.estateListing.update({
    where: { id: listingId },
    data: { ...data, mlLastSyncedAt: new Date() },
  });
}

function errorMessage(err: unknown) {
  return err instanceof MercadoLibreValidationError
    ? err.issues.join(" / ")
    : err instanceof Error
      ? err.message
      : "Error desconocido";
}

export async function publishListingToMercadoLibre(tenantId: string, listingId: string): Promise<void> {
  const listing = await loadListing(tenantId, listingId);

  try {
    const { categoryId, listingTypeId, body } = await buildPayload(tenantId, listing.property, listing);
    const isUpdate = Boolean(listing.mlItemId);
    // Una publicación ya creada no admite cambiar categoría, tipo de
    // publicación ni modo de compra: al actualizar solo van los datos que
    // pueden cambiar.
    const response = isUpdate
      ? await mlFetch<MlItemResponse>(tenantId, `/items/${listing.mlItemId}`, {
          method: "PUT",
          body: { title: body.title, price: body.price, pictures: body.pictures, attributes: body.attributes },
        })
      : await mlFetch<MlItemResponse>(tenantId, "/items", { method: "POST", body });

    await setDescription(tenantId, response.id, listing.property.description, isUpdate);
    await persistSyncResult(listing.id, {
      mlItemId: response.id,
      mlPermalink: response.permalink,
      mlCategoryId: isUpdate ? listing.mlCategoryId : categoryId,
      mlListingTypeId: isUpdate ? listing.mlListingTypeId : listingTypeId,
      mlStatus: response.status,
      mlLastError: null,
    });
  } catch (err) {
    const message = errorMessage(err);
    await persistSyncResult(listing.id, { mlLastError: message });
    throw new Error(message);
  }
}

async function setListingStatus(tenantId: string, listingId: string, status: "paused" | "active" | "closed"): Promise<void> {
  const listing = await prisma.estateListing.findFirst({ where: { id: listingId, tenantId } });
  if (!listing?.mlItemId) throw new Error("Esta oferta todavía no se publicó en Mercado Libre");
  try {
    const response = await mlFetch<MlItemResponse>(tenantId, `/items/${listing.mlItemId}`, { method: "PUT", body: { status } });
    await persistSyncResult(listing.id, {
      mlStatus: response.status,
      mlLastError: null,
      // Una publicación cerrada en ML no se puede reabrir: se olvida el
      // item para que "Publicar" cree uno nuevo si hace falta.
      ...(status === "closed" ? { mlItemId: null, mlPermalink: null } : {}),
    });
  } catch (err) {
    const message = err instanceof MercadoLibreApiError ? err.message : errorMessage(err);
    await persistSyncResult(listing.id, { mlLastError: message });
    throw new Error(message);
  }
}

export const pauseListingOnMercadoLibre = (tenantId: string, listingId: string) => setListingStatus(tenantId, listingId, "paused");
export const reactivateListingOnMercadoLibre = (tenantId: string, listingId: string) => setListingStatus(tenantId, listingId, "active");
export const closeListingOnMercadoLibre = (tenantId: string, listingId: string) => setListingStatus(tenantId, listingId, "closed");

// Guarda lo que se completa a mano en la ficha (atributos extra y tipo de
// publicación).
export async function saveListingOptions(
  tenantId: string,
  listingId: string,
  options: { attributes: Record<string, string>; listingTypeId: string | null },
) {
  const listing = await prisma.estateListing.findFirst({ where: { id: listingId, tenantId }, select: { id: true } });
  if (!listing) throw new Error("Oferta no encontrada");
  const attributes = Object.fromEntries(
    Object.entries(options.attributes)
      .map(([k, v]) => [k.trim(), v.trim()] as const)
      .filter(([k, v]) => /^[A-Z0-9_]{2,60}$/.test(k) && v.length > 0 && v.length <= 200),
  );
  await prisma.estateListing.update({
    where: { id: listing.id },
    data: {
      mlAttributes: attributes,
      ...(options.listingTypeId ? { mlListingTypeId: options.listingTypeId.slice(0, 40) } : {}),
    },
  });
}

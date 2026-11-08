import { ORIENTATIONS, PET_POLICIES } from "./property-features";
import type { Prisma } from "@/generated/prisma/client";

// Sin dependencia de prisma a propósito: este módulo lo importa
// catalog-filters-form.tsx, un client component — cualquier import de
// "@/lib/prisma" acá arrastraría "pg" (y "dns") al bundle del navegador y
// rompe el build. getCatalogFilterSettings (que sí necesita la base) vive
// aparte, en catalog-filter-settings.ts.

export const CATALOG_FILTER_KEYS = [
  "q",
  "operation",
  "propertyType",
  "city",
  "neighborhood",
  "bedrooms",
  "bathrooms",
  "garages",
  "orientation",
  "petsPolicy",
  "creditEligible",
] as const;

export type CatalogFilterKey = (typeof CATALOG_FILTER_KEYS)[number];

export const CATALOG_FILTER_LABELS: Record<CatalogFilterKey, string> = {
  q: "Texto libre",
  operation: "Operación",
  propertyType: "Tipo de inmueble",
  city: "Ciudad",
  neighborhood: "Barrio",
  bedrooms: "Dormitorios",
  bathrooms: "Baños",
  garages: "Cocheras",
  orientation: "Orientación",
  petsPolicy: "Mascotas",
  creditEligible: "Apto crédito",
};

export type ParsedCatalogFilters = {
  q?: string;
  operation?: "SALE" | "RENT";
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  // Exactos, no "mínimo" — quien busca 1 dormitorio quiere 1, no "1 o más"
  // (ver buildPublishedPropertyWhere).
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
  orientation?: string;
  petsPolicy?: string;
  creditEligible?: boolean;
};

// enabledKeys es una lista ORDENADA — el orden define en qué posición
// aparece cada filtro en el buscador (ver PropertySearchForm), no solo
// cuáles están prendidos.
export function parseCatalogFilters(
  search: Record<string, string | undefined>,
  enabledKeys: readonly CatalogFilterKey[],
  options: { propertyTypes: readonly string[]; cities: readonly string[]; neighborhoods: readonly string[] },
): ParsedCatalogFilters {
  const isEnabled = (key: CatalogFilterKey) => enabledKeys.includes(key);
  const exactValue = (raw: string | undefined) => (raw && /^\d{1,2}$/.test(raw) ? Number(raw) : undefined);
  return {
    q: isEnabled("q") ? (search.q ?? "").trim().slice(0, 200) || undefined : undefined,
    operation:
      isEnabled("operation") && (search.operation === "SALE" || search.operation === "RENT")
        ? search.operation
        : undefined,
    propertyType:
      isEnabled("propertyType") && options.propertyTypes.includes(search.propertyType ?? "")
        ? search.propertyType
        : undefined,
    city: isEnabled("city") && options.cities.includes(search.city ?? "") ? search.city : undefined,
    neighborhood:
      isEnabled("neighborhood") && options.neighborhoods.includes(search.neighborhood ?? "")
        ? search.neighborhood
        : undefined,
    bedrooms: isEnabled("bedrooms") ? exactValue(search.bedrooms) : undefined,
    bathrooms: isEnabled("bathrooms") ? exactValue(search.bathrooms) : undefined,
    garages: isEnabled("garages") ? exactValue(search.garages) : undefined,
    orientation: isEnabled("orientation") && ORIENTATIONS.some((v) => v === search.orientation) ? search.orientation : undefined,
    petsPolicy: isEnabled("petsPolicy") && PET_POLICIES.some((v) => v === search.petsPolicy) ? search.petsPolicy : undefined,
    creditEligible: isEnabled("creditEligible") && ["true", "false"].includes(search.creditEligible ?? "") ? search.creditEligible === "true" : undefined,
  };
}

export function buildPublishedPropertyWhere(
  tenantId: string,
  filters: ParsedCatalogFilters,
): Prisma.EstatePropertyWhereInput {
  return {
    tenantId,
    published: true,
    listings: {
      some: { status: "AVAILABLE", ...(filters.operation ? { operation: filters.operation } : {}) },
    },
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.neighborhood ? { neighborhood: filters.neighborhood } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" as const } },
            { city: { contains: filters.q, mode: "insensitive" as const } },
            { neighborhood: { contains: filters.q, mode: "insensitive" as const } },
            { propertyType: { contains: filters.q, mode: "insensitive" as const } },
            { code: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.bedrooms !== undefined ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.bathrooms !== undefined ? { bathrooms: filters.bathrooms } : {}),
    ...(filters.garages !== undefined ? { garages: filters.garages } : {}),
    ...(filters.orientation ? { orientation: filters.orientation } : {}),
    ...(filters.petsPolicy ? { petsPolicy: filters.petsPolicy } : {}),
    ...(filters.creditEligible !== undefined ? { creditEligible: filters.creditEligible } : {}),
  };
}

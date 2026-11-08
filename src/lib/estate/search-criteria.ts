import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { ORIENTATIONS, PET_POLICIES } from "./property-features";

const optionalText = z.string().trim().max(150).default("");
const rooms = z.union([z.literal(""), z.string().regex(/^(0|[1-9]|10)$/, "Elegí una cantidad válida")]).default("");

// Versioned JSON stored on the inquiry: no inference from free-text messages.
export const searchCriteriaSchema = z.object({
  version: z.literal(1).default(1),
  operation: z.enum(["", "SALE", "RENT", "RENT_TEMP"]).default(""),
  propertyType: optionalText,
  city: optionalText,
  bedrooms: rooms,
  bathrooms: rooms,
  petsPolicy: z.enum(["", ...PET_POLICIES]).default(""),
  orientation: z.enum(["", ...ORIENTATIONS]).default(""),
  creditEligible: z.enum(["", "true", "false"]).default(""),
  currency: z.enum(["ARS", "USD"]).default("USD"),
  maxBudget: z.union([z.literal(""), z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Ingresá un presupuesto numérico, sin separadores de miles").refine((v) => Number(v) > 0, "El presupuesto debe ser mayor a cero")]).default(""),
});
export type SearchCriteria = z.infer<typeof searchCriteriaSchema>;

export function matchingListingWhere(criteria: SearchCriteria): Prisma.EstateListingWhereInput {
  return {
    status: "AVAILABLE",
    // A monthly rental budget must never match a daily temporary rate.
    ...(criteria.operation ? { operation: criteria.operation === "SALE" ? "SALE" : "RENT" } : {}),
    temporary: criteria.operation === "RENT_TEMP",
    ...(criteria.maxBudget ? { currency: criteria.currency, price: { lte: criteria.maxBudget } } : {}),
  };
}

export function matchingPropertyWhere(tenantId: string, criteria: SearchCriteria): Prisma.EstatePropertyWhereInput {
  return {
    tenantId,
    published: true,
    listings: { some: matchingListingWhere(criteria) },
    ...(criteria.propertyType ? { propertyType: criteria.propertyType } : {}),
    ...(criteria.city ? { city: criteria.city } : {}),
    ...(criteria.bedrooms !== "" ? { bedrooms: Number(criteria.bedrooms) } : {}),
    ...(criteria.bathrooms !== "" ? { bathrooms: Number(criteria.bathrooms) } : {}),
    ...(criteria.petsPolicy ? { petsPolicy: criteria.petsPolicy } : {}),
    ...(criteria.orientation ? { orientation: criteria.orientation } : {}),
    ...(criteria.creditEligible !== "" ? { creditEligible: criteria.creditEligible === "true" } : {}),
  };
}

export function describeSearch(criteria: SearchCriteria): string[] {
  const operations = { SALE: "Venta", RENT: "Alquiler mensual", RENT_TEMP: "Alquiler temporario", "": "Venta o alquiler mensual" };
  return [
    operations[criteria.operation],
    criteria.propertyType,
    criteria.city,
    criteria.bedrooms !== "" ? `${criteria.bedrooms} dormitorios (exactos)` : "",
    criteria.bathrooms !== "" ? `${criteria.bathrooms} baños (exactos)` : "",
    criteria.petsPolicy ? `Mascotas: ${criteria.petsPolicy.toLowerCase()}` : "",
    criteria.orientation ? `Orientación: ${criteria.orientation}` : "",
    criteria.creditEligible === "true" ? "Apto crédito" : criteria.creditEligible === "false" ? "No apto crédito" : "",
    criteria.maxBudget ? `Hasta ${criteria.currency} ${Number(criteria.maxBudget).toLocaleString("es-AR")}` : "Sin límite de presupuesto",
  ].filter(Boolean);
}

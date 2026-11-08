import "server-only";
import type { EstateProperty, EstateListing, EstateMedia } from "@/generated/prisma/client";
import type { MlCategoryAttribute } from "@/lib/mercadolibre/categories";

export type PropertyForMl = EstateProperty & { media: EstateMedia[] };

export type MlAttributeValue = { id: string; value_id?: string; value_name?: string };

export type MissingAttribute = {
  id: string;
  name: string;
  valueType: string;
  options: { id: string; name: string }[];
};

export type MappingResult = {
  attributes: MlAttributeValue[];
  // Obligatorios de la categoría que no salen de la propiedad ni se
  // completaron a mano en la ficha (listing.mlAttributes).
  missing: MissingAttribute[];
};

const area = (value: { toString(): string } | null, unit: string) =>
  value != null && Number(value.toString()) > 0 ? `${Number(value.toString())} ${unit}` : null;

// Atributos que salen solos de la ficha de la propiedad. IDs verificados
// contra /categories/{id}/attributes de MLA (nov 2026): todas las
// categorías finales de Inmuebles piden alguno de estos.
function fromProperty(attribute: MlCategoryAttribute, property: PropertyForMl): string | null {
  const unit = attribute.defaultUnit ?? "m²";
  switch (attribute.id) {
    case "TOTAL_AREA":
      return area(property.totalArea, unit);
    case "COVERED_AREA":
      return area(property.coveredArea, unit);
    case "BEDROOMS":
      return String(property.bedrooms);
    case "FULL_BATHROOMS":
      return String(property.bathrooms);
    case "PARKING_LOTS":
      return String(property.garages);
    case "ROOMS":
      // Ambientes: no lo cargamos aparte. Convención de Argentina:
      // dormitorios + 1 (el living); un monoambiente es 1.
      return String(Math.max(1, property.bedrooms + 1));
    default:
      return null;
  }
}

export function storedAttributes(listing: Pick<EstateListing, "mlAttributes">): Record<string, string> {
  const raw = listing.mlAttributes;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string" && e[1].trim() !== ""),
  );
}

export function buildAttributeValues(
  categoryAttributes: MlCategoryAttribute[],
  property: PropertyForMl,
  listing: EstateListing,
): MappingResult {
  const manual = storedAttributes(listing);
  const attributes: MlAttributeValue[] = [];
  const missing: MissingAttribute[] = [];

  for (const attribute of categoryAttributes) {
    const manualValue = manual[attribute.id];
    if (manualValue) {
      const isListValue = attribute.values.some((v) => v.id === manualValue);
      // "120" en una superficie → "120 m²": ML exige la unidad.
      const withUnit =
        attribute.valueType === "number_unit" && /^\d+([.,]\d+)?$/.test(manualValue)
          ? `${manualValue.replace(",", ".")} ${attribute.defaultUnit ?? "m²"}`
          : manualValue;
      attributes.push(isListValue ? { id: attribute.id, value_id: manualValue } : { id: attribute.id, value_name: withUnit });
      continue;
    }
    const auto = fromProperty(attribute, property);
    if (auto !== null) {
      attributes.push({ id: attribute.id, value_name: auto });
      continue;
    }
    if (attribute.required) {
      missing.push({
        id: attribute.id,
        name: attribute.name,
        valueType: attribute.valueType,
        options: attribute.values.map((v) => ({ id: v.id, name: v.name })),
      });
    }
  }

  return { attributes, missing };
}

export type ListingValidationIssue = { code: string; message: string };

const OPERATIONS = new Set(["SALE", "RENT"]);

// Chequeos previos a llamar a la API, explicados en español.
export function validateListingBeforePublish(property: PropertyForMl, listing: EstateListing): ListingValidationIssue[] {
  const issues: ListingValidationIssue[] = [];
  if (!listing.price || Number(listing.price) <= 0) {
    issues.push({ code: "NO_PRICE", message: "La oferta no tiene precio cargado — Mercado Libre lo exige." });
  }
  if (property.media.length === 0) {
    issues.push({ code: "NO_PICTURES", message: "La propiedad no tiene fotos — Mercado Libre pide al menos una." });
  }
  if (!OPERATIONS.has(listing.operation)) {
    issues.push({ code: "BAD_OPERATION", message: `Operación "${listing.operation}" no tiene equivalente en Mercado Libre (solo Venta/Alquiler).` });
  }
  if (!property.propertyType.trim()) {
    issues.push({ code: "NO_PROPERTY_TYPE", message: "La propiedad no tiene tipo asignado." });
  }
  return issues;
}

// La descripción puede venir con HTML del editor: ML solo acepta texto plano.
export function toPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

import { prisma } from "@/lib/prisma";
import { CATALOG_FILTER_KEYS, CATALOG_FILTER_LABELS, type CatalogFilterKey } from "./catalog-filters";

// Filtros iniciales para sitios sin configuración. Las selecciones guardadas
// por cada inmobiliaria conservan su orden y sus filtros habilitados.
const DEFAULT_ENABLED: readonly CatalogFilterKey[] = ["q", "operation", "propertyType", "bedrooms", "orientation", "petsPolicy", "creditEligible"];

// Lista ORDENADA de los filtros habilitados — el orden guardado (ver
// updateCatalogFilters) es el orden en el que se muestran en el buscador.
export async function getCatalogFilterSettings(tenantId: string): Promise<CatalogFilterKey[]> {
  const row = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId, key: "catalog_filters" } },
  });
  // "none" es un valor guardado a propósito para el caso "el admin destildó
  // todo" — value === "" se borra en saveTextSetting, así que sin este
  // sentinel esa elección sería indistinguible de "todavía no configuró
  // nada" y volvería a los 4 default en vez de mostrar cero filtros.
  if (!row) return [...DEFAULT_ENABLED];
  if (row.value === "none") return [];
  return row.value.split(",").filter((key): key is CatalogFilterKey => CATALOG_FILTER_KEYS.includes(key as CatalogFilterKey));
}

// Lo que usa el sitio público: el buscador de texto va siempre, es el
// predictivo y no depende de qué filtros se hayan tildado.
export async function getPublicCatalogFilters(tenantId: string): Promise<CatalogFilterKey[]> {
  const keys = await getCatalogFilterSettings(tenantId);
  return keys.includes("q") ? keys : ["q", ...keys];
}

// Texto de la opción "sin elegir" de cada select del buscador (ej.
// "Ciudad", "Operación") — por default es CATALOG_FILTER_LABELS, pero el
// admin lo puede reescribir desde /admin/pagina (ver CatalogFiltersForm).
export async function getCatalogFilterLabels(
  tenantId: string,
): Promise<Record<CatalogFilterKey, string>> {
  const row = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId, key: "catalog_filter_labels" } },
  });
  if (!row) return { ...CATALOG_FILTER_LABELS };
  let overrides: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(row.value);
    if (parsed && typeof parsed === "object") overrides = parsed;
  } catch {
    // valor corrupto/viejo — se ignora y quedan los defaults
  }
  const labels = { ...CATALOG_FILTER_LABELS };
  for (const key of CATALOG_FILTER_KEYS) {
    const v = overrides[key];
    if (typeof v === "string" && v.trim()) labels[key] = v.trim().slice(0, 60);
  }
  return labels;
}

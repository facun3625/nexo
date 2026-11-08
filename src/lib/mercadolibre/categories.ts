import "server-only";
import { cache } from "react";
import { mlFetch } from "@/lib/mercadolibre/client";

export type MlCategoryAttributeValue = { id: string; name: string };

export type MlCategoryAttribute = {
  id: string;
  name: string;
  valueType: string; // "string" | "number" | "number_unit" | "list" | "boolean" | ...
  required: boolean;
  values: MlCategoryAttributeValue[];
  defaultUnit: string | null;
};

type MlCategoryNode = { id: string; name: string };
type MlCategoryDetail = {
  id: string;
  name: string;
  children_categories: MlCategoryNode[];
  path_from_root: MlCategoryNode[];
  settings?: { listing_allowed?: boolean };
};

export type MlLeafCategory = { id: string; path: string };

// Raíz de Inmuebles por sitio. /sites/{site}/categories ya no es público
// (devuelve 403 sin token), así que para los sitios conocidos se usa el ID
// directo y solo para el resto se busca por nombre con el token.
const REAL_ESTATE_ROOT: Record<string, string> = { MLA: "MLA1459" };

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const fetchCategory = cache(
  (tenantId: string, categoryId: string): Promise<MlCategoryDetail> =>
    mlFetch(tenantId, `/categories/${categoryId}`, { auth: false }),
);

async function getRealEstateRootId(tenantId: string, siteId: string): Promise<string> {
  if (REAL_ESTATE_ROOT[siteId]) return REAL_ESTATE_ROOT[siteId];
  const roots = await mlFetch<MlCategoryNode[]>(tenantId, `/sites/${siteId}/categories`);
  const root = roots.find((c) => normalize(c.name).includes("inmuebles"));
  if (!root) throw new Error(`No encontramos la categoría de Inmuebles en el sitio ${siteId}`);
  return root.id;
}

// Nuestro tipo de propiedad (texto libre del panel) → nombre de la
// subcategoría de Inmuebles en ML. Va en orden: "Casa Quinta" tiene que
// caer en Quintas antes de que "casa" la mande a Casas.
const TYPE_RULES: [RegExp, string][] = [
  [/quinta/, "quintas"],
  [/\bph\b|propiedad horizontal/, "ph"],
  [/departamento|depto|monoambiente|duplex|loft|piso/, "departamentos"],
  [/casa|chalet|cabana/, "casas"],
  [/terreno|lote/, "terrenos y lotes"],
  [/local/, "locales"],
  [/oficina/, "oficinas"],
  [/galpon|deposito|nave/, "depositos y galpones"],
  [/cochera|garage|garaje/, "cocheras"],
  [/campo|chacra/, "campos"],
  [/consultorio/, "consultorios"],
  [/fondo de comercio/, "fondo de comercio"],
];

function pickTypeCategory(children: MlCategoryNode[], propertyType: string): MlCategoryNode | null {
  const type = normalize(propertyType);
  for (const [pattern, target] of TYPE_RULES) {
    if (pattern.test(type)) {
      const match = children.find((c) => normalize(c.name) === target);
      if (match) return match;
    }
  }
  return (
    children.find((c) => normalize(c.name).includes(type) || type.includes(normalize(c.name).replace(/s$/, ""))) ??
    children.find((c) => normalize(c.name) === "otros inmuebles") ??
    null
  );
}

// Debajo del tipo, ML separa por operación y a veces otra vez entre
// "Propiedades Individuales" y "Emprendimientos" (Departamentos → Venta →
// …). Se baja hasta una categoría con listing_allowed: solo esas aceptan
// publicaciones.
function pickChild(children: MlCategoryNode[], operation: string): MlCategoryNode | null {
  const names = children.map((c) => ({ c, n: normalize(c.name) }));
  const byOperation =
    operation === "SALE"
      ? names.find(({ n }) => n === "venta")
      : operation === "RENT"
        ? names.find(({ n }) => n === "alquiler")
        : undefined;
  if (byOperation) return byOperation.c;
  const individual = names.find(({ n }) => n.includes("individual") || n.includes("usadas"));
  if (individual) return individual.c;
  const notProject = names.find(({ n }) => !/emprendimiento|proyecto|temporario/.test(n));
  return notProject?.c ?? null;
}

export const resolveLeafCategory = cache(
  async (tenantId: string, siteId: string, propertyType: string, operation: string): Promise<MlLeafCategory> => {
    const root = await fetchCategory(tenantId, await getRealEstateRootId(tenantId, siteId));
    const typeCategory = pickTypeCategory(root.children_categories, propertyType);
    if (!typeCategory) {
      throw new Error(
        `No pudimos relacionar el tipo de propiedad "${propertyType}" con una categoría de Mercado Libre. ` +
          `Categorías disponibles: ${root.children_categories.map((c) => c.name).join(", ")}.`,
      );
    }
    let current = await fetchCategory(tenantId, typeCategory.id);
    for (let depth = 0; depth < 4 && !current.settings?.listing_allowed; depth++) {
      const next = pickChild(current.children_categories, operation);
      if (!next) break;
      current = await fetchCategory(tenantId, next.id);
    }
    if (!current.settings?.listing_allowed) {
      throw new Error(`Mercado Libre no permite publicar en "${current.name}" — revisá el tipo de propiedad.`);
    }
    return { id: current.id, path: current.path_from_root.map((p) => p.name).join(" › ") };
  },
);

export const getCategoryAttributes = cache(async (tenantId: string, categoryId: string): Promise<MlCategoryAttribute[]> => {
  type RawAttribute = {
    id: string;
    name: string;
    value_type: string;
    default_unit?: string;
    tags?: { required?: boolean; read_only?: boolean; hidden?: boolean };
    values?: { id: string; name: string }[];
  };
  const raw = await mlFetch<RawAttribute[]>(tenantId, `/categories/${categoryId}/attributes`, { auth: false });
  return raw
    .filter((a) => !a.tags?.read_only)
    .map((a) => ({
      id: a.id,
      name: a.name,
      valueType: a.value_type,
      required: Boolean(a.tags?.required),
      values: a.values ?? [],
      defaultUnit: a.default_unit ?? null,
    }));
});

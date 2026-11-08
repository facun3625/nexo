import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { getAssistantStatus } from "@/lib/ai-agent/status";
import { optionalNumber, optionalText, safeToolArgs } from "@/lib/ai-agent/validation";
import type { AssistantProperty } from "@/lib/ai-agent/types";

export type AssistantToolName = "search_properties" | "get_agency_options";

export type AssistantToolDefinition = {
  name: AssistantToolName;
  description: string;
  parameters: Record<string, unknown>;
};

export const ASSISTANT_TOOLS: AssistantToolDefinition[] = [
  {
    name: "search_properties",
    description:
      "Busca propiedades publicadas en el catálogo real de la inmobiliaria. Usala antes de recomendar o afirmar precio, ubicación o disponibilidad. Completá solo los filtros que el cliente mencionó; los demás van en null. Nunca inventes ciudad, precio, dormitorios ni operación.",
    parameters: {
      type: "object",
      properties: {
        operation: { type: ["string", "null"], enum: ["SALE", "RENT", null], description: "Venta o alquiler. Null si el cliente no lo dijo." },
        property_type: { type: ["string", "null"], description: "Tipo de propiedad (Casa, Departamento, Terreno, etc.). Null si el cliente no lo dijo." },
        city: { type: ["string", "null"], description: "Ciudad o barrio que nombró el cliente. Null si no nombró ninguno." },
        min_bedrooms: { type: ["number", "null"], description: "Cantidad mínima de dormitorios. Null si el cliente no lo dijo." },
        max_bedrooms: { type: ["number", "null"], description: "Cantidad máxima de dormitorios. Si piden una cantidad exacta, usá el mismo valor en mínimo y máximo. Monoambiente es 0. Null si el cliente no lo dijo." },
        max_price: { type: ["number", "null"], description: "Precio máximo que dijo el cliente, en la moneda de la propiedad (USD para venta, ARS para alquiler suele ser lo habitual). Null si no dio presupuesto." },
        keyword: { type: ["string", "null"], description: "Una característica puntual que pidió el cliente: cochera, patio, pileta, a estrenar, etc. Null si no pidió ninguna." },
      },
      required: ["operation", "property_type", "city", "min_bedrooms", "max_bedrooms", "max_price", "keyword"],
      additionalProperties: false,
    },
  },
  {
    name: "get_agency_options",
    description:
      "Consulta la información oficial y vigente de la inmobiliaria: nombre, dirección, contacto, WhatsApp y si hay alguien disponible para atender por WhatsApp ahora mismo. Usala antes de responder cualquier pregunta sobre el negocio o de ofrecer hablar con una persona.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
];

// El modelo pasa lo que escribió el cliente ("depto", "lotes", "dúplex"): acá
// se lleva al tipo como está cargado en el catálogo.
const PROPERTY_TYPE_ALIASES: Record<string, string> = {
  depto: "departamento",
  dpto: "departamento",
  dto: "departamento",
  monoambiente: "departamento",
  lote: "terreno",
  garage: "cochera",
  garaje: "cochera",
  quinta: "casa quinta",
};

function propertyTypeTerm(raw: string): string {
  const word = raw.trim().toLowerCase();
  const singular = word.endsWith("s") ? word.slice(0, -1) : word;
  return PROPERTY_TYPE_ALIASES[singular] ?? singular;
}

// El modelo a veces manda comodines ("*", "todas") en vez de dejar el filtro vacío.
const WILDCARD_FILTERS = new Set(["*", "-", "todas", "todos", "cualquiera", "cualquier", "any", "all", "null", "n/a"]);

function filterText(value: unknown, maxLength = 60): string | undefined {
  const text = optionalText(value, maxLength);
  return text && !WILDCARD_FILTERS.has(text.toLowerCase()) ? text : undefined;
}

function publishedWhere(tenantId: string) {
  return { tenantId, published: true, listings: { some: { status: "AVAILABLE" as const } } };
}

// Lo que hay de verdad en el catálogo. Va en las instrucciones para que el
// modelo no busque en lugares u operaciones donde la inmobiliaria no trabaja.
export async function getCatalogSummary(tenantId: string): Promise<string> {
  const rows = await prisma.estateProperty.findMany({
    where: publishedWhere(tenantId),
    select: {
      propertyType: true,
      city: true,
      neighborhood: true,
      listings: { where: { status: "AVAILABLE" }, select: { operation: true } },
    },
  });
  if (rows.length === 0) return "Ahora no hay propiedades publicadas.";
  const distinct = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))].join(", ");
  const operations = new Set(rows.flatMap((row) => row.listings.map((listing) => listing.operation)));
  const operationText = [operations.has("SALE") && "venta", operations.has("RENT") && "alquiler"].filter(Boolean).join(" y ");
  return [
    `${rows.length} propiedades publicadas.`,
    `Operaciones: ${operationText}.`,
    `Tipos: ${distinct(rows.map((row) => row.propertyType))}.`,
    `Ciudades: ${distinct(rows.map((row) => row.city))}.`,
    `Barrios: ${distinct(rows.map((row) => row.neighborhood))}.`,
  ].join(" ");
}

// Respuesta cuando el modelo no llega a redactar una: el cliente igual ve lo
// que se encontró en vez de un error.
export function assistantFallbackText(propertyCount: number): string {
  return propertyCount > 0
    ? "Encontré estas opciones que pueden interesarte. Contame si querés más detalles de alguna."
    : "No encontré propiedades con esos datos. ¿Querés que busquemos con otra zona, tipo o presupuesto?";
}

function propertyDto(
  property: {
    id: string;
    title: string;
    city: string;
    neighborhood: string;
    bedrooms: number;
    media: { url: string }[];
    listings: { operation: string; price: unknown; currency: string; showPrice: boolean }[];
  },
): AssistantProperty {
  const listing = property.listings[0];
  return {
    id: property.id,
    title: property.title,
    operation: listing?.operation ?? "SALE",
    price: listing?.price != null ? Number(listing.price) : null,
    currency: listing?.currency ?? "USD",
    showPrice: listing?.showPrice ?? true,
    city: property.city,
    neighborhood: property.neighborhood,
    bedrooms: property.bedrooms,
    image: property.media[0]?.url ?? null,
    href: `/propiedades/${property.id}`,
  };
}

export async function executeAssistantTool(
  tenantId: string,
  name: string,
  rawArgs: unknown,
): Promise<{ output: string; properties?: AssistantProperty[] }> {
  const args = safeToolArgs(rawArgs);

  if (name === "search_properties") {
    const operation = args.operation === "SALE" || args.operation === "RENT" ? args.operation : undefined;
    const rawPropertyType = filterText(args.property_type);
    const propertyType = rawPropertyType ? propertyTypeTerm(rawPropertyType) : undefined;
    const city = filterText(args.city);
    const keyword = filterText(args.keyword);
    const minBedrooms = optionalNumber(args.min_bedrooms);
    const maxBedrooms = optionalNumber(args.max_bedrooms);
    const maxPrice = optionalNumber(args.max_price);
    const listingWhere = {
      status: "AVAILABLE" as const,
      ...(operation ? { operation: operation as "SALE" | "RENT" } : {}),
      ...(maxPrice !== undefined ? { price: { lte: maxPrice } } : {}),
    };

    const rows = await prisma.estateProperty.findMany({
      where: {
        tenantId,
        published: true,
        ...(propertyType ? { propertyType: { contains: propertyType, mode: "insensitive" as const } } : {}),
        AND: [
          ...(city
            ? [{ OR: [
                { city: { contains: city, mode: "insensitive" as const } },
                { neighborhood: { contains: city, mode: "insensitive" as const } },
              ] }]
            : []),
          ...(keyword
            ? [{ OR: [
                { title: { contains: keyword, mode: "insensitive" as const } },
                { description: { contains: keyword, mode: "insensitive" as const } },
                ...(/cochera|garage|garaje/i.test(keyword) ? [{ garages: { gt: 0 } }] : []),
              ] }]
            : []),
        ],
        ...(minBedrooms !== undefined || maxBedrooms !== undefined
          ? { bedrooms: { ...(minBedrooms !== undefined ? { gte: minBedrooms } : {}), ...(maxBedrooms !== undefined ? { lte: maxBedrooms } : {}) } }
          : {}),
        listings: { some: listingWhere },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        city: true,
        neighborhood: true,
        bedrooms: true,
        garages: true,
        propertyType: true,
        media: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        listings: {
          where: listingWhere,
          take: 1,
          select: { operation: true, price: true, currency: true, showPrice: true },
        },
      },
    });
    const properties = rows.map(propertyDto);
    const details = new Map(rows.map((row) => [row.id, row]));
    return {
      properties,
      output: JSON.stringify({
        properties: properties.map((p) => ({
          id: p.id,
          title: p.title,
          operation: p.operation,
          price: p.showPrice ? p.price : null,
          currency: p.currency,
          city: p.city,
          neighborhood: p.neighborhood,
          bedrooms: p.bedrooms,
          garages: details.get(p.id)?.garages ?? 0,
          type: details.get(p.id)?.propertyType,
        })),
        count: properties.length,
        ...(properties.length === 0
          ? { note: "No hay propiedades con estos filtros. Decíselo al cliente y ofrecé alternativas del catálogo disponible. No repitas la búsqueda." }
          : {}),
      }),
    };
  }

  if (name === "get_agency_options") {
    const [settings, status] = await Promise.all([
      getStoreSettings(tenantId),
      getAssistantStatus(tenantId),
    ]);
    const humanSupport = status.humanSeller;
    return {
      output: JSON.stringify({
        agency: {
          name: settings.storeName,
          address: settings.address || undefined,
          city: settings.city || undefined,
          phone: settings.phone || undefined,
          whatsapp: settings.whatsapp || undefined,
          instagram: settings.instagram || undefined,
        },
        humanSupport: {
          available: humanSupport.available,
          schedule: humanSupport.scheduleText,
          whatsappUrl: humanSupport.whatsappUrl,
        },
      }),
    };
  }

  return { output: JSON.stringify({ error: "Herramienta desconocida" }) };
}

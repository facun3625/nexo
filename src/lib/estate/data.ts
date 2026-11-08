import { inquiryChannelWhere, type InquiryChannel } from "./inquiry-channels";
import { prisma } from "@/lib/prisma";
import { labels, money, dateLabel } from "./modules";

export type EstateRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  detail: string;
  // Quién dejó la consulta en su estado actual (solo Consultas).
  statusBy?: string;
  values: Record<string, string | boolean | string[]>;
  media?: { id: string; url: string }[];
};
function values(record: object): Record<string, string | boolean | string[]> {
  return Object.fromEntries(
    Object.entries(record)
      .filter(
        ([, v]) =>
          v === null ||
          ["string", "boolean", "number"].includes(typeof v) ||
          v instanceof Date ||
          (Array.isArray(v) && v.every((x) => typeof x === "string")) ||
          (v && typeof v === "object" && "toFixed" in v),
      )
      .map(([k, v]) => [
        k,
        v === null
          ? ""
          : v instanceof Date
            ? new Date(v.getTime() - 3 * 3600000).toISOString().slice(0, 16)
            : typeof v === "boolean" || Array.isArray(v)
              ? v
              : String(v),
      ]),
  );
}
export type EstateFilters = {
  channel?: InquiryChannel;
  assignedAgentId?: string;
  operation?: string;
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  bedroomsMin?: number;
  bathroomsMin?: number;
  garagesMin?: number;
  role?: string;
};

export async function estateRows(
  module: string,
  tenantId: string,
  q: string,
  skip = 0,
  id?: string,
  filters: EstateFilters = {},
): Promise<EstateRow[]> {
  const scope = { tenantId, ...(id ? { id } : {}) };
  const paging = { take: 51, skip };
  const contains = q
    ? { contains: q, mode: "insensitive" as const }
    : undefined;
  switch (module) {
    case "operaciones":
      return (
        await prisma.estateDeal.findMany({
          where: {
            ...scope,
            ...(contains
              ? {
                  OR: [
                    { property: { title: contains } },
                    { contact: { name: contains } },
                  ],
                }
              : {}),
          },
          include: { property: true, contact: true },
          orderBy: { updatedAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.property.title,
        subtitle: `${r.contact.name} · ${labels[r.operation]}`,
        status: labels[r.stage],
        detail: r.amount ? money(r.amount, r.currency) : "Sin importe acordado",
        values: values(r),
      }));
    case "tasaciones":
      return (
        await prisma.estateValuation.findMany({
          where: { ...scope, address: contains },
          include: { contact: true },
          orderBy: { createdAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.address,
        subtitle: r.contact.name,
        status: labels[r.status],
        detail: r.amount
          ? money(r.amount, r.currency)
          : "Pendiente de valoración",
        values: values(r),
      }));
    case "clientes":
      return (
        await prisma.estateContact.findMany({
          where: {
            ...scope,
            ...(contains
              ? {
                  OR: [
                    { name: contains },
                    { email: contains },
                    { phone: contains },
                  ],
                }
              : {}),
            ...(filters.role ? { roles: { has: filters.role } } : {}),
          },
          orderBy: { name: "asc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: [r.email, r.phone].filter(Boolean).join(" · "),
        status: r.roles.map((x) => labels[x]).join(" · "),
        detail: r.notes,
        values: values(r),
      }));
    case "agentes":
      return (
        await prisma.estateAgent.findMany({
          where: {
            ...scope,
            ...(contains
              ? { OR: [{ name: contains }, { email: contains }, { phone: contains }] }
              : {}),
          },
          orderBy: { name: "asc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: [r.email, r.phone].filter(Boolean).join(" · "),
        status: r.accessEnabled && r.userId ? "Acceso habilitado" : "Sin acceso",
        detail: "Abrir para configurar el acceso personal",
        values: values(r),
      }));
    case "propiedades":
      return (
        await prisma.estateProperty.findMany({
          where: {
            ...scope,
            ...(contains
              ? {
                  OR: [
                    { title: contains },
                    { code: contains },
                    { city: contains },
                  ],
                }
              : {}),
            ...(filters.operation
              ? { listings: { some: { operation: filters.operation } } }
              : {}),
            ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
            ...(filters.city ? { city: filters.city } : {}),
            ...(filters.neighborhood ? { neighborhood: filters.neighborhood } : {}),
            ...(filters.bedroomsMin ? { bedrooms: { gte: filters.bedroomsMin } } : {}),
            ...(filters.bathroomsMin ? { bathrooms: { gte: filters.bathroomsMin } } : {}),
            ...(filters.garagesMin ? { garages: { gte: filters.garagesMin } } : {}),
          },
          include: {
            listings: true,
            owner: true,
            media: { orderBy: { position: "asc" } },
          },
          orderBy: { createdAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: `${r.code} · ${r.city} · ${r.propertyType}`,
        status: r.published ? "Publicada" : "Borrador",
        detail: r.listings
          .map(
            (l) =>
              `${labels[l.operation]}: ${l.price ? money(l.price, l.currency) : "Consultar"}`,
          )
          .join(" · "),
        media: r.media.map((m) => ({ id: m.id, url: m.url })),
        values: (() => {
          const sale = r.listings.find((l) => l.operation === "SALE");
          const rent = r.listings.find((l) => l.operation === "RENT");
          const offerType =
            sale && rent
              ? "BOTH"
              : rent
                ? rent.temporary
                  ? "RENT_TEMP"
                  : "RENT"
                : "SALE";
          return {
            ...values(r),
            creditEligible: r.creditEligible == null ? "" : r.creditEligible ? "Sí" : "No",
            offerType,
            salePrice: sale?.price?.toString() ?? "",
            saleCurrency: sale?.currency ?? "USD",
            saleWhatsapp: sale?.whatsapp ?? "",
            saleShowPrice: sale?.showPrice ?? true,
            rentPrice: rent?.price?.toString() ?? "",
            rentCurrency: rent?.currency ?? "ARS",
            rentWhatsapp: rent?.whatsapp ?? "",
            rentShowPrice: rent?.showPrice ?? true,
          };
        })(),
      }));
    case "consultas":
      return (
        await prisma.estateInquiry.findMany({
          where: {
            ...scope,
            ...(!id && filters.channel ? inquiryChannelWhere(filters.channel) : {}),
            ...(!id && filters.assignedAgentId ? { assignedAgentId: filters.assignedAgentId === "unassigned" ? null : filters.assignedAgentId } : {}),
            ...(contains
              ? { OR: [{ message: contains }, { contact: { name: contains } }] }
              : {}),
          },
          include: {
            contact: true,
            property: true,
            assignedAgent: true,
            statusChanges: { orderBy: { createdAt: "desc" }, take: 1, select: { changedByName: true } },
          },
          orderBy: { createdAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.contact.name,
        subtitle: r.searchCriteria ? "Búsqueda guardada · Ver coincidencias" : r.property?.title ?? "Consulta general",
        status: labels[r.status],
        statusBy: r.status === "NEW" ? undefined : r.statusChanges[0]?.changedByName,
        detail: `${r.assignedAgent ? `Responsable: ${r.assignedAgent.name}` : "Sin asignar"} · ${r.message}`,
        values: values(r),
      }));
    case "visitas":
      return (
        await prisma.estateVisit.findMany({
          where: {
            ...scope,
            ...(contains
              ? {
                  OR: [
                    { agentName: contains },
                    { contact: { name: contains } },
                    { property: { title: contains } },
                  ],
                }
              : {}),
          },
          include: { contact: true, property: true },
          orderBy: { startsAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.property.title,
        subtitle: `${r.contact.name} · ${r.agentName}`,
        status: labels[r.status],
        detail: new Intl.DateTimeFormat("es-AR", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/Argentina/Cordoba",
        }).format(r.startsAt),
        values: values(r),
      }));
    case "contratos":
      return (
        await prisma.estateContract.findMany({
          where: {
            ...scope,
            ...(contains
              ? {
                  OR: [
                    { reference: contains },
                    { contact: { name: contains } },
                  ],
                }
              : {}),
          },
          include: { contact: true, property: true },
          orderBy: { createdAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.reference,
        subtitle: `${r.property.title} · ${r.contact.name}`,
        status: labels[r.status],
        detail: `${money(r.amount, r.currency)} · Vence ${dateLabel(r.endsAt)}`,
        values: values(r),
      }));
    case "emprendimientos":
      return (
        await prisma.estateDevelopment.findMany({
          where: { ...scope, name: contains },
          orderBy: { createdAt: "desc" },
          ...paging,
        })
      ).map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: r.city,
        status: labels[r.stage],
        detail: r.description,
        values: values(r),
      }));
    default:
      return [];
  }
}
export async function estateOptions(tenantId: string) {
  const [
    contacts,
    owners,
    agents,
    properties,
    developments,
    contracts,
    propertyTypes,
    cities,
    neighborhoods,
    contractTypes,
    propertyDestinations,
  ] = await Promise.all([
      prisma.estateContact.findMany({
        where: { tenantId, archived: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.estateContact.findMany({
        where: { tenantId, archived: false, roles: { has: "OWNER" } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.estateAgent.findMany({
        where: { tenantId },
        select: { id: true, name: true, phone: true },
        orderBy: { name: "asc" },
      }),
      prisma.estateProperty.findMany({
        where: { tenantId },
        select: { id: true, title: true, code: true },
        orderBy: { title: "asc" },
      }),
      prisma.estateDevelopment.findMany({
        where: { tenantId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.estateContract.findMany({
        where: { tenantId },
        select: { id: true, reference: true },
        orderBy: { reference: "asc" },
      }),
      prisma.estatePropertyType.findMany({
        where: { tenantId },
        orderBy: { order: "asc" },
      }),
      prisma.estateCity.findMany({
        where: { tenantId },
        orderBy: { order: "asc" },
      }),
      prisma.estateNeighborhood.findMany({
        where: { tenantId },
        orderBy: { order: "asc" },
      }),
      prisma.estateContractType.findMany({
        where: { tenantId },
        orderBy: { order: "asc" },
      }),
      prisma.estatePropertyDestination.findMany({
        where: { tenantId },
        orderBy: { order: "asc" },
      }),
    ]);
  return {
    contacts: contacts.map((r) => ({ id: r.id, label: r.name })),
    owners: owners.map((r) => ({ id: r.id, label: r.name })),
    // El id acá es el teléfono, no el id de EstateAgent: EstateListing.whatsapp
    // guarda el número como snapshot (mismo criterio que los catálogos de
    // ciudad/barrio), así que elegir el agente carga directamente su
    // teléfono y borrarlo después no rompe propiedades ya guardadas.
    inquiryAgents: agents.map((r) => ({ id: r.id, label: r.name })),
    agents: agents.map((r) => ({ id: r.phone, label: `${r.name} · ${r.phone}` })),
    properties: properties.map((r) => ({
      id: r.id,
      label: `${r.code} · ${r.title}`,
    })),
    developments: developments.map((r) => ({ id: r.id, label: r.name })),
    contracts: contracts.map((r) => ({ id: r.id, label: r.reference })),
    propertyTypes: propertyTypes.map((r) => r.name),
    cities: cities.map((r) => r.name),
    neighborhoods: neighborhoods.map((r) => r.name),
    contractTypes: contractTypes.map((r) => r.name),
    propertyDestinations: propertyDestinations.map((r) => r.name),
  };
}

// Ciudades y barrios reales de la cartera del tenant, para los filtros de
// Propiedades — a diferencia del tipo de inmueble (lista fija en modules.ts),
// estos los carga cada agencia a mano y no tiene sentido un enum.
// publishedOnly: el buscador público solo debe ofrecer valores que existan
// entre las propiedades publicadas (si no, se puede elegir una ciudad que
// da 0 resultados, o revelar la ciudad de un borrador todavía no publicado).
export async function estatePropertyFilterOptions(tenantId: string, options?: { publishedOnly?: boolean }) {
  const [rows, propertyTypes] = await Promise.all([
    prisma.estateProperty.findMany({
      where: { tenantId, ...(options?.publishedOnly ? { published: true } : {}) },
      select: { city: true, neighborhood: true },
    }),
    prisma.estatePropertyType.findMany({
      where: { tenantId },
      orderBy: { order: "asc" },
      select: { name: true },
    }),
  ]);
  const cities = Array.from(new Set(rows.map((r) => r.city).filter(Boolean))).sort();
  const neighborhoods = Array.from(new Set(rows.map((r) => r.neighborhood).filter(Boolean))).sort();
  return { cities, neighborhoods, propertyTypes: propertyTypes.map((t) => t.name) };
}

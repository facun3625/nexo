import { prisma } from "@/lib/prisma";

// Use the tenant catalogs, including cities/types with no current listings.
export async function getSearchOptions(tenantId: string) {
  const [cities, propertyTypes] = await Promise.all([
    prisma.estateCity.findMany({ where: { tenantId }, select: { name: true }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.estatePropertyType.findMany({ where: { tenantId }, select: { name: true }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);
  return { cities: cities.map((row) => row.name), propertyTypes: propertyTypes.map((row) => row.name) };
}

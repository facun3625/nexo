import prisma from "@/lib/prisma";

interface PropertyData {
  id: string;
  city: string;
  propertyType: string;
  type: string;
  bedrooms?: number | null;
}

// Encuentra alertas que coincidan con la propiedad y las marca como pendientes
export async function checkAlertsForProperty(property: PropertyData) {
  try {
    const matching = await prisma.propertyAlert.findMany({
      where: {
        AND: [
          { OR: [{ ciudad: null }, { ciudad: property.city }] },
          { OR: [{ tipo: null }, { tipo: property.propertyType }] },
          { OR: [{ operacion: null }, { operacion: property.type }] },
          { OR: [{ dormitorios: null }, { dormitorios: property.bedrooms ?? null }] },
        ],
      },
    });

    if (matching.length === 0) return 0;

    await prisma.propertyAlert.updateMany({
      where: { id: { in: matching.map((a) => a.id) } },
      data: { pending: true, lastMatchPropertyId: property.id },
    });

    return matching.length;
  } catch {
    return 0;
  }
}

// Cuenta alertas pendientes (para el badge del sidebar)
export async function getPendingAlertsCount() {
  return prisma.propertyAlert.count({ where: { pending: true } });
}

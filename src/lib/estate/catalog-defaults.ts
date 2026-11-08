import type { Prisma } from "@/generated/prisma/client";

type Tx = Pick<Prisma.TransactionClient, "estatePropertyType">;

const DEFAULT_PROPERTY_TYPES = [
  "Casa",
  "Departamento",
  "Terreno",
  "Local",
  "Oficina",
  "Galpón",
  "Campo",
  "Cochera",
];

export async function seedEstateCatalogDefaults(tx: Tx, tenantId: string) {
  await tx.estatePropertyType.createMany({
    data: DEFAULT_PROPERTY_TYPES.map((name, order) => ({ tenantId, name, order })),
  });
}

import { cache } from "react";
import { prisma } from "@/lib/prisma";

// App de un solo tenant: no hay subdominio ni dominio propio que resolver,
// siempre es la única fila de Tenant.
export const getCurrentTenant = cache(async () => {
  return prisma.tenant.findFirst();
});

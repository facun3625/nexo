import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

// Cambiar este identificador cuando una migración agregue campos usados por
// el código. Next conserva globalThis entre hot reloads; sin esta marca puede
// seguir reutilizando un cliente generado con el esquema anterior.
const PRISMA_SCHEMA_VERSION = "20261105-price-alerts-qr";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const cachedPrisma = globalForPrisma.prisma;

// Durante el hot reload, globalThis puede conservar una instancia creada con
// un cliente anterior a la última generación. Si todavía no tiene alguno de
// los delegates actuales, la reemplazamos sin exigir reiniciar `next dev`.
export const prisma =
  cachedPrisma && globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION
    ? cachedPrisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
}

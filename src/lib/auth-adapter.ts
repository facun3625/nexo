import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { prisma } from "@/lib/prisma";

// El esquema todavía identifica usuarios y cuentas por la clave compuesta
// tenantId+email / tenantId+provider+providerAccountId (ver schema.prisma)
// en vez de email / provider+providerAccountId solos, así que no alcanza
// con el adapter estándar de Prisma — estas operaciones puntuales siguen
// pasando el único tenantId de esta app.
export function tenantAwareAdapter(tenantId: string): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    createUser: async (data) => {
      return prisma.user.create({ data: { ...data, tenantId } });
    },
    getUserByEmail: async (email) => {
      return prisma.user.findUnique({ where: { tenantId_email: { tenantId, email } } });
    },
    getUserByAccount: async ({ provider, providerAccountId }) => {
      const account = await prisma.account.findUnique({
        where: { tenantId_provider_providerAccountId: { tenantId, provider, providerAccountId } },
        include: { user: true },
      });
      return account?.user ?? null;
    },
    linkAccount: async (data) => {
      await prisma.account.create({ data: { ...data, tenantId } });
    },
    unlinkAccount: async ({ provider, providerAccountId }) => {
      await prisma.account.delete({
        where: { tenantId_provider_providerAccountId: { tenantId, provider, providerAccountId } },
      });
    },
  };
}

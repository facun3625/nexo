import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { actorName } from "@/lib/estate/inquiry-status";

type Db = Prisma.TransactionClient | typeof prisma;

export type ActivityEntry = {
  entity: string;
  entityId?: string | null;
  action: string;
  summary: string;
};

type Actor = { id?: string | null; name?: string | null; email?: string | null };

// Registro de actividad del panel ("quién hizo qué y cuándo"). Nunca hace
// fallar la acción que lo llama: si no se puede registrar, se sigue.
export async function logActivity(
  tenantId: string,
  entry: ActivityEntry,
  options: { db?: Db; user?: Actor | null } = {},
) {
  try {
    const user = options.user ?? (await auth())?.user ?? null;
    await (options.db ?? prisma).estateAuditEvent.create({
      data: {
        tenantId,
        actorId: user?.id ?? "",
        actorName: actorName(user),
        entity: entry.entity,
        entityId: entry.entityId ?? "",
        action: entry.action,
        summary: entry.summary.slice(0, 300),
      },
    });
  } catch (error) {
    console.error("No se pudo registrar la actividad", error);
  }
}

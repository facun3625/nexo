"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { toUserError } from "@/lib/action-error";

const refresh = () => revalidatePath("/admin", "layout");

export async function markQrVisitHandled(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.estateQrVisit.updateMany({ where: { id, tenantId: tenant.id }, data: { handledAt: new Date() } });
    refresh();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo actualizar");
  }
}

export async function markAllQrVisitsHandled() {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.estateQrVisit.updateMany({ where: { tenantId: tenant.id, handledAt: null }, data: { handledAt: new Date() } });
    refresh();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo actualizar");
  }
}

export async function deleteQrVisit(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.estateQrVisit.deleteMany({ where: { id, tenantId: tenant.id } });
    refresh();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo borrar");
  }
}

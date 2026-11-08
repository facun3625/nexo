"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";

const refresh = () => revalidatePath("/admin", "layout");

// Avisado: el precio actual pasa a ser la referencia, así la próxima baja
// vuelve a aparecer en la lista.
export async function markPriceAlertNotified(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const alert = await prisma.estatePriceAlert.findFirst({ where: { id, tenantId: tenant.id } });
    if (!alert) throw new ActionError("Aviso no encontrado");
    const listing = await prisma.estateListing.findFirst({
      where: { tenantId: tenant.id, propertyId: alert.propertyId, operation: alert.operation },
    });
    const sameCurrency = listing?.price && listing.currency === alert.currency;
    await prisma.estatePriceAlert.update({
      where: { id },
      data: { notifiedAt: new Date(), ...(sameCurrency ? { baselinePrice: listing.price! } : {}) },
    });
    refresh();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo marcar como avisado");
  }
}

export async function deletePriceAlert(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.estatePriceAlert.deleteMany({ where: { id, tenantId: tenant.id } });
    refresh();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo borrar el aviso");
  }
}

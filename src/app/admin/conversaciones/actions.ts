"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/activity-log";

// Marca una conversación como atendida (ya se contactó al visitante o no hace falta) o la vuelve a dejar pendiente.
export async function setConversationHandled(id: string, handled: boolean): Promise<void> {
  const { tenant } = await requireTenantAdmin();
  await prisma.estateAiConversation.update({
    where: { id, tenantId: tenant.id },
    data: { handledAt: handled ? new Date() : null },
  });
  revalidatePath("/admin/conversaciones");
  revalidatePath(`/admin/conversaciones/${id}`);
}

export async function deleteConversation(id: string): Promise<void> {
  const { tenant } = await requireTenantAdmin();
  await prisma.estateAiConversation.delete({ where: { id, tenantId: tenant.id } });
  await logActivity(tenant.id, { entity: "conversaciones", entityId: id, action: "DELETE", summary: "Eliminó una conversación del asistente IA" });
  revalidatePath("/admin/conversaciones");
}

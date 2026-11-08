"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/require-agent";
import { prisma } from "@/lib/prisma";
import { ActionError, toUserError } from "@/lib/action-error";
import { canAccessInquiry } from "@/lib/agent-permissions";
import { INQUIRY_STATUSES, logInquiryStatusChange } from "@/lib/estate/inquiry-status";
export async function updateAssignedInquiry(id: string, form: FormData) {
  try {
    const { tenant, agent, session, permissions } = await requireAgent();
    const data = z.object({ status: z.enum(INQUIRY_STATUSES), notes: z.string().trim().max(15000) }).parse(Object.fromEntries(form));
    const inquiry = await prisma.estateInquiry.findFirst({ where: { id, tenantId: tenant.id } });
    if (!inquiry || !canAccessInquiry(permissions, agent.id, inquiry))
      throw new ActionError("No tenés permiso para actualizar esta consulta");
    await prisma.$transaction(async (tx) => {
      await tx.estateInquiry.update({ where: { id, tenantId: tenant.id }, data });
      await logInquiryStatusChange(tx, id, inquiry.status, data.status, { ...session.user, name: session.user.name || agent.name });
    });
    revalidatePath("/agente");
    revalidatePath("/admin/gestion/consultas");
    revalidatePath("/admin/gestion/busquedas");
    return { ok: true };
  } catch (error) { return toUserError(error, "No se pudo actualizar la consulta"); }
}

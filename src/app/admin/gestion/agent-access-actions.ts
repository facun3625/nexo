"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { ActionError, toUserError } from "@/lib/action-error";
import { agentPermissionsFromForm } from "@/lib/agent-permissions";

export async function saveAgentAccess(agentId: string, form: FormData) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    if (session.user.role !== "ADMIN") throw new ActionError("Sólo un administrador puede modificar accesos de agentes");
    const agent = await prisma.estateAgent.findFirst({ where: { id: agentId, tenantId: tenant.id } });
    if (!agent) throw new ActionError("Agente no encontrado");
    const enabled = form.get("enabled") === "on";
    const permissions = agentPermissionsFromForm(form);
    if (!enabled) {
      await prisma.estateAgent.update({ where: { id: agent.id, tenantId: tenant.id }, data: { accessEnabled: false, permissions } });
    } else {
      const email = z.email("Ingresá un email válido").max(254).parse(String(form.get("email") ?? "").trim().toLowerCase());
      const password = z.union([z.literal(""), z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(72, "La contraseña puede tener hasta 72 caracteres")]).parse(String(form.get("password") ?? ""));
      if (!agent.userId && !password) throw new ActionError("Ingresá una contraseña para crear el acceso");
      const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;
      await prisma.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } });
        if (existing && existing.id !== agent.userId) throw new ActionError("Ese email ya pertenece a otra cuenta. Usá otro email para el agente.");
        const user = agent.userId
          ? await tx.user.update({ where: { id: agent.userId, tenantId: tenant.id, role: "AGENT" }, data: { email, name: agent.name, passwordHash } })
          : await tx.user.create({ data: { tenantId: tenant.id, role: "AGENT", email, name: agent.name, passwordHash } });
        await tx.estateAgent.update({ where: { id: agent.id, tenantId: tenant.id }, data: { userId: user.id, accessEnabled: true, permissions } });
      });
    }
    revalidatePath("/admin/gestion/agentes");
    revalidatePath("/agente");
    return { ok: true };
  } catch (error) { return toUserError(error, "No se pudo guardar el acceso del agente"); }
}

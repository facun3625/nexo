import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { agentSectionForPath, parseAgentPermissions } from "@/lib/agent-permissions";

export async function requireTenantAdmin() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Tienda no encontrada");

  const session = await auth();
  if (session?.user.role === "ADMIN" && session.user.tenantId === tenant.id) {
    return { session, tenant };
  }
  if (session?.user.role !== "AGENT" || session.user.tenantId !== tenant.id) {
    throw new Error("No autorizado");
  }
  const pathname = (await headers()).get("x-pathname") ?? "";

  const section = agentSectionForPath(pathname);
  const agent = await prisma.estateAgent.findFirst({
    where: { tenantId: tenant.id, userId: session.user.id, accessEnabled: true },
    select: { permissions: true },
  });
  const permissions = parseAgentPermissions(agent?.permissions);
  if (!section || permissions[section] === "NONE") throw new Error("No autorizado");
  return { session, tenant, permissions };
}

export async function requireTenantAdminWithPlan() {
  const access = await requireTenantAdmin();
  const { session, tenant } = access;
  return {
    session,
    tenant,
    permissions: "permissions" in access ? access.permissions : undefined,
  };
}

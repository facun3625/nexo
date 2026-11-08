import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { parseAgentPermissions } from "@/lib/agent-permissions";

export async function requireAgent() {
  const [session, tenant] = await Promise.all([auth(), getCurrentTenant()]);
  if (!session?.user) redirect("/login?callbackUrl=/agente");
  if (!tenant || session.user.tenantId !== tenant.id || session.user.role !== "AGENT") redirect("/");
  const agent = await prisma.estateAgent.findFirst({
    where: { tenantId: tenant.id, userId: session.user.id, accessEnabled: true, user: { role: "AGENT", tenantId: tenant.id } },
  });
  if (!agent) redirect("/login?callbackUrl=/agente&agentDisabled=1");
  return { agent, tenant, session, permissions: parseAgentPermissions(agent.permissions) };
}

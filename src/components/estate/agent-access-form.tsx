import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { AgentAccessEditor } from "./agent-access-editor";
import { parseAgentPermissions } from "@/lib/agent-permissions";
export async function AgentAccessForm({ agentId }: { agentId: string }) {
  const { tenant } = await requireTenantAdmin();
  const agent = await prisma.estateAgent.findFirst({ where: { id: agentId, tenantId: tenant.id }, include: { user: { select: { email: true } } } });
  if (!agent) return null;
  return <AgentAccessEditor key={`${agent.id}:${agent.accessEnabled}:${agent.user?.email}`} agentId={agent.id} email={agent.user?.email ?? agent.email ?? ""} enabled={agent.accessEnabled} hasAccount={Boolean(agent.userId)} permissions={parseAgentPermissions(agent.permissions)} />;
}

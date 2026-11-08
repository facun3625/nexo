import type { Prisma } from "@/generated/prisma/client";
import { inquiryChannelFor } from "@/lib/estate/inquiry-channels";
import {
  AGENT_ACCESS_SCOPES,
  DEFAULT_AGENT_PERMISSIONS,
  AGENT_MENU_SECTIONS,
  type AgentAccessScope,
  type AgentPermissions,
} from "@/lib/agent-permission-types";

export {
  AGENT_ACCESS_SCOPES,
  DEFAULT_AGENT_PERMISSIONS,
  AGENT_MENU_SECTIONS,
  type AgentAccessScope,
  type AgentPermissions,
};

export function parseAgentPermissions(value: unknown): AgentPermissions {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const scope = (key: keyof AgentPermissions) =>
    AGENT_ACCESS_SCOPES.includes(raw[key] as AgentAccessScope)
      ? raw[key] as AgentAccessScope
      : DEFAULT_AGENT_PERMISSIONS[key];
  return Object.fromEntries(AGENT_MENU_SECTIONS.map(({ key }) => [key, scope(key)])) as AgentPermissions;
}

export function agentPermissionsFromForm(form: FormData) {
  return parseAgentPermissions(Object.fromEntries(
    AGENT_MENU_SECTIONS.map(({ key }) => [key, form.get(`${key}Access`)]),
  ));
}

export function agentSectionForPath(pathname: string) {
  return AGENT_MENU_SECTIONS
    .filter((section) => pathname === section.href || pathname.startsWith(`${section.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.key;
}

export function inquiryPermissionKey(inquiry: {
  source: string;
  searchCriteria: Prisma.JsonValue | null;
  propertyId: string | null;
}): keyof AgentPermissions {
  return inquiryChannelFor(inquiry) === "searches" ? "searches" : "inquiries";
}

export function canAccessInquiry(
  permissions: AgentPermissions,
  agentId: string,
  inquiry: { source: string; searchCriteria: Prisma.JsonValue | null; propertyId: string | null; assignedAgentId: string | null },
) {
  const scope = permissions[inquiryPermissionKey(inquiry)];
  return scope === "ALL" || (scope === "OWN" && inquiry.assignedAgentId === agentId);
}

export function inquiryScopeWhere(
  scope: AgentAccessScope,
  agentId: string,
): Prisma.EstateInquiryWhereInput | null {
  if (scope === "NONE") return null;
  return scope === "OWN" ? { assignedAgentId: agentId } : {};
}

import { Prisma } from "@/generated/prisma/client";

export const inquiryChannels = { property: "Por propiedad", searches: "Búsquedas de propiedades", ai: "Generadas por IA", general: "Generales" } as const;
export type InquiryChannel = keyof typeof inquiryChannels;
export function parseInquiryChannel(value: string | undefined): InquiryChannel {
  return value && Object.hasOwn(inquiryChannels, value) ? value as InquiryChannel : "property";
}
export function inquiryChannelWhere(channel: InquiryChannel): Prisma.EstateInquiryWhereInput {
  if (channel === "ai") return { source: "AI_AGENT" };
  const search = { OR: [{ source: "ALERTA" }, { searchCriteria: { not: Prisma.DbNull } }] };
  if (channel === "searches") return { AND: [{ source: { not: "AI_AGENT" } }, search] };
  return { AND: [{ source: { not: "AI_AGENT" } }, { NOT: search }, { propertyId: channel === "property" ? { not: null } : null }] };
}

export function inquiryChannelFor(inquiry: { source: string; searchCriteria: unknown; propertyId: string | null }): InquiryChannel {
  if (inquiry.source === "AI_AGENT") return "ai";
  if (inquiry.source === "ALERTA" || inquiry.searchCriteria != null) return "searches";
  return inquiry.propertyId ? "property" : "general";
}

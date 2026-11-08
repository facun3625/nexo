import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ARQ_SETTINGS_KEY, mergeArqContent, type ArqContent } from "@/lib/arquitectura";

export const getArqContent = cache(async (tenantId: string): Promise<ArqContent> => {
  const row = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId, key: ARQ_SETTINGS_KEY } },
  });
  let stored: unknown = null;
  try {
    stored = row ? JSON.parse(row.value) : null;
  } catch {
    stored = null;
  }
  return mergeArqContent(stored);
});

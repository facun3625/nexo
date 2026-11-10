import { cache } from "react";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { ARQ_SETTINGS_KEY, arqPageTitle, mergeArqContent, type ArqContent } from "@/lib/arquitectura";

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

// <title> de las páginas de la sección con el nombre que eligió el tenant.
// page null = la página de obras (usa su nombre configurable).
export async function arqMetadata(page: string | null, description: string, canonical: string): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  const { arq } = tenant ? await getStoreSettings(tenant.id) : { arq: null };
  const title = arq ? arqPageTitle(arq, page ?? arq.obrasLabel) : (page ?? "Obras");
  return { title, description, alternates: { canonical } };
}

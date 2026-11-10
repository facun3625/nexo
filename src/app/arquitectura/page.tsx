import { notFound, redirect } from "next/navigation";

import { arqSections } from "@/lib/arquitectura";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// La URL suelta lleva a la primera página prendida (Equipo, o Obras si es
// la única).
export default async function ArquitecturaPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const { arq } = await getStoreSettings(tenant.id);
  redirect(arqSections(arq)[0].href);
}

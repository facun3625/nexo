"use server";

import { getCurrentTenant } from "@/lib/tenant";
import { unsubscribeEmail } from "@/lib/email-marketing/unsubscribe";

export async function confirmUnsubscribe(email: string, token: string) {
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "El sitio no está disponible" };
  const ok = await unsubscribeEmail(tenant.id, email, token);
  return ok ? { ok: true as const } : { error: "El link de baja no es válido. Escribinos y te damos de baja a mano." };
}

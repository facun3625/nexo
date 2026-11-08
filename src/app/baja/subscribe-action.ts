"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { isRateLimited, recordFailure, clientIp } from "@/lib/rate-limit";
import { ActionError, toUserError } from "@/lib/action-error";
import { normalizeEmail } from "@/lib/email-marketing/data";

// Formulario "Recibí novedades" del pie del sitio.
export async function subscribeToNewsletter(form: FormData) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) throw new ActionError("El sitio no está disponible");
    const data = z
      .object({
        email: z.email("Ingresá un mail válido").max(254),
        name: z.string().trim().max(120).optional().default(""),
        website: z.literal(""),
      })
      .parse({ email: String(form.get("email") ?? "").trim(), name: form.get("name") ?? "", website: form.get("website") ?? "" });
    const key = `newsletter:${tenant.id}:${clientIp(await headers())}`;
    if (await isRateLimited(key, { limit: 5, windowMinutes: 60 }))
      throw new ActionError("Ya recibimos varias suscripciones desde acá. Probá más tarde.");
    await recordFailure(key);
    const email = normalizeEmail(data.email);
    await prisma.emailSubscriber.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: { unsubscribedAt: null, ...(data.name ? { name: data.name } : {}) },
      create: { tenantId: tenant.id, email, name: data.name, source: "WEB" },
    });
    revalidatePath("/admin/email-marketing");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No pudimos registrar tu suscripción");
  }
}

"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { isRateLimited, recordFailure, clientIp } from "@/lib/rate-limit";
import { ActionError, toUserError } from "@/lib/action-error";

export async function sendContactInquiry(form: FormData) {
  const tenant = await getCurrentTenant();
  try {
    if (!tenant) throw new ActionError("El sitio no está disponible");
    const data = z
      .object({
        name: z.string().trim().min(2).max(150),
        email: z.email().max(254),
        phone: z.string().trim().max(60).optional().or(z.literal("")),
        message: z.string().trim().min(5).max(3000),
        website: z.literal(""),
      })
      .parse(Object.fromEntries(form));
    const key = `estate-contact:${tenant.id}:${clientIp(await headers())}`;
    if (await isRateLimited(key, { limit: 5, windowMinutes: 60 }))
      throw new ActionError("Ya recibimos varias consultas. Intentá más tarde.");
    await recordFailure(key);
    const contact = await prisma.estateContact.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        roles: ["PROSPECT"],
      },
    });
    await prisma.estateInquiry.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        message: data.message,
        source: "CONTACTO",
      },
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    return toUserError(error, "No pudimos registrar tu consulta");
  }
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { ActionError, toUserError } from "@/lib/action-error";
import { clientIp, isRateLimited, recordFailure } from "@/lib/rate-limit";

const schema = z.object({
  propertyId: z.string().min(1).max(40),
  operation: z.enum(["SALE", "RENT"]),
  name: z.string().trim().min(2, "Ingresá tu nombre").max(150),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 6, "Ingresá un teléfono válido"),
  email: z.email("Ingresá un mail válido").max(254),
  website: z.literal(""),
});

export async function subscribeToPriceDrop(form: FormData) {
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) throw new ActionError("El sitio no está disponible");
    const data = schema.parse(Object.fromEntries(form));
    const key = `price-alert:${tenant.id}:${clientIp(await headers())}`;
    if (await isRateLimited(key, { limit: 10, windowMinutes: 60 }))
      throw new ActionError("Ya recibimos varias solicitudes. Intentá más tarde.");
    await recordFailure(key);

    // El precio de referencia sale de la base, nunca del navegador.
    const listing = await prisma.estateListing.findFirst({
      where: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        operation: data.operation,
        status: "AVAILABLE",
        showPrice: true,
        price: { gt: 0 },
        property: { published: true },
      },
    });
    if (!listing?.price) throw new ActionError("Esta propiedad no tiene un precio publicado");

    const email = data.email.toLowerCase();
    await prisma.estatePriceAlert.upsert({
      where: { propertyId_operation_email: { propertyId: data.propertyId, operation: data.operation, email } },
      update: { name: data.name, phone: data.phone },
      create: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        operation: data.operation,
        currency: listing.currency,
        baselinePrice: listing.price,
        name: data.name,
        phone: data.phone,
        email,
      },
    });
    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No pudimos guardar tu aviso");
  }
}

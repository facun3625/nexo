"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { ActionError, toUserError } from "@/lib/action-error";
import { clientIp, isRateLimited, recordFailure } from "@/lib/rate-limit";
import { QR_COOKIE } from "@/lib/qr";

const schema = z.object({
  propertyId: z.string().min(1).max(40),
  firstName: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  lastName: z.string().trim().min(2, "Ingresá tu apellido").max(80),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 6, "Ingresá un teléfono válido"),
  website: z.literal(""),
});

export async function submitQrGate(form: FormData) {
  let propertyId: string;
  try {
    const tenant = await getCurrentTenant();
    if (!tenant) throw new ActionError("El sitio no está disponible");
    const data = schema.parse(Object.fromEntries(form));
    // Más permisivo que otros formularios: en una visita o un cartel varias
    // personas pueden escanear desde el mismo wifi.
    const key = `qr-gate:${tenant.id}:${clientIp(await headers())}`;
    if (await isRateLimited(key, { limit: 30, windowMinutes: 60 }))
      throw new ActionError("Recibimos muchos ingresos seguidos. Probá en unos minutos.");
    await recordFailure(key);

    const property = await prisma.estateProperty.findFirst({
      where: { id: data.propertyId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!property) throw new ActionError("Propiedad no encontrada");
    const visit = await prisma.estateQrVisit.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });
    // Así este celular no vuelve a completar el formulario en otro QR.
    (await cookies()).set(QR_COOKIE, visit.id, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    revalidatePath("/admin", "layout");
    propertyId = property.id;
  } catch (error) {
    return toUserError(error, "No pudimos registrar tus datos");
  }
  redirect(`/propiedades/${propertyId}`);
}

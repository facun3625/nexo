"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { isRateLimited, recordFailure, clientIp } from "@/lib/rate-limit";
import { ActionError, toUserError } from "@/lib/action-error";
export async function inquireProperty(form: FormData) {
  const tenant = await getCurrentTenant();
  try {
    if (!tenant) throw new ActionError("El sitio no está disponible");
    const data = z
      .object({
        propertyId: z.string().min(1),
        name: z.string().trim().min(2).max(150),
        email: z.email().max(254),
        phone: z.string().trim().min(5).max(60),
        message: z.string().trim().min(5).max(3000),
        website: z.literal(""),
      })
      .parse(Object.fromEntries(form));
    const key = `estate-inquiry:${tenant.id}:${clientIp(await headers())}`;
    if (await isRateLimited(key, { limit: 5, windowMinutes: 60 }))
      throw new ActionError(
        "Ya recibimos varias consultas. Intentá más tarde.",
      );
    await recordFailure(key);
    await prisma.$transaction(async (tx) => {
      if (
        !(await tx.estateProperty.findFirst({
          where: {
            id: data.propertyId,
            tenantId: tenant.id,
            published: true,
            listings: { some: { status: "AVAILABLE" } },
          },
        }))
      )
        throw new ActionError("La propiedad no está disponible");
      const contact = await tx.estateContact.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          roles: ["PROSPECT"],
        },
      });
      await tx.estateInquiry.create({
        data: {
          tenantId: tenant.id,
          contactId: contact.id,
          propertyId: data.propertyId,
          message: data.message,
          source: "WEB",
        },
      });
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    return toUserError(error, "No pudimos registrar tu consulta");
  }
}

// Favoritos guardados sin sesión (localStorage, ver local-favorites.ts) —
// trae las tarjetas para mostrarlas en /favoritos sin depender de un usuario.
export async function getFavoritePropertiesByIds(ids: string[]) {
  const tenant = await getCurrentTenant();
  if (!tenant || !ids.length) return [];
  return prisma.estateProperty.findMany({
    where: { id: { in: ids.slice(0, 200) }, tenantId: tenant.id, published: true },
    include: {
      media: { orderBy: { position: "asc" }, take: 1 },
      listings: { where: { status: "AVAILABLE" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Se llama apenas un visitante anónimo inicia sesión (ver FavoritesSync) —
// vuelca lo que tenía guardado en localStorage a su cuenta.
export async function mergeLocalFavorites(ids: string[]) {
  const tenant = await getCurrentTenant();
  const session = await auth();
  try {
    if (!tenant || !session?.user || !ids.length) return { ok: true };
    const properties = await prisma.estateProperty.findMany({
      where: { id: { in: ids.slice(0, 200) }, tenantId: tenant.id, published: true },
      select: { id: true },
    });
    if (!properties.length) return { ok: true };
    await prisma.estatePropertyFavorite.createMany({
      data: properties.map((p) => ({
        tenantId: tenant.id,
        userId: session.user.id,
        propertyId: p.id,
      })),
      skipDuplicates: true,
    });
    revalidatePath("/favoritos");
    return { ok: true };
  } catch (error) {
    return toUserError(error, "No pudimos guardar tus favoritos anteriores");
  }
}

export async function toggleFavorite(propertyId: string) {
  const tenant = await getCurrentTenant();
  const session = await auth();
  try {
    if (!tenant) throw new ActionError("El sitio no está disponible");
    if (!session?.user)
      throw new ActionError("Iniciá sesión para guardar favoritos");
    const existing = await prisma.estatePropertyFavorite.findUnique({
      where: { userId_propertyId: { userId: session.user.id, propertyId } },
    });
    if (existing) {
      await prisma.estatePropertyFavorite.delete({
        where: { id: existing.id },
      });
      revalidatePath("/favoritos");
      return { ok: true, favorited: false };
    }
    const property = await prisma.estateProperty.findFirst({
      where: { id: propertyId, tenantId: tenant.id, published: true },
    });
    if (!property) throw new ActionError("La propiedad no está disponible");
    await prisma.estatePropertyFavorite.create({
      data: { tenantId: tenant.id, userId: session.user.id, propertyId },
    });
    revalidatePath("/favoritos");
    return { ok: true, favorited: true };
  } catch (error) {
    return toUserError(error, "No pudimos actualizar tus favoritos");
  }
}

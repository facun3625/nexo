"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireTenantAdmin } from "@/lib/require-admin";
import { toUserError } from "@/lib/action-error";
import { requiredText } from "@/lib/estate/validation";

export type CatalogKind =
  | "propertyTypes"
  | "cities"
  | "neighborhoods"
  | "contractTypes"
  | "propertyDestinations"
  | "developmentCategories";

function refresh() {
  revalidatePath("/admin", "layout");
  // Las categorías de obras se ven como filtros en el sitio público.
  revalidatePath("/arquitectura/obras");
}

function actionError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return { error: "Ya existe un valor con ese nombre." };
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  )
    return { error: "No se encontró ese valor." };
  return toUserError(error, "No se pudo guardar. Intentá nuevamente.");
}

export async function createCatalogItem(kind: CatalogKind, name: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const value = requiredText.parse(name);
    switch (kind) {
      case "propertyTypes": {
        const last = await prisma.estatePropertyType.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estatePropertyType.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
      case "cities": {
        const last = await prisma.estateCity.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estateCity.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
      case "neighborhoods": {
        const last = await prisma.estateNeighborhood.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estateNeighborhood.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
      case "contractTypes": {
        const last = await prisma.estateContractType.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estateContractType.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
      case "propertyDestinations": {
        const last = await prisma.estatePropertyDestination.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estatePropertyDestination.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
      case "developmentCategories": {
        const last = await prisma.estateDevelopmentCategory.aggregate({
          where: { tenantId: tenant.id },
          _max: { order: true },
        });
        await prisma.estateDevelopmentCategory.create({
          data: { tenantId: tenant.id, name: value, order: (last._max.order ?? -1) + 1 },
        });
        break;
      }
    }
    refresh();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function renameCatalogItem(kind: CatalogKind, id: string, name: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const value = requiredText.parse(name);
    const where = { id, tenantId: tenant.id };
    switch (kind) {
      case "propertyTypes":
        await prisma.estatePropertyType.update({ where, data: { name: value } });
        break;
      case "cities":
        await prisma.estateCity.update({ where, data: { name: value } });
        break;
      case "neighborhoods":
        await prisma.estateNeighborhood.update({ where, data: { name: value } });
        break;
      case "contractTypes":
        await prisma.estateContractType.update({ where, data: { name: value } });
        break;
      case "propertyDestinations":
        await prisma.estatePropertyDestination.update({ where, data: { name: value } });
        break;
      case "developmentCategories":
        await prisma.estateDevelopmentCategory.update({ where, data: { name: value } });
        break;
    }
    refresh();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCatalogItem(kind: CatalogKind, id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const where = { id, tenantId: tenant.id };
    switch (kind) {
      case "propertyTypes":
        await prisma.estatePropertyType.delete({ where });
        break;
      case "cities":
        await prisma.estateCity.delete({ where });
        break;
      case "neighborhoods":
        await prisma.estateNeighborhood.delete({ where });
        break;
      case "contractTypes":
        await prisma.estateContractType.delete({ where });
        break;
      case "propertyDestinations":
        await prisma.estatePropertyDestination.delete({ where });
        break;
      case "developmentCategories":
        await prisma.estateDevelopmentCategory.delete({ where });
        break;
    }
    refresh();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

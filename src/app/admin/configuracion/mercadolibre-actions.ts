"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { saveMercadoLibreCredentials, clearMercadoLibreConnection } from "@/lib/mercadolibre/settings";
import { listClassifiedCountries, getCountryStates, getClassifiedState, getClassifiedCity, type MlLocationRef } from "@/lib/mercadolibre/locations";

export async function updateMercadoLibreCredentials(formData: FormData) {
  try {
    return await runUpdateMercadoLibreCredentials(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateMercadoLibreCredentials(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientSecret = String(formData.get("clientSecret") ?? "").trim();
  if (!clientId) throw new ActionError("Ingresá el Client ID de tu app de Mercado Libre");
  await saveMercadoLibreCredentials(tenant.id, clientId, clientSecret || undefined);
  revalidatePath("/admin/configuracion");
  return { ok: true as const };
}

export async function disconnectMercadoLibre() {
  try {
    const { tenant } = await requireTenantAdmin();
    await clearMercadoLibreConnection(tenant.id);
    revalidatePath("/admin/configuracion");
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo desconectar");
  }
}

// ---------- Mapeo de ubicaciones (cascada país fijo AR → estado → ciudad → barrio) ----------

export async function fetchMlStates(): Promise<MlLocationRef[]> {
  const { tenant } = await requireTenantAdmin();
  const countries = await listClassifiedCountries(tenant.id);
  const ar = countries.find((c) => c.id === "AR") ?? countries[0];
  if (!ar) return [];
  return getCountryStates(tenant.id, ar.id);
}

export async function fetchMlCities(stateId: string): Promise<{ id: string; name: string }[]> {
  const { tenant } = await requireTenantAdmin();
  const state = await getClassifiedState(tenant.id, stateId);
  return state.cities;
}

export async function fetchMlNeighborhoods(cityId: string): Promise<{ id: string; name: string }[]> {
  const { tenant } = await requireTenantAdmin();
  const city = await getClassifiedCity(tenant.id, cityId);
  return city.neighborhoods;
}

const locationMappingSchema = z.object({
  city: z.string().trim().min(1),
  neighborhood: z.string().trim().default(""),
  mlStateId: z.string().trim().min(1),
  mlStateName: z.string().trim().min(1),
  mlCityId: z.string().trim().min(1),
  mlCityName: z.string().trim().min(1),
  mlNeighborhoodId: z.string().trim().optional(),
});

export async function saveMlLocationMapping(formData: FormData) {
  try {
    const { tenant } = await requireTenantAdmin();
    const parsed = locationMappingSchema.parse({
      city: formData.get("city"),
      neighborhood: formData.get("neighborhood") ?? "",
      mlStateId: formData.get("mlStateId"),
      mlStateName: formData.get("mlStateName"),
      mlCityId: formData.get("mlCityId"),
      mlCityName: formData.get("mlCityName"),
      mlNeighborhoodId: formData.get("mlNeighborhoodId") || undefined,
    });
    await prisma.estateMlLocation.upsert({
      where: { tenantId_city_neighborhood: { tenantId: tenant.id, city: parsed.city, neighborhood: parsed.neighborhood } },
      create: { tenantId: tenant.id, ...parsed },
      update: parsed,
    });
    revalidatePath("/admin/configuracion");
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo guardar el mapeo de ubicación");
  }
}

export async function deleteMlLocationMapping(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.estateMlLocation.delete({ where: { id, tenantId: tenant.id } });
    revalidatePath("/admin/configuracion");
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo borrar el mapeo");
  }
}

import "server-only";
import { mlFetch } from "@/lib/mercadolibre/client";

export type MlLocationRef = { id: string; name: string };

type MlStateDetail = {
  id: string;
  name: string;
  country: MlLocationRef;
};

type MlCityDetail = {
  id: string;
  name: string;
  state: MlLocationRef;
  country: MlLocationRef;
};

// Jerarquía de ubicación para avisos clasificados (Inmuebles/Vehículos):
// país → estado → ciudad → barrio. ML no tiene un endpoint de búsqueda por
// nombre para esto — solo se navega por ID — así que el admin elige en
// cascada desde /admin/configuracion (una vez por ciudad/barrio, se
// reutiliza para todas las propiedades de esa zona).
export async function listClassifiedCountries(tenantId: string): Promise<MlLocationRef[]> {
  return mlFetch<MlLocationRef[]>(tenantId, "/classified_locations/countries", { auth: false });
}

export async function getClassifiedState(tenantId: string, stateId: string): Promise<MlStateDetail & { cities: MlLocationRef[] }> {
  return mlFetch(tenantId, `/classified_locations/states/${stateId}`, { auth: false });
}

export async function getClassifiedCity(
  tenantId: string,
  cityId: string,
): Promise<MlCityDetail & { neighborhoods: MlLocationRef[] }> {
  return mlFetch(tenantId, `/classified_locations/cities/${cityId}`, { auth: false });
}

// /classified_locations/countries/AR trae `states` anidados (verificado
// contra la API real en nov 2026). Estos endpoints son públicos: el mapeo
// de ubicaciones se puede hacer antes de conectar la cuenta.
export async function getCountryStates(tenantId: string, countryId: string): Promise<MlLocationRef[]> {
  const country = await mlFetch<{ states: MlLocationRef[] }>(tenantId, `/classified_locations/countries/${countryId}`, { auth: false });
  return country.states;
}

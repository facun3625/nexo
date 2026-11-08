import path from "node:path";
import maxmind, { type CityResponse, type Reader } from "maxmind";

// Base local (GeoLite2-City, ver scripts/update-geolite2.sh) — el lookup
// nunca sale del servidor, ninguna IP de un visitante viaja a un tercero.
// Se carga una sola vez y se reusa (abrir el archivo de ~70MB en cada
// consulta sería carísimo).
const DB_PATH = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");

let readerPromise: Promise<Reader<CityResponse> | null> | null = null;

function loadReader(): Promise<Reader<CityResponse> | null> {
  if (!readerPromise) {
    readerPromise = maxmind.open<CityResponse>(DB_PATH).catch((err) => {
      console.warn("ip-geo: no se pudo abrir GeoLite2-City.mmdb —", err instanceof Error ? err.message : err);
      return null;
    });
  }
  return readerPromise;
}

export type GeoLocation = { country: string | null; city: string | null };

const PRIVATE_IP_PATTERN = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|unknown$)/;

export async function lookupGeo(ip: string | null): Promise<GeoLocation | null> {
  if (!ip || PRIVATE_IP_PATTERN.test(ip)) return null;

  const reader = await loadReader();
  if (!reader) return null;

  const result = reader.get(ip);
  if (!result) return null;

  return {
    country: result.country?.names?.en ?? null,
    city: result.city?.names?.en ?? null,
  };
}

import { prisma } from "@/lib/prisma";
import { saveTextSetting } from "@/lib/settings-storage";

export type MercadoLibreSettings = {
  clientId: string | null;
  clientSecret: string | null;
  siteId: string;
  // Credenciales de la app (del portal de developers) — pueden existir sin
  // que todavía haya una cuenta conectada.
  configured: boolean;
  // Hay un access/refresh token guardado (se conectó al menos una vez).
  connected: boolean;
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  // Milisegundos epoch — null si nunca se conectó.
  expiresAt: number | null;
};

const ML_SETTINGS_KEYS = [
  "ml_client_id",
  "ml_client_secret",
  "ml_site_id",
  "ml_user_id",
  "ml_access_token",
  "ml_refresh_token",
  "ml_token_expires_at",
] as const;

// Sin cache() a propósito: getAccessToken() necesita el valor fresco
// después de refrescar el token dentro del mismo request.
export async function getMercadoLibreSettings(tenantId: string): Promise<MercadoLibreSettings> {
  const rows = await prisma.settings.findMany({
    where: { tenantId, key: { in: [...ML_SETTINGS_KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    clientId: map.ml_client_id || null,
    clientSecret: map.ml_client_secret || null,
    siteId: map.ml_site_id || "MLA",
    configured: Boolean(map.ml_client_id && map.ml_client_secret),
    connected: Boolean(map.ml_access_token && map.ml_refresh_token),
    userId: map.ml_user_id || null,
    accessToken: map.ml_access_token || null,
    refreshToken: map.ml_refresh_token || null,
    expiresAt: map.ml_token_expires_at ? Number(map.ml_token_expires_at) : null,
  };
}

export async function saveMercadoLibreCredentials(tenantId: string, clientId: string, clientSecret: string | undefined) {
  await Promise.all([
    saveTextSetting(tenantId, clientId, "ml_client_id"),
    clientSecret ? saveTextSetting(tenantId, clientSecret, "ml_client_secret") : Promise.resolve(),
  ]);
}

export async function saveMercadoLibreTokens(
  tenantId: string,
  tokens: { accessToken: string; refreshToken: string; expiresInSeconds: number; userId: string },
) {
  const expiresAt = Date.now() + tokens.expiresInSeconds * 1000;
  await Promise.all([
    saveTextSetting(tenantId, tokens.accessToken, "ml_access_token"),
    saveTextSetting(tenantId, tokens.refreshToken, "ml_refresh_token"),
    saveTextSetting(tenantId, String(expiresAt), "ml_token_expires_at"),
    saveTextSetting(tenantId, tokens.userId, "ml_user_id"),
  ]);
}

export async function clearMercadoLibreConnection(tenantId: string) {
  await prisma.settings.deleteMany({
    where: { tenantId, key: { in: ["ml_access_token", "ml_refresh_token", "ml_token_expires_at", "ml_user_id"] } },
  });
}

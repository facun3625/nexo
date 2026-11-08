import "server-only";
import { getMercadoLibreSettings, saveMercadoLibreTokens, type MercadoLibreSettings } from "@/lib/mercadolibre/settings";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3011";
const PROTOCOL = ROOT_DOMAIN.startsWith("localhost") ? "http" : "https";

// Mercado Libre resuelve el dominio de autorización a partir del country
// code del usuario, pero mercadolibre.com.ar funciona para cualquier sitio
// — alcanza con mandar el client_id correcto.
const AUTH_BASE_URL = "https://auth.mercadolibre.com.ar/authorization";
const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

export function mercadoLibreRedirectUri(): string {
  return `${PROTOCOL}://${ROOT_DOMAIN}/api/mercadolibre/oauth/callback`;
}

// `state` es un valor random que el caller genera, guarda en una cookie
// propia y compara al volver en el callback — protección CSRF estándar de
// OAuth, nada específico de Mercado Libre.
export function buildAuthorizationUrl(clientId: string, state: string): string {
  const url = new URL(AUTH_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", mercadoLibreRedirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token?: string;
};

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Mercado Libre OAuth falló (${res.status}): ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export async function exchangeCodeForTokens(tenantId: string, code: string): Promise<void> {
  const settings = await getMercadoLibreSettings(tenantId);
  if (!settings.clientId || !settings.clientSecret) {
    throw new Error("Cargá primero el Client ID y el Client Secret de tu app de Mercado Libre");
  }
  const token = await requestToken({
    grant_type: "authorization_code",
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    code,
    redirect_uri: mercadoLibreRedirectUri(),
  });
  if (!token.refresh_token) {
    throw new Error("Mercado Libre no devolvió un refresh_token — revisá que la app tenga el scope offline_access");
  }
  await saveMercadoLibreTokens(tenantId, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresInSeconds: token.expires_in,
    userId: String(token.user_id),
  });
}

async function refreshTokens(tenantId: string, settings: MercadoLibreSettings): Promise<string> {
  if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) {
    throw new Error("No hay conexión con Mercado Libre para refrescar");
  }
  const token = await requestToken({
    grant_type: "refresh_token",
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    refresh_token: settings.refreshToken,
  });
  // El refresh_token es de un solo uso: si ML no manda uno nuevo (no debería
  // pasar), seguimos con el viejo en vez de perder la conexión por completo.
  await saveMercadoLibreTokens(tenantId, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? settings.refreshToken,
    expiresInSeconds: token.expires_in,
    userId: String(token.user_id),
  });
  return token.access_token;
}

const EXPIRY_SAFETY_MARGIN_MS = 60_000;

// Devuelve un access_token válido, refrescándolo si está vencido o a punto
// de vencer. Tirar acá (sin conexión, credenciales faltantes) es la señal
// que usa el resto del módulo para mostrar "conectá tu cuenta primero".
export async function getValidAccessToken(tenantId: string): Promise<string> {
  const settings = await getMercadoLibreSettings(tenantId);
  if (!settings.connected || !settings.accessToken) {
    throw new Error("No hay una cuenta de Mercado Libre conectada");
  }
  const expiresAt = settings.expiresAt ?? 0;
  if (Date.now() < expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
    return settings.accessToken;
  }
  return refreshTokens(tenantId, settings);
}

import "server-only";
import { getValidAccessToken } from "@/lib/mercadolibre/auth";

const API_BASE_URL = "https://api.mercadolibre.com";

export class MercadoLibreApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

// Mercado Libre devuelve el detalle de validación (atributos faltantes,
// etc.) en el campo `message`/`cause` del body — lo propagamos tal cual
// para mostrarlo en el admin en vez de un "falló" genérico.
function describeError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const b = body as { message?: string; cause?: { message?: string }[]; error?: string };
    const causes = b.cause?.map((c) => c.message).filter(Boolean).join("; ");
    return [b.message || b.error, causes].filter(Boolean).join(" — ") || `HTTP ${status}`;
  }
  return `HTTP ${status}`;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  // Para los endpoints públicos (categorías, ubicaciones) que no
  // necesitan el token del vendedor conectado.
  auth?: boolean;
};

export async function mlFetch<T>(tenantId: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${await getValidAccessToken(tenantId)}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new MercadoLibreApiError(describeError(json, res.status), res.status, json);
  }
  return json as T;
}

import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
  /** Cuántos intentos fallidos se toleran dentro de la ventana. */
  limit: number;
  /** Tamaño de la ventana, en minutos. */
  windowMinutes: number;
};

// Fuerza bruta contra UNA cuenta concreta. La ventana corta hace que un
// atacante no pueda probar más de ~10 contraseñas cada 15 minutos, pero un
// usuario que se equivoca de verdad vuelve a poder entrar solo, sin que
// nadie tenga que destrabarlo a mano.
export const LOGIN_RULE: RateLimitRule = { limit: 10, windowMinutes: 15 };

// Barrido: alguien probando pocas contraseñas contra MUCHAS cuentas
// distintas desde la misma IP. Más permisivo porque una IP puede ser
// legítimamente compartida (oficina, wifi público, NAT del celular).
export const LOGIN_IP_RULE: RateLimitRule = { limit: 40, windowMinutes: 15 };

// Acciones que mandan mail: el riesgo no es adivinar nada, es que alguien las
// use para inundar de mails a un tercero.
export const EMAIL_RULE: RateLimitRule = { limit: 5, windowMinutes: 60 };

function windowStart(rule: RateLimitRule) {
  return new Date(Date.now() - rule.windowMinutes * 60 * 1000);
}

/**
 * ¿Esta `key` ya se pasó de intentos fallidos en la ventana? No registra
 * nada — se consulta antes de hacer el trabajo caro (comparar un hash,
 * mandar un mail) y `recordFailure` se llama solo si efectivamente falló.
 */
export async function isRateLimited(key: string, rule: RateLimitRule): Promise<boolean> {
  const attempts = await prisma.rateLimitAttempt.count({
    where: { key, createdAt: { gte: windowStart(rule) } },
  });
  return attempts >= rule.limit;
}

export async function recordFailure(key: string): Promise<void> {
  await prisma.rateLimitAttempt.create({ data: { key } });
}

/**
 * Se llama cuando la acción salió bien: borra el historial de esa key para
 * que alguien que se equivocó varias veces y después entró bien arranque
 * de cero la próxima.
 */
export async function clearFailures(key: string): Promise<void> {
  await prisma.rateLimitAttempt.deleteMany({ where: { key } });
}

/**
 * IP del cliente. Detrás de Nginx el socket siempre es 127.0.0.1, así que
 * el dato real viaja en x-forwarded-for — que es un header y por lo tanto
 * falsificable si el proxy de adelante no lo reescribe.
 *
 * La config real en el VPS (sites-available/*.conf) usa
 * `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` — ese
 * directive AGREGA la IP real al final de lo que ya traía el pedido, no lo
 * reemplaza. Por eso acá se toma el ÚLTIMO tramo (el que puso Nginx) y no
 * el primero (que el cliente puede inventar mandando su propio header).
 * Si algún día se suma un proxy/CDN adelante de Nginx, esto deja de
 * alcanzar y hay que sumar uno más a la cuenta.
 *
 * De cualquier forma, el límite por IP es la segunda línea de defensa y no
 * la principal: el límite por cuenta (que no depende de headers) es el
 * que de verdad frena la fuerza bruta.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1]!;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Limpia intentos viejos. Se llama desde el cron de facturación — sin esto
 * la tabla crece para siempre, porque cada intento fallido deja una fila.
 */
export async function purgeOldRateLimitAttempts(): Promise<number> {
  const { count } = await prisma.rateLimitAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return count;
}

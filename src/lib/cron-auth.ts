import { timingSafeEqual } from "node:crypto";

// Mismo criterio que la firma de los webhooks de Mercado Pago (ver
// lib/mercadopago.ts): comparar secretos con === filtra, por el tiempo que
// tarda, cuántos caracteres se acertaron. Compartido entre las rutas
// /api/cron/* para tener una sola fuente de verdad de esta comparación.
export function secretMatches(received: string | null, expected: string) {
  if (!received) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(`Bearer ${expected}`, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

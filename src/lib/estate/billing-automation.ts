import { Prisma } from "@/generated/prisma/client";

// Cálculos puros para el cron de automatización (Etapa 6) — separados de la
// ruta para poder probarlos sin pegarle a la base ni simular un request.

export function currentPeriod(date: Date): string {
  // "YYYY-MM" en huso Argentina (UTC-3), mismo criterio que argentinaDayStart
  // en modules.ts.
  const arg = new Date(date.getTime() - 3 * 3600000);
  return arg.toISOString().slice(0, 7);
}

// Vencimiento del alquiler de un período dado, en el día `dueDay` — si el mes
// es más corto (ej. dueDay=31 en febrero), cae en el último día real del mes.
export function periodDueDate(period: string, dueDay: number): Date {
  const [y, m] = period.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return new Date(`${period}-${String(day).padStart(2, "0")}T12:00:00-03:00`);
}

const UPDATE_INTERVAL_MONTHS: Record<string, number | null> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  FOUR_MONTHLY: 4,
  SEMIANNUAL: 6,
  ANNUAL: 12,
  // CUSTOM no tiene un intervalo fijo que calcular solo — el cron la ignora
  // a propósito, no inventa una cadencia.
  CUSTOM: null,
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

// Boundary de actualización más reciente que ya pasó (<= today), o null si
// todavía no llegó ninguna o la frecuencia no es calculable (CUSTOM).
export function latestUpdateBoundary(
  firstUpdateAt: Date,
  frequency: string | null,
  today: Date,
): { date: Date; period: string } | null {
  const months = frequency ? UPDATE_INTERVAL_MONTHS[frequency] : null;
  if (!months || firstUpdateAt > today) return null;
  let cursor = firstUpdateAt;
  let last: Date | null = null;
  // Acotado: como mucho unos cientos de vueltas para un contrato de varios
  // años con actualización mensual — no hay riesgo real de loop largo.
  while (cursor <= today) {
    last = cursor;
    cursor = addMonths(cursor, months);
  }
  if (!last) return null;
  return { date: last, period: last.toISOString().slice(0, 7) };
}

export function roundAmount(value: Prisma.Decimal, rounding: string | null): Prisma.Decimal {
  if (rounding === "ROUND_100") return value.div(100).round().mul(100);
  if (rounding === "ROUND_1000") return value.div(1000).round().mul(1000);
  return value; // EXACT o sin definir: no se redondea
}

export function computeLateFee(
  balance: Prisma.Decimal,
  type: string | null,
  value: Prisma.Decimal,
  cap: Prisma.Decimal | null,
): Prisma.Decimal {
  let fee = type === "PERCENTAGE" ? balance.mul(value).div(100) : value;
  if (cap && fee.greaterThan(cap)) fee = cap;
  return fee;
}

export function computePercentUpdate(
  amount: Prisma.Decimal,
  percent: Prisma.Decimal,
  rounding: string | null,
): Prisma.Decimal {
  const raw = amount.mul(new Prisma.Decimal(1).plus(percent.div(100)));
  return roundAmount(raw, rounding);
}

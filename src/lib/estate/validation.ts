import { z } from "zod";
import { ORIENTATIONS, PET_POLICIES, CREDIT_OPTIONS } from "./property-features";

export const requiredText = z
  .string()
  .trim()
  .min(1, "Completá los campos obligatorios")
  .max(300);
export const notes = z.string().trim().max(15000).default("");
export const optionalId = z
  .string()
  .trim()
  .transform((v) => v || null);
export const currency = z.enum(["ARS", "USD"]);
export const amount = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Ingresá un importe válido, con hasta dos decimales",
  )
  .refine((v) => Number(v) > 0, "El importe debe ser mayor a cero");
export const optionalAmount = z
  .union([z.literal(""), amount])
  .transform((v) => v || null);
// A diferencia de `amount`, admite negativos — necesario para longitud (en
// Argentina siempre es negativa) y para latitudes al sur del ecuador.
export const coordinate = z
  .string()
  .regex(/^-?\d{1,3}(\.\d{1,8})?$/, "Ingresá una coordenada válida");
export const optionalCoordinate = z
  .union([z.literal(""), coordinate])
  .transform((v) => v || null);
export const optionalUrl = z
  .union([z.literal(""), z.url("Ingresá un link válido").max(2000)])
  .transform((v) => v || null);
export const optionalPhone = z
  .string()
  .max(80)
  .transform((v) => v || null);
export function parseDate(value: string, timed = false) {
  const pattern = timed
    ? /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    : /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(value)) throw new Error("Fecha inválida");
  const date = new Date(
    timed ? `${value}:00-03:00` : `${value}T12:00:00-03:00`,
  );
  if (
    !Number.isFinite(date.getTime()) ||
    new Date(date.getTime() - 3 * 3600000).toISOString().slice(0, 10) !==
      value.slice(0, 10)
  )
    throw new Error("Fecha inválida");
  return date;
}
export const day = z.string().transform((v, ctx) => {
  try {
    return parseDate(v);
  } catch {
    ctx.addIssue({ code: "custom", message: "Ingresá una fecha válida" });
    return z.NEVER;
  }
});
export const optionalDay = z.union([z.literal(""), day]).transform((v) => v || null);
// Un checkbox tildado manda "on" en el FormData; uno destildado no manda
// nada — sin este preprocess, .parse() explota con un checkbox apagado.
export const checkbox = z.preprocess((v) => v === "on", z.boolean());
export function optionalInt(min: number, max: number) {
  return z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
    .transform((v) => (v === "" ? null : v));
}
export const instant = z.string().transform((v, ctx) => {
  try {
    return parseDate(v, true);
  } catch {
    ctx.addIssue({ code: "custom", message: "Ingresá fecha y hora válidas" });
    return z.NEVER;
  }
});
export const agentSchema = z.object({
  name: requiredText,
  email: z.union([z.literal(""), z.email()]).transform((v) => v || null),
  phone: requiredText,
});
export const contactSchema = z.object({
  name: requiredText,
  email: z.union([z.literal(""), z.email()]).transform((v) => v || null),
  phone: z
    .string()
    .max(80)
    .transform((v) => v || null),
  taxId: z
    .string()
    .max(20)
    .transform((v) => v || null),
  // preprocess: el modal de alta rápida (garante/inquilino) no manda estos
  // tres campos — sin esto, form.entries() los deja undefined y explota.
  address: z.preprocess(
    (v) => v ?? "",
    z.string().max(200).transform((v) => v || null),
  ),
  birthDate: z.preprocess((v) => v ?? "", optionalDay),
  occupation: z.preprocess(
    (v) => v ?? "",
    z.string().max(120).transform((v) => v || null),
  ),
  roles: z
    .array(z.enum(["OWNER", "PROSPECT", "TENANT", "BUYER", "GUARANTOR"]))
    .min(1, "Seleccioná al menos un rol"),
  portalEnabled: checkbox,
  ownerPortalEnabled: checkbox,
  notes,
});
export const propertySchema = z
  .object({
    code: requiredText,
    title: requiredText,
    propertyType: requiredText,
    city: requiredText,
    neighborhood: z.string().max(300),
    address: requiredText,
    latitude: optionalCoordinate,
    longitude: optionalCoordinate,
    mapAddress: z
      .string()
      .max(300)
      .transform((v) => v || null),
    ownerId: optionalId,
    bedrooms: z.coerce.number().int().min(0).max(1000),
    bathrooms: z.coerce.number().int().min(0).max(1000),
    garages: z.coerce.number().int().min(0).max(1000),
    coveredArea: optionalAmount,
    totalArea: optionalAmount,
    description: notes,
    seoTitle: z.string().trim().max(120, "El título para Google puede tener hasta 120 caracteres").default(""),
    seoDescription: z.string().trim().max(300, "La descripción para Google puede tener hasta 300 caracteres").default(""),
    videoUrl: optionalUrl,
    orientation: z.union([z.literal(""), z.enum(ORIENTATIONS)]).default("").transform((v) => v || null),
    petsPolicy: z.union([z.literal(""), z.enum(PET_POLICIES)]).default("").transform((v) => v || null),
    creditEligible: z.union([z.literal(""), z.enum(CREDIT_OPTIONS)]).default("").transform((v) => v === "" ? null : v === "Sí"),
    published: z.boolean(),
    featured: z.boolean(),
    offerType: z.enum(["SALE", "RENT", "RENT_TEMP", "BOTH"]),
    salePrice: optionalAmount,
    saleCurrency: currency,
    saleWhatsapp: optionalPhone,
    saleShowPrice: z.boolean(),
    rentPrice: optionalAmount,
    rentCurrency: currency,
    rentWhatsapp: optionalPhone,
    rentShowPrice: z.boolean(),
  })
  .refine(
    (v) =>
      !v.coveredArea ||
      !v.totalArea ||
      Number(v.coveredArea) <= Number(v.totalArea),
    "La superficie cubierta no puede superar la total",
  )
  .refine(
    (v) => Boolean(v.latitude) === Boolean(v.longitude),
    "Cargá latitud y longitud juntas, o dejá las dos vacías",
  );
const optionalChoice = (values: readonly string[]) =>
  z.union([z.literal(""), z.enum(values as [string, ...string[]])]).transform((v) => v || null);

export const contractSchema = z
  .object({
    reference: requiredText,
    propertyId: requiredText,
    contactId: requiredText,
    startsAt: day,
    endsAt: day,
    amount,
    currency,
    status: z.enum(["DRAFT", "ACTIVE", "ENDED", "CANCELLED"]),
    contractType: z.string().max(120).transform((v) => v || null),
    propertyDestination: z.string().max(120).transform((v) => v || null),

    // ---- Condiciones de pago ----
    dueDay: optionalInt(1, 31),
    graceDays: optionalInt(0, 365),
    firstChargePeriod: z
      .union([z.literal(""), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Período inválido")])
      .transform((v) => v || null),
    paymentMethod: optionalChoice(["TRANSFER", "MERCADOPAGO", "CASH", "OWNER_DIRECT"]),
    collectedBy: optionalChoice(["AGENCY", "OWNER"]),
    lateFeeEnabled: checkbox,
    lateFeeType: optionalChoice(["PERCENTAGE", "FIXED"]),
    lateFeeValue: optionalAmount,
    lateFeeFromDay: optionalInt(0, 365),
    lateFeeFrequency: optionalChoice(["DAILY", "MONTHLY", "ONCE"]),
    lateFeeCap: optionalAmount,

    // ---- Actualización ----
    updateType: z.enum(["NONE", "IPC", "ICL", "FIXED_PERCENT", "STEPPED", "MANUAL", "OTHER_INDEX"]),
    updateFrequency: optionalChoice(["MONTHLY", "QUARTERLY", "FOUR_MONTHLY", "SEMIANNUAL", "ANNUAL", "CUSTOM"]),
    firstUpdateAt: optionalDay,
    updatePercent: optionalAmount,
    updateRounding: optionalChoice(["EXACT", "ROUND_100", "ROUND_1000"]),
    adjustmentNotes: notes,

    // ---- Depósito y garantía ----
    hasDeposit: checkbox,
    depositAmount: optionalAmount,
    depositCurrency: z.union([z.literal(""), currency]).transform((v) => v || null),
    depositInstallments: optionalInt(1, 60),
    depositStatus: optionalChoice(["PENDING", "PARTIAL", "PAID"]),
    depositHeldBy: optionalChoice(["AGENCY", "OWNER"]),
    guaranteeType: optionalChoice(["OWNER_PROPERTY", "INSURANCE", "PAYSLIP", "BOND", "OTHER"]),
    guaranteeExpiresAt: optionalDay,

    notes,
  })
  .refine(
    (v) => v.endsAt > v.startsAt,
    "El vencimiento debe ser posterior al inicio",
  )
  .refine(
    (v) => !v.lateFeeEnabled || Boolean(v.lateFeeType && v.lateFeeValue && v.lateFeeFromDay != null && v.lateFeeFrequency),
    "Completá los datos de punitorios (tipo, valor, desde qué día y frecuencia)",
  )
  .refine(
    (v) => v.updateType !== "FIXED_PERCENT" || Boolean(v.updatePercent),
    "Ingresá el porcentaje de actualización",
  )
  .refine(
    (v) =>
      !v.hasDeposit ||
      Boolean(v.depositAmount && v.depositCurrency && v.depositInstallments != null && v.depositStatus),
    "Completá los datos del depósito (importe, moneda, cuotas y estado)",
  )
  .transform((v) => ({
    ...v,
    ...(v.lateFeeEnabled
      ? {}
      : { lateFeeType: null, lateFeeValue: null, lateFeeFromDay: null, lateFeeFrequency: null, lateFeeCap: null }),
    updatePercent: v.updateType === "FIXED_PERCENT" ? v.updatePercent : null,
    ...(v.hasDeposit
      ? {}
      : {
          depositAmount: null,
          depositCurrency: null,
          depositInstallments: null,
          depositStatus: null,
          depositHeldBy: null,
        }),
  }));
export const visitSchema = z
  .object({
    propertyId: requiredText,
    contactId: requiredText,
    agentName: requiredText,
    startsAt: instant,
    endsAt: instant,
    status: z.enum([
      "SCHEDULED",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ]),
    notes,
  })
  .refine((v) => v.endsAt > v.startsAt, "El fin debe ser posterior al inicio");
export const chargeSchema = z.object({
  contractId: requiredText,
  concept: requiredText,
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Período inválido"),
  dueAt: day,
  amount,
  currency,
});

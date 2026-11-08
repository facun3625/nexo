export type WarrantyStatus = "VIGENTE" | "VENCIDA" | "DESCONOCIDA";

// null = no se puede determinar (falta la fecha de entrega de la unidad o
// no se cargó cuántos meses cubre el rubro) — se muestra distinto de
// "vencida" a propósito, para no asustar con un dato que en realidad no se
// sabe.
export function warrantyStatus(
  deliveredAt: Date | string | null,
  warrantyMonths: number | null,
  today: Date = new Date(),
): { status: WarrantyStatus; expiresAt: Date | null } {
  if (!deliveredAt || warrantyMonths === null || warrantyMonths === undefined) {
    return { status: "DESCONOCIDA", expiresAt: null };
  }
  const delivered = typeof deliveredAt === "string" ? new Date(deliveredAt) : deliveredAt;
  const expiresAt = new Date(delivered);
  expiresAt.setMonth(expiresAt.getMonth() + warrantyMonths);
  return { status: today <= expiresAt ? "VIGENTE" : "VENCIDA", expiresAt };
}

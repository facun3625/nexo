// La descripción de un plan es texto libre, una prestación por línea (ver
// comentario en el schema y en /platform/planes) — esto la convierte en una
// lista de características. Si el plan no tiene descripción cargada, cae a
// una lista genérica armada con sus límites.
export function planFeatureLines(
  description: string | null | undefined,
  fallback: string[],
): string[] {
  const written = description?.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) ?? [];
  return written.length ? written : fallback;
}

/** Mantiene descripciones propias y omite beneficios del catálogo ecommerce anterior. */
export function estatePlanFeatureLines(plan: {
  description?: string | null;
  maxPublishedProperties?: number | null;
  allowCustomDomain: boolean;
  allowAiAgent?: boolean;
}): string[] {
  const legacy = /\b(productos?|pedidos?|stock|cupones?|delivery|carrito|checkout|puntos|envíos?|entregas?)\b/i;
  const written = plan.description?.split(/\r?\n/).map(line => line.trim()).filter(line => line && !legacy.test(line)) ?? [];
  return Array.from(new Set([
    plan.maxPublishedProperties != null ? `Hasta ${plan.maxPublishedProperties} propiedades publicadas` : "Propiedades publicadas sin límite",
    "Sitio con la marca de tu inmobiliaria",
    "Contactos, consultas y visitas",
    ...(plan.allowCustomDomain ? ["Dominio propio"] : []),
    ...(plan.allowAiAgent ? ["Agente de ventas IA"] : []),
    ...written,
  ]));
}

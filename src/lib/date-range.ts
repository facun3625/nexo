export type DateRangePreset = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  month: "Este mes",
  custom: "Rango personalizado",
};

export type ResolvedDateRange = { from: Date; to: Date; preset: DateRangePreset; label: string };

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

// Único lugar donde se traduce "¿qué período eligió el super admin?" (query
// params de la URL) a un rango de fechas concreto — usado por cualquier
// pantalla de /platform que necesite un selector de período (hoy solo
// tráfico del sitio, pero queda listo para reusar).
export function resolveDateRange(params: { range?: string; from?: string; to?: string }): ResolvedDateRange {
  const now = new Date();
  const preset = (params.range as DateRangePreset) || "30d";

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), preset, label: DATE_RANGE_LABELS.today };
    case "yesterday": {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y), preset, label: DATE_RANGE_LABELS.yesterday };
    }
    case "7d":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)),
        to: endOfDay(now),
        preset,
        label: DATE_RANGE_LABELS["7d"],
      };
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now), preset, label: DATE_RANGE_LABELS.month };
    case "custom": {
      const from = params.from ? startOfDay(new Date(`${params.from}T00:00:00`)) : startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const to = params.to ? endOfDay(new Date(`${params.to}T00:00:00`)) : endOfDay(now);
      return { from, to, preset, label: DATE_RANGE_LABELS.custom };
    }
    case "30d":
    default:
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)),
        to: endOfDay(now),
        preset: "30d",
        label: DATE_RANGE_LABELS["30d"],
      };
  }
}

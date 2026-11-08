import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type PopupFrequency = "ONCE" | "SESSION" | "ALWAYS";
export type PopupConfig = {
  enabled: boolean;
  html: string | null;
  frequency: PopupFrequency;
  // Cambia cada vez que se guarda — así una edición de contenido vuelve a
  // mostrar el pop-up aunque alguien ya lo haya cerrado antes.
  version: string;
};

const KEYS = ["popup_enabled", "popup_html", "popup_frequency", "popup_version"] as const;

export const getPopupConfig = cache(async (tenantId: string): Promise<PopupConfig> => {
  const rows = await prisma.settings.findMany({
    where: { tenantId, key: { in: [...KEYS] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: map.popup_enabled === "true",
    html: map.popup_html ?? null,
    frequency: (map.popup_frequency as PopupFrequency) ?? "ONCE",
    version: map.popup_version ?? "0",
  };
});

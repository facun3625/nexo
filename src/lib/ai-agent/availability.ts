import { toWhatsAppMessageLink } from "@/lib/social-links";

const STORE_TIME_ZONE = "America/Argentina/Cordoba";
const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DAY_LABELS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type HumanSellerSettings = {
  storeName: string;
  whatsappPhone: string | null;
  humanDays: number[];
  humanStartTime: string;
  humanEndTime: string;
};

export type HumanSellerAvailability = {
  // false = no hay WhatsApp cargado en Identidad, no hay nada que ofrecer
  enabled: boolean;
  // true = enabled y estamos dentro del horario configurado ahora mismo
  available: boolean;
  scheduleText: string;
  whatsappUrl: string | null;
};

// Calcula si ahora (hora de Argentina) cae dentro del horario de WhatsApp
// configurado en Configuración → Agente IA — lo usan tanto el widget del
// agente (para ofrecer o no el botón "Hablar con una persona") como la
// herramienta get_agency_options que consulta el modelo antes de responder.
export function getHumanSellerAvailability(settings: HumanSellerSettings, now = new Date()): HumanSellerAvailability {
  const phone = settings.whatsappPhone?.replace(/\D/g, "") ?? "";
  const days = [...new Set(settings.humanDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort();
  const start = settings.humanStartTime;
  const end = settings.humanEndTime;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = DAY_INDEX[parts.find((part) => part.type === "weekday")?.value ?? "Sun"] ?? 0;
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const current = `${hour}:${minute}`;
  const previousWeekday = (weekday + 6) % 7;
  // start < end: franja normal en el mismo día (ej: 09:00 a 18:00).
  // start > end: franja que cruza la medianoche (ej: 20:00 a 02:00) — el día
  // "configurado" es el de inicio, así que a la madrugada vale el día anterior.
  const scheduledNow = start < end
    ? days.includes(weekday) && current >= start && current < end
    : start > end
      ? (days.includes(weekday) && current >= start) || (days.includes(previousWeekday) && current < end)
      : false;
  const enabled = Boolean(phone);
  const available = enabled && scheduledNow;
  const dayText = days.length === 7
    ? "todos los días"
    : days.length > 0
      ? days.map((day) => DAY_LABELS[day]).join(", ")
      : "sin días configurados";

  return {
    enabled,
    available,
    scheduleText: `${dayText}, de ${start} a ${end} h`,
    whatsappUrl: available
      ? toWhatsAppMessageLink(phone, `Hola, vengo del asistente de ${settings.storeName} y quiero hablar con una persona.`)
      : null,
  };
}

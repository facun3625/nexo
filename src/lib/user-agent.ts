// Parseo liviano y a propósito aproximado — alcanza para agrupar
// estadísticas de tráfico, no hace falta una librería para esto.

export type DeviceType = "MOBILE" | "TABLET" | "DESKTOP";

export const DEVICE_LABELS: Record<DeviceType, string> = {
  MOBILE: "Celular",
  TABLET: "Tablet",
  DESKTOP: "Computadora",
};

export function parseDevice(userAgent: string | null): DeviceType {
  if (!userAgent) return "DESKTOP";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(?:android(?!.*mobile))/.test(ua)) return "TABLET";
  if (/mobi|iphone|android/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

export function parseBrowser(userAgent: string | null): string {
  if (!userAgent) return "Desconocido";
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/(chrome|crios)\//i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/(firefox|fxios)\//i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/(chrome|crios|android)/i.test(userAgent)) return "Safari";
  return "Otro";
}

export function parseOs(userAgent: string | null): string {
  if (!userAgent) return "Desconocido";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Otro";
}

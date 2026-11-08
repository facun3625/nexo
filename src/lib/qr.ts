// Dirección que va impresa en el QR. Un QR impreso no se puede corregir,
// por eso sale siempre del dominio definitivo y no de ROOT_DOMAIN.
const QR_BASE_URL = process.env.QR_BASE_URL ?? "https://gerellicorrenti.com.ar";

export function propertyQrUrl(propertyId: string) {
  return `${QR_BASE_URL}/qr/${propertyId}`;
}

export const QR_COOKIE = "nexo_qr_lead";

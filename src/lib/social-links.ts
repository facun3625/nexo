export function toWhatsAppLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const digits = value.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}`;
}

// A diferencia de toWhatsAppLink (abre el chat vacío), esta arma el link
// con el mensaje ya cargado — el admin solo tiene que apretar enviar en
// WhatsApp Web.
export function toWhatsAppMessageLink(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// Teléfonos cargados "a la argentina" (342 4123456, 0342-15-4123456) al
// formato internacional que pide wa.me: 54 9 + característica + número.
export function toArgentineWhatsAppDigits(phone: string) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  // El "15" del celular va después de la característica (2 a 4 dígitos).
  if (digits.length === 12) digits = digits.replace(/^(\d{2,4}?)15(\d{6,8})$/, "$1$2");
  return digits.length === 10 ? `549${digits}` : phone.replace(/[^\d]/g, "");
}

// Abre WhatsApp Web con el mensaje listo (panel, para escribirle a un cliente).
export function toWhatsAppWebLink(phone: string, text: string) {
  return `https://web.whatsapp.com/send?phone=${toArgentineWhatsAppDigits(phone)}&text=${encodeURIComponent(text)}`;
}

export function toInstagramLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

export function toFacebookLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  return `https://facebook.com/${handle}`;
}

export function toYoutubeLink(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  return `https://youtube.com/@${handle}`;
}

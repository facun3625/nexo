import { formatPrice } from "@/lib/format";

// Paleta de marca (globals.css --primary/--foreground/etc.) hardcodeada acá
// porque los clientes de mail no leen custom properties de CSS.
const INK = "#3d3d3d";
const MUTED = "#757575";
const BORDER = "#e2e2e2";
const PAGE_BG = "#f5f5f5";
const SURFACE = "#ffffff";
const ORANGE = "#208ab1";

export const DEFAULT_ORDER_EMAIL_MESSAGE = "¡Gracias por tu compra! Ya estamos preparando todo.";

// Campos dinámicos que el admin puede insertar en el mensaje editable —
// se reemplazan por el dato real de cada pedido justo antes de mandar el
// mail (y en la vista previa, con datos de ejemplo).
export const ORDER_EMAIL_TOKENS = [
  { token: "{{nombre}}", label: "Nombre del cliente" },
  { token: "{{pedido}}", label: "N° de pedido" },
  { token: "{{total}}", label: "Total del pedido" },
  { token: "{{tienda}}", label: "Nombre de la tienda" },
] as const;

// Datos de ejemplo para la vista previa en vivo del editor y para el mail
// de prueba — así ambos muestran exactamente lo mismo.
export const SAMPLE_ORDER_EMAIL_DATA: {
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentLabel: string;
  deliveryDateLabel: string;
  deliveryAddress: string;
  phone: string;
  paymentMethodLabel: string;
} = {
  customerName: "Facundo",
  orderId: "PRUEBA1234",
  items: [
    { name: "Producto de ejemplo", quantity: 2, unitPrice: 1500 },
    { name: "Otro producto", quantity: 1, unitPrice: 3200 },
  ],
  subtotal: 6200,
  deliveryFee: 500,
  total: 6700,
  fulfillmentLabel: "Delivery",
  deliveryDateLabel: "Viernes 28 de agosto",
  deliveryAddress: "Av. Siempre Viva 742",
  phone: "1122334455",
  paymentMethodLabel: "Efectivo",
};

export function applyOrderEmailTokens(
  message: string,
  data: { customerName?: string | null; orderId: string; total: number; storeName: string },
) {
  return message
    .replaceAll("{{nombre}}", data.customerName?.trim() || "")
    .replaceAll("{{pedido}}", data.orderId.slice(-8).toUpperCase())
    .replaceAll("{{total}}", formatPrice(data.total))
    .replaceAll("{{tienda}}", data.storeName);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

// Los saltos de línea del textarea del admin no sobreviven como HTML —
// los convertimos a <br> preservando el resto escapado.
function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export function orderConfirmationEmail({
  storeName,
  logoUrl,
  customMessage,
  customerName,
  orderId,
  orderUrl,
  items,
  subtotal,
  deliveryFee,
  total,
  fulfillmentLabel,
  deliveryDateLabel,
  deliveryAddress,
  pickupSlotLabel,
  pickupSlotHeading = "Horario de retiro",
  phone,
  paymentMethodLabel,
  storeAddress,
  storePhone,
  storeEmail,
  whatsappUrl,
  instagramUrl,
  appUrl,
}: {
  storeName: string;
  logoUrl?: string | null;
  customMessage?: string | null;
  customerName?: string | null;
  orderId: string;
  orderUrl: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentLabel: string;
  deliveryDateLabel: string;
  deliveryAddress?: string | null;
  pickupSlotLabel?: string | null;
  // "Horario de retiro" para retiro; "Turno" para delivery vendido por
  // horario (ver checkout/actions.ts) — ahí la franja no es un retiro, es
  // el turno en el que se entrega.
  pickupSlotHeading?: string;
  phone: string;
  paymentMethodLabel: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  storeEmail?: string | null;
  whatsappUrl?: string | null;
  instagramUrl?: string | null;
  // Base absoluta (https://tudominio.com) para poder cargar el logo de Urbi
  // en el mail — un cliente de correo no tiene "página actual" desde la
  // cual resolver una ruta relativa. Sin esto cae a una ruta relativa, que
  // igual funciona en la vista previa dentro del navegador.
  appUrl?: string;
}) {
  // logoUrl sale de saveUploadedFile como ruta relativa (/uploads/...) —
  // en el navegador se resuelve solo contra la página actual, pero un
  // cliente de mail no tiene "página actual" y la muestra rota. Mismo
  // problema que ya resolvíamos para el logo de Urbi del pie, acá aplicado
  // al logo de la tienda.
  const absoluteLogoUrl = logoUrl && appUrl && !/^https?:\/\//.test(logoUrl) ? `${appUrl}${logoUrl}` : logoUrl;

  const itemsHtml = items
    .map(
      (i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};">
            ${escapeHtml(i.name)}
            <span style="color:${MUTED};">&nbsp;× ${i.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:${INK};text-align:right;white-space:nowrap;">
            ${formatPrice(i.unitPrice * i.quantity)}
          </td>
        </tr>`,
    )
    .join("");

  const totalsRows = [
    `<tr><td style="padding:4px 0;font-size:13px;color:${MUTED};">Subtotal</td><td style="padding:4px 0;font-size:13px;color:${INK};text-align:right;">${formatPrice(subtotal)}</td></tr>`,
    deliveryFee > 0
      ? `<tr><td style="padding:4px 0;font-size:13px;color:${MUTED};">Envío</td><td style="padding:4px 0;font-size:13px;color:${INK};text-align:right;">${formatPrice(deliveryFee)}</td></tr>`
      : "",
    `<tr><td style="padding:8px 0 0;font-size:15px;font-weight:700;color:${INK};">Total</td><td style="padding:8px 0 0;font-size:15px;font-weight:700;color:${ORANGE};text-align:right;">${formatPrice(total)}</td></tr>`,
  ].join("");

  const deliveryRows = [
    `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};width:40%;">Tipo de entrega</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(fulfillmentLabel)}</td></tr>`,
    `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};">Fecha</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(deliveryDateLabel)}</td></tr>`,
    deliveryAddress
      ? `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};">Dirección</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(deliveryAddress)}</td></tr>`
      : "",
    pickupSlotLabel
      ? `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};">${escapeHtml(pickupSlotHeading)}</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(pickupSlotLabel)}</td></tr>`
      : "",
    `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};">Teléfono</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(phone)}</td></tr>`,
    `<tr><td style="padding:3px 0;font-size:13px;color:${MUTED};">Medio de pago</td><td style="padding:3px 0;font-size:13px;color:${INK};">${escapeHtml(paymentMethodLabel)}</td></tr>`,
  ].join("");

  const footerLines = [storeAddress, storePhone, storeEmail].filter(Boolean) as string[];
  const footerLinks = [
    whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}" style="color:${MUTED};text-decoration:none;">WhatsApp</a>` : "",
    instagramUrl ? `<a href="${escapeHtml(instagramUrl)}" style="color:${MUTED};text-decoration:none;">Instagram</a>` : "",
  ].filter(Boolean);

  return `
  <div style="background:${PAGE_BG};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
          <table role="presentation" width="100%"><tr>
            <td style="vertical-align:middle;">
              ${absoluteLogoUrl ? `<img src="${escapeHtml(absoluteLogoUrl)}" alt="${escapeHtml(storeName)}" height="36" style="height:36px;width:auto;border-radius:8px;vertical-align:middle;margin-right:10px;">` : ""}
              <span style="font-size:17px;font-weight:700;color:${INK};vertical-align:middle;">${escapeHtml(storeName)}</span>
            </td>
          </tr></table>
        </td>
      </tr>

      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${INK};">
            ¡Gracias por tu pedido${customerName ? `, ${escapeHtml(customerName)}` : ""}!
          </h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${INK};">${nl2br(applyOrderEmailTokens(customMessage?.trim() || DEFAULT_ORDER_EMAIL_MESSAGE, { customerName, orderId, total, storeName }))}</p>

          <p style="margin:0 0 16px;font-size:12px;color:${MUTED};">N° de pedido: ${orderId.slice(-8).toUpperCase()}</p>

          <table role="presentation" width="100%" style="margin-bottom:8px;">${itemsHtml}</table>
          <table role="presentation" width="100%" style="margin-bottom:24px;">${totalsRows}</table>

          <table role="presentation" width="100%" style="background:${PAGE_BG};border-radius:12px;padding:16px;margin-bottom:24px;">
            <tr><td style="padding:16px;">
              <table role="presentation" width="100%">${deliveryRows}</table>
            </td></tr>
          </table>

          <table role="presentation" width="100%"><tr><td>
            <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:${ORANGE};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">
              Ver mi pedido
            </a>
          </td></tr></table>
        </td>
      </tr>

      <tr>
        <td style="padding:20px 32px;border-top:1px solid ${BORDER};background:${PAGE_BG};">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${INK};">${escapeHtml(storeName)}</p>
          ${footerLines.map((l) => `<p style="margin:0 0 2px;font-size:12px;color:${MUTED};">${escapeHtml(l)}</p>`).join("")}
          ${footerLinks.length ? `<p style="margin:8px 0 0;font-size:12px;">${footerLinks.join(" &nbsp;·&nbsp; ")}</p>` : ""}
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" style="max-width:560px;margin:14px auto 0;">
      <tr><td style="text-align:center;">
        <a href="https://kubbo.com.ar" target="_blank" style="text-decoration:none;color:${MUTED};font-size:11px;line-height:1.6;">
          Desarrollado por <strong>kubbo.com.ar</strong>
        </a>
      </td></tr>
    </table>
  </div>
  `;
}

export function paymentReminderEmail({
  storeName,
  contractReference,
  concept,
  amountLabel,
  dueDateLabel,
  portalUrl,
}: {
  storeName: string;
  contractReference: string;
  concept: string;
  amountLabel: string;
  dueDateLabel: string;
  portalUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px;">Se acerca un vencimiento</h1>
      <p>Tu contrato <strong>${escapeHtml(contractReference)}</strong> en <strong>${escapeHtml(storeName)}</strong> tiene un pago próximo a vencer:</p>
      <table style="width: 100%; margin: 16px 0; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #666;">Concepto</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(concept)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Monto</td><td style="padding: 6px 0; text-align: right; font-weight: bold;">${escapeHtml(amountLabel)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Vence</td><td style="padding: 6px 0; text-align: right;">${escapeHtml(dueDateLabel)}</td></tr>
      </table>
      <p style="margin: 24px 0;">
        <a href="${portalUrl}" style="background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Ver mi alquiler
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">Si ya lo pagaste, podés ignorar este mail.</p>
    </div>
  `;
}

export function passwordResetEmail({ storeName, resetUrl }: { storeName: string; resetUrl: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px;">Restablecer tu contraseña</h1>
      <p>Alguien pidió cambiar la contraseña de tu cuenta en <strong>${escapeHtml(storeName)}</strong>. Si fuiste vos, entrá acá para elegir una nueva:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Elegir nueva contraseña
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">El link vence en 1 hora. Si no fuiste vos, podés ignorar este mail.</p>
    </div>
  `;
}

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { getContent } from "@/lib/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.penalvainmobiliaria.com.ar";

function buildEmail(
  alert: { nombre: string; ciudad?: string | null; tipo?: string | null; operacion?: string | null; dormitorios?: number | null },
  properties: { id: string; title: string; price: number; currency?: string | null; type: string; propertyType: string; city: string; address: string; imageUrl?: string | null }[],
  texts: { saludo: string; cierre: string }
) {
  const filtros = [alert.operacion, alert.tipo, alert.ciudad, alert.dormitorios ? `${alert.dormitorios} dorm.` : null]
    .filter(Boolean).join(" · ");

  const propCards = properties.map((p) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #f0efed;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="100" style="padding-right: 16px; vertical-align: top;">
              ${p.imageUrl ? `<img src="${p.imageUrl}" width="100" height="72" style="border-radius: 8px; object-fit: cover; display: block;" />` : ""}
            </td>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #999;">${p.type} · ${p.propertyType}</p>
              <p style="margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #111;">${p.title}</p>
              <p style="margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #df691a;">${p.currency || "USD"} ${p.price.toLocaleString("es-AR")}</p>
              <p style="margin: 0 0 10px; font-size: 12px; color: #999;">📍 ${p.city}, ${p.address}</p>
              <a href="${siteUrl}/propiedad/${p.id}" style="display: inline-block; background: #df691a; color: white; text-decoration: none; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ver propiedad</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background: #f8f6f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f6f2; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background: #262522; padding: 28px 32px; border-radius: 12px 12px 0 0; text-align: center;">
              <p style="margin: 0 0 4px; color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Penalva Inmobiliaria</p>
              <p style="margin: 0; color: white; font-size: 20px; font-weight: 700;">Encontramos propiedades para vos</p>
            </td>
          </tr>
          <tr>
            <td style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #111;">Hola <strong>${alert.nombre}</strong>,</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #666;">${texts.saludo}</p>
              ${filtros ? `<p style="margin: 0 0 24px; font-size: 13px; font-weight: 600; color: #df691a;">${filtros}</p>` : '<div style="margin-bottom: 24px;"></div>'}
              <table width="100%" cellpadding="0" cellspacing="0">${propCards}</table>
              ${texts.cierre ? `<p style="margin: 24px 0 0; font-size: 13px; color: #888; line-height: 1.6;">${texts.cierre}</p>` : ""}
              <div style="margin-top: 28px; padding-top: 24px; border-top: 1px solid #f0efed; text-align: center;">
                <a href="${siteUrl}/propiedades${alert.operacion ? `?operacion=${encodeURIComponent(alert.operacion)}` : ''}${alert.ciudad ? `&ciudad=${encodeURIComponent(alert.ciudad)}` : ''}${alert.tipo ? `&tipo=${encodeURIComponent(alert.tipo)}` : ''}"
                  style="display: inline-block; background: #262522; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 700;">
                  Ver todas las propiedades
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #bbb;">Recibís este email porque te suscribiste a alertas en Penalva Inmobiliaria.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    tls: { rejectUnauthorized: false },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "SMTP no configurado. Revisá SMTP_HOST, SMTP_USER y SMTP_PASS en .env.local" }, { status: 500 });
  }

  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || `Penalva Inmobiliaria <${process.env.SMTP_USER}>`;

  // Cargar textos editables del panel
  const [asunto, saludo, cierre] = await Promise.all([
    getContent("email_asunto"),
    getContent("email_saludo"),
    getContent("email_cierre"),
  ]);

  const pendingAlerts = await prisma.propertyAlert.findMany({
    where: { pending: true },
  });

  if (pendingAlerts.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, message: "No hay alertas pendientes" });
  }

  let sent = 0;
  let skipped = 0;

  for (const alert of pendingAlerts) {
    const where: any = { published: true };
    if (alert.ciudad) where.city = alert.ciudad;
    if (alert.tipo) where.propertyType = alert.tipo;
    if (alert.operacion) where.type = alert.operacion;
    if (alert.dormitorios) where.bedrooms = alert.dormitorios;

    const properties = await prisma.property.findMany({
      where,
      select: { id: true, title: true, price: true, currency: true, type: true, propertyType: true, city: true, address: true, imageUrl: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (properties.length === 0) {
      skipped++;
      continue;
    }

    try {
      await transporter.sendMail({
        from,
        to: alert.email,
        subject: asunto,
        html: buildEmail(alert, properties, { saludo, cierre }),
      });

      await Promise.all([
        prisma.propertyAlert.update({
          where: { id: alert.id },
          data: { pending: false, lastMatchPropertyId: null },
        }),
        prisma.emailLog.create({
          data: {
            to: alert.email,
            nombre: alert.nombre,
            subject: asunto,
            alertId: alert.id,
          },
        }),
      ]);

      sent++;
    } catch (err: any) {
      console.error(`[SMTP ERROR] al enviar a ${alert.email}:`, err?.message || err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped });
}

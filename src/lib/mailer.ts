import nodemailer from "nodemailer";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { getSmtpCredentials } from "@/lib/smtp-settings";

export type EmailType =
  | "PASSWORD_RESET"
  | "SERVICE_INQUIRY"
  | "DEVELOPMENT_INQUIRY"
  | "PAYMENT_REMINDER"
  | "PROPERTY_SHARE"
  | "MARKETING_TEST"
  | "SMTP_TEST";

export type SmtpConfig = {
  host: string;
  port: number;
  security: "ssl" | "starttls" | "none";
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

type Mail = { to: string; subject: string; html: string; replyTo?: string | null; headers?: Record<string, string> };

// Cómo sale el correo: primero el SMTP cargado en Configuración → Correo;
// si no hay, Resend por .env (RESEND_API_KEY/RESEND_FROM_EMAIL).
type Transport = {
  send: (mail: Mail) => Promise<void>;
  close: () => void;
};

const quote = (name: string) => `"${name.replace(/["\\]/g, "")}"`;

export function smtpTransport(config: SmtpConfig, fallbackName: string, pool = false): Transport {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.security === "ssl",
    requireTLS: config.security === "starttls",
    ignoreTLS: config.security === "none",
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    ...(pool ? { pool: true, maxConnections: 2, maxMessages: 100 } : {}),
  });
  const from = `${quote(config.fromName || fallbackName)} <${config.fromEmail}>`;
  return {
    send: async (mail) => {
      await transporter.sendMail({
        from,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
        ...(mail.headers ? { headers: mail.headers } : {}),
      });
    },
    close: () => transporter.close(),
  };
}

async function getTransport(tenantId: string, pool = false): Promise<Transport | null> {
  const { storeName } = await getStoreSettings(tenantId);
  const smtp = await getSmtpCredentials(tenantId);
  if (smtp) return smtpTransport(smtp, storeName, pool);

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  const resend = new Resend(apiKey);
  const from = `${quote(storeName)} <${fromEmail}>`;
  return {
    send: async (mail) => {
      const { error } = await resend.emails.send({
        from,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
        ...(mail.headers ? { headers: mail.headers } : {}),
      });
      if (error) throw new Error(error.message);
    },
    close: () => {},
  };
}

export async function isMailerConfigured(tenantId: string) {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) return true;
  return Boolean(await getSmtpCredentials(tenantId));
}

let warned = false;

export async function sendMail({
  tenantId,
  type,
  ...mail
}: Mail & { tenantId: string; type: EmailType }) {
  const transport = await getTransport(tenantId);
  if (!transport) {
    if (!warned) {
      console.warn("No hay correo configurado (Configuración → Correo) — no se van a enviar mails.");
      warned = true;
    }
    return;
  }
  try {
    await transport.send(mail);
    await prisma.emailLog.create({ data: { tenantId, to: mail.to, subject: mail.subject, type, success: true } }).catch(() => {});
  } catch (err) {
    await prisma.emailLog
      .create({
        data: { tenantId, to: mail.to, subject: mail.subject, type, success: false, error: err instanceof Error ? err.message : String(err) },
      })
      .catch(() => {});
    throw err;
  } finally {
    transport.close();
  }
}

export type BatchMail = { to: string; subject: string; html: string; headers?: Record<string, string> };

// Envío masivo: uno por uno sobre una conexión reutilizada. Devuelve el
// error de cada mail (null = salió bien), así un mail rebotado no marca
// como fallado al resto del lote.
export async function sendMailBatch(tenantId: string, mails: BatchMail[], replyTo?: string | null): Promise<(string | null)[]> {
  const transport = await getTransport(tenantId, true);
  if (!transport) throw new Error("No hay correo configurado (Configuración → Correo)");
  try {
    const results: (string | null)[] = [];
    for (const mail of mails) {
      try {
        await transport.send({ ...mail, replyTo });
        results.push(null);
      } catch (err) {
        results.push(err instanceof Error ? err.message : String(err));
      }
    }
    return results;
  } finally {
    transport.close();
  }
}

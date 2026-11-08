import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret-box";

export const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_security",
  "smtp_user",
  "smtp_password",
  "smtp_from_email",
  "smtp_from_name",
] as const;

export type SmtpSecurity = "ssl" | "starttls" | "none";

export type SmtpSettings = {
  configured: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  user: string;
  hasPassword: boolean;
  fromEmail: string;
  fromName: string;
};

// Lo que ve el panel (sin la contraseña).
export async function getSmtpSettings(tenantId: string): Promise<SmtpSettings> {
  const rows = await prisma.settings.findMany({ where: { tenantId, key: { in: [...SMTP_KEYS] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const security = (["ssl", "starttls", "none"] as const).find((s) => s === map.smtp_security) ?? "ssl";
  const host = map.smtp_host ?? "";
  const fromEmail = map.smtp_from_email || map.smtp_user || "";
  return {
    configured: Boolean(host && fromEmail),
    host,
    port: Number(map.smtp_port) || (security === "ssl" ? 465 : 587),
    security,
    user: map.smtp_user ?? "",
    hasPassword: Boolean(map.smtp_password),
    fromEmail,
    fromName: map.smtp_from_name ?? "",
  };
}

// Para el mailer: incluye la contraseña descifrada.
export async function getSmtpCredentials(tenantId: string) {
  const settings = await getSmtpSettings(tenantId);
  if (!settings.configured) return null;
  const row = await prisma.settings.findUnique({ where: { tenantId_key: { tenantId, key: "smtp_password" } } });
  return { ...settings, password: decryptSecret(row?.value) ?? "" };
}

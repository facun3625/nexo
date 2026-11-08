"use server";

import { headers } from "next/headers";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { sendMail } from "@/lib/mailer";
import { getStoreSettings } from "@/lib/settings";
import { passwordResetEmail } from "@/lib/email-templates";
import { createPasswordResetToken } from "@/lib/password-reset";
import { EMAIL_RULE, clientIp, isRateLimited, recordFailure } from "@/lib/rate-limit";

export async function requestPasswordReset(rawEmail: string) {
  try {
    return await runRequestPasswordReset(rawEmail);
  } catch (err) {
    return toUserError(err, "No se pudo enviar el mail de recuperación");
  }
}

async function runRequestPasswordReset(rawEmail: string) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new ActionError("Tienda no encontrada");

  const email = rawEmail.trim().toLowerCase();
  if (!email) throw new ActionError("Ingresá tu email");

  // Sin esto, cualquiera puede pedir mails de recuperación en loop y usar
  // la tienda para bombardear la casilla de un tercero. Se corta por cuenta
  // y por IP, y se devuelve silencio en vez de un error — igual que cuando
  // la cuenta no existe, para no filtrar nada.
  const hdrs = await headers();
  const accountKey = `pwreset:${tenant.id}:${email}`;
  const ipKey = `pwreset-ip:${clientIp(hdrs)}`;
  const [accountBlocked, ipBlocked] = await Promise.all([
    isRateLimited(accountKey, EMAIL_RULE),
    isRateLimited(ipKey, EMAIL_RULE),
  ]);
  if (accountBlocked || ipBlocked) return { ok: true as const };
  await Promise.all([recordFailure(accountKey), recordFailure(ipKey)]);

  const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } });
  // Mismo resultado exista o no la cuenta — no queremos que este form sirva
  // para averiguar qué emails están registrados.
  if (!user) return { ok: true as const };

  const token = await createPasswordResetToken(tenant.id, email);
  const storeSettings = await getStoreSettings(tenant.id);
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const resetUrl = `${protocol}://${host}/restablecer-contrasena?email=${encodeURIComponent(email)}&token=${token}`;

  try {
    await sendMail({
      tenantId: tenant.id,
      to: email,
      subject: `Restablecer tu contraseña — ${storeSettings.storeName}`,
      html: passwordResetEmail({ storeName: storeSettings.storeName, resetUrl }),
      type: "PASSWORD_RESET",
    });
  } catch (e) {
    console.error("No se pudo enviar el mail de recuperación de contraseña", e);
  }
  return { ok: true as const };
}

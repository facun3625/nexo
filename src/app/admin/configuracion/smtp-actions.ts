"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { logActivity } from "@/lib/activity-log";
import { encryptSecret } from "@/lib/secret-box";
import { getStoreSettings } from "@/lib/settings";
import { getSmtpCredentials, SMTP_KEYS } from "@/lib/smtp-settings";
import { smtpTransport } from "@/lib/mailer";

const smtpSchema = z.object({
  host: z.string().trim().min(1, "Ingresá el servidor SMTP").max(200),
  port: z.coerce.number().int().min(1, "Puerto inválido").max(65535, "Puerto inválido"),
  security: z.enum(["ssl", "starttls", "none"]),
  user: z.string().trim().max(200),
  password: z.string().max(500),
  fromEmail: z.email("Ingresá el mail remitente").max(254),
  fromName: z.string().trim().max(120),
});

function parse(form: FormData) {
  return smtpSchema.parse({
    host: form.get("host") ?? "",
    port: form.get("port") ?? "",
    security: form.get("security") ?? "ssl",
    user: form.get("user") ?? "",
    password: form.get("password") ?? "",
    fromEmail: String(form.get("fromEmail") ?? "").trim(),
    fromName: form.get("fromName") ?? "",
  });
}

async function upsert(tenantId: string, key: string, value: string) {
  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value },
    create: { tenantId, key, value },
  });
}

export async function saveSmtpSettings(form: FormData) {
  try {
    const { tenant } = await requireTenantAdmin();
    const data = parse(form);
    await Promise.all([
      upsert(tenant.id, "smtp_host", data.host),
      upsert(tenant.id, "smtp_port", String(data.port)),
      upsert(tenant.id, "smtp_security", data.security),
      upsert(tenant.id, "smtp_user", data.user),
      upsert(tenant.id, "smtp_from_email", data.fromEmail),
      upsert(tenant.id, "smtp_from_name", data.fromName),
      // Vacía = no la tocaron: se deja la que ya estaba.
      data.password ? upsert(tenant.id, "smtp_password", encryptSecret(data.password)) : Promise.resolve(),
    ]);
    await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió la configuración de correo (SMTP)" });
    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo guardar la configuración de correo");
  }
}

export async function removeSmtpSettings() {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: { in: [...SMTP_KEYS] } } });
    await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Quitó la configuración de correo (SMTP)" });
    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo quitar la configuración");
  }
}

// Prueba con lo que está escrito en el formulario (aunque no se haya
// guardado). Si la contraseña quedó vacía, usa la guardada.
export async function sendSmtpTest(form: FormData, to: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const data = parse(form);
    const recipient = z.email("Ingresá a qué mail mandar la prueba").parse(to.trim());
    const password = data.password || (await getSmtpCredentials(tenant.id))?.password || "";
    const { storeName } = await getStoreSettings(tenant.id);
    const transport = smtpTransport({ ...data, password }, storeName);
    try {
      await transport.send({
        to: recipient,
        subject: `Prueba de correo de ${storeName}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2933;"><p>✅ <strong>¡Funciona!</strong></p><p>Este mail salió por el servidor SMTP <strong>${data.host}</strong> configurado en el panel de ${storeName}.</p></div>`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ActionError(`El servidor SMTP respondió: ${message}`);
    } finally {
      transport.close();
    }
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo enviar la prueba");
  }
}

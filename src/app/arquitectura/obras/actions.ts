"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings, getTelegramSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mailer";
import { sendTelegram } from "@/lib/telegram";

export type DevelopmentInquiryState = { ok: boolean; message: string };
const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function sendDevelopmentInquiry(
  developmentId: string,
  _previous: DevelopmentInquiryState,
  formData: FormData,
): Promise<DevelopmentInquiryState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, message: "Inmobiliaria no encontrada." };
  const development = await prisma.estateDevelopment.findFirst({
    where: { id: developmentId, tenantId: tenant.id, published: true },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!development)
    return { ok: false, message: "La obra ya no está disponible." };
  const values: { label: string; value: string }[] = [];
  for (const field of development.fields) {
    const value = String(formData.get(field.id) ?? "").trim();
    if (field.required && !value)
      return { ok: false, message: `Completá “${field.label}”.` };
    if (field.type === "EMAIL" && value && !z.email().safeParse(value).success)
      return { ok: false, message: "Ingresá un email válido." };
    if (field.type === "SELECT" && value && !field.options.includes(value))
      return { ok: false, message: "Una opción elegida no es válida." };
    values.push({ label: field.label, value: value || "—" });
  }
  const inquiry = await prisma.estateDevelopmentInquiry.create({
    data: {
      tenantId: tenant.id,
      developmentId: development.id,
      developmentName: development.name,
      answers: values,
      events: { create: { status: "NEW" } },
    },
  });
  const [store, telegram] = await Promise.all([
    getStoreSettings(tenant.id),
    getTelegramSettings(tenant.id),
  ]);
  const text = [
    `🏗️ <b>Nueva consulta de obra</b>`,
    `<b>${escape(development.name)}</b>`,
    "",
    ...values.map(
      (value) => `<b>${escape(value.label)}:</b> ${escape(value.value)}`,
    ),
  ].join("\n");
  let telegramSent = false;
  let emailSent = false;
  const errors: string[] = [];
  await Promise.all([
    telegram.configured
      ? sendTelegram(telegram.botToken!, telegram.chatId!, text).then(
          (result) => {
            telegramSent = result.ok;
            if (!result.ok) errors.push(`Telegram: ${result.error ?? "falló"}`);
          },
        )
      : Promise.resolve(),
    store.email
      ? sendMail({
          tenantId: tenant.id,
          to: store.email,
          subject: `Consulta por ${development.name} — ${store.storeName}`,
          html: `<h2>Nueva consulta por ${escape(development.name)}</h2>${values.map((value) => `<p><strong>${escape(value.label)}:</strong> ${escape(value.value)}</p>`).join("")}`,
          type: "DEVELOPMENT_INQUIRY",
        })
          .then(() => {
            emailSent = true;
          })
          .catch((error) =>
            errors.push(
              `Mail: ${error instanceof Error ? error.message : "falló"}`,
            ),
          )
      : Promise.resolve(),
  ]);
  await prisma.estateDevelopmentInquiry.update({
    where: { id: inquiry.id },
    data: {
      telegramSent,
      emailSent,
      notificationError: errors.join(" · ") || null,
    },
  });
  return {
    ok: true,
    message: "Consulta enviada. Te vamos a contactar pronto.",
  };
}

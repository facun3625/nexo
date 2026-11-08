"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { logActivity } from "@/lib/activity-log";
import { actorName } from "@/lib/estate/inquiry-status";
import { getStoreSettings } from "@/lib/settings";
import { isMailerConfigured, sendMail } from "@/lib/mailer";
import { getAudience, getMailBrand, getMailCatalog, normalizeEmail } from "@/lib/email-marketing/data";
import { runCampaign } from "@/lib/email-marketing/send";
import {
  applyNameToken,
  MAIL_TEMPLATES,
  MAX_MAIL_ITEMS,
  renderMarketingEmail,
  type MailContent,
  type MailItem,
} from "@/lib/email-marketing/templates";

const draftSchema = z.object({
  template: z.enum(MAIL_TEMPLATES.map((t) => t.id) as [MailContent["template"], ...MailContent["template"][]]),
  subject: z.string().trim().min(1, "Escribí el asunto del mail").max(150),
  heading: z.string().trim().max(150),
  intro: z.string().trim().max(4000),
  ctaLabel: z.string().trim().max(60),
  ctaUrl: z.string().trim().max(500),
  signature: z.string().trim().max(500),
  items: z
    .array(z.object({ kind: z.enum(["property", "development"]), id: z.string().min(1).max(40) }))
    .max(MAX_MAIL_ITEMS, `Elegí hasta ${MAX_MAIL_ITEMS} propiedades`),
});

export type MailDraft = z.input<typeof draftSchema>;

// Las propiedades se vuelven a leer de la base: el mail sale con los datos
// y precios actuales, no con lo que haya mandado el navegador.
async function buildContent(tenantId: string, draft: MailDraft): Promise<MailContent> {
  const parsed = draftSchema.parse(draft);
  const catalog = await getMailCatalog(tenantId);
  const items = parsed.items
    .map((ref) => (ref.kind === "property" ? catalog.properties : catalog.developments).find((i) => i.id === ref.id))
    .filter((i): i is MailItem => Boolean(i));
  if (items.length === 0 && !parsed.intro) throw new ActionError("Agregá al menos una propiedad o un texto");
  return { ...parsed, items };
}

const emailSchema = z.email("Ingresá un mail válido").max(254);

export async function sendTestEmail(draft: MailDraft, to: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    if (!(await isMailerConfigured(tenant.id))) throw new ActionError("Todavía no hay correo configurado: cargá el SMTP en Configuración → Correo.");
    const email = emailSchema.parse(to.trim());
    const content = await buildContent(tenant.id, draft);
    const brand = await getMailBrand(tenant.id);
    await sendMail({
      tenantId: tenant.id,
      to: email,
      subject: `[Prueba] ${applyNameToken(content.subject, "")}`,
      html: renderMarketingEmail(content, brand, { recipientName: "", unsubscribeUrl: `${brand.siteUrl}/baja` }),
      type: "MARKETING_TEST",
    });
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo enviar el mail de prueba");
  }
}

// Envío a una sola persona (un cliente): sale al toque, sin lista ni link
// de baja, y las respuestas le llegan a quien lo mandó.
export async function sendToClient(draft: MailDraft, recipient: { email: string; name: string }) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    if (!(await isMailerConfigured(tenant.id))) throw new ActionError("Todavía no hay correo configurado: cargá el SMTP en Configuración → Correo.");
    const email = normalizeEmail(emailSchema.parse(recipient.email.trim()));
    const name = recipient.name.trim().slice(0, 120);
    const content = await buildContent(tenant.id, draft);
    const [brand, settings] = await Promise.all([getMailBrand(tenant.id), getStoreSettings(tenant.id)]);
    const subject = applyNameToken(content.subject, name);

    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId: tenant.id,
        subject,
        template: content.template,
        content: content as unknown as object,
        audience: "SINGLE",
        status: "SENDING",
        recipientCount: 1,
        createdById: session.user.id,
        createdByName: actorName(session.user),
        recipients: { create: { email, name } },
      },
    });
    try {
      await sendMail({
        tenantId: tenant.id,
        to: email,
        subject,
        html: renderMarketingEmail(content, brand, { recipientName: name }),
        type: "PROPERTY_SHARE",
        replyTo: session.user.email || settings.email,
      });
      await prisma.$transaction([
        prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: "SENT", sentCount: 1, finishedAt: new Date() } }),
        prisma.emailCampaignRecipient.updateMany({ where: { campaignId: campaign.id }, data: { success: true, sentAt: new Date() } }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.$transaction([
        prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: "FAILED", failedCount: 1, finishedAt: new Date() } }),
        prisma.emailCampaignRecipient.updateMany({ where: { campaignId: campaign.id }, data: { success: false, error: message.slice(0, 300) } }),
      ]);
      throw new ActionError(`El servicio de mails rechazó el envío: ${message}`);
    }
    await logActivity(
      tenant.id,
      { entity: "email", entityId: campaign.id, action: "SEND_SINGLE", summary: `Le mandó por mail «${subject}» a ${name || email}` },
      { user: session.user },
    );
    revalidatePath("/admin/email-marketing");
    return { ok: true as const, id: campaign.id };
  } catch (error) {
    return toUserError(error, "No se pudo enviar el mail");
  }
}

export async function sendCampaign(draft: MailDraft, includeContacts: boolean) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    if (!(await isMailerConfigured(tenant.id))) throw new ActionError("Todavía no hay correo configurado: cargá el SMTP en Configuración → Correo.");
    const content = await buildContent(tenant.id, draft);
    const audience = await getAudience(tenant.id, includeContacts);
    if (audience.length === 0) throw new ActionError("No hay nadie en la lista para mandarle este mail.");

    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId: tenant.id,
        subject: content.subject,
        template: content.template,
        content: content as unknown as object,
        audience: includeContacts ? "LIST_AND_CONTACTS" : "LIST",
        status: "SENDING",
        recipientCount: audience.length,
        createdById: session.user.id,
        createdByName: actorName(session.user),
      },
    });
    await prisma.emailCampaignRecipient.createMany({
      data: audience.map((r) => ({ campaignId: campaign.id, email: r.email, name: r.name })),
    });
    await logActivity(
      tenant.id,
      { entity: "email", entityId: campaign.id, action: "SEND_CAMPAIGN", summary: `Envió el mail «${content.subject}» a ${audience.length} personas` },
      { user: session.user },
    );
    after(() => runCampaign(campaign.id).catch((err) => console.error("Falló el envío de la campaña", campaign.id, err)));
    revalidatePath("/admin/email-marketing");
    return { ok: true as const, id: campaign.id };
  } catch (error) {
    return toUserError(error, "No se pudo enviar el mail");
  }
}

// ---------- Suscriptores ----------

export async function addSubscriber(email: string, name: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const normalized = normalizeEmail(emailSchema.parse(email.trim()));
    await prisma.emailSubscriber.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: normalized } },
      update: { unsubscribedAt: null, ...(name.trim() ? { name: name.trim().slice(0, 120) } : {}) },
      create: { tenantId: tenant.id, email: normalized, name: name.trim().slice(0, 120), source: "ADMIN" },
    });
    await logActivity(tenant.id, { entity: "email", action: "SUBSCRIBER_ADD", summary: `Agregó a ${normalized} a la lista de mails` });
    revalidatePath("/admin/email-marketing");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo agregar el suscriptor");
  }
}

export async function setSubscriberActive(id: string, active: boolean) {
  try {
    const { tenant } = await requireTenantAdmin();
    const sub = await prisma.emailSubscriber.findFirst({ where: { id, tenantId: tenant.id } });
    if (!sub) throw new ActionError("Suscriptor no encontrado");
    await prisma.emailSubscriber.update({ where: { id }, data: { unsubscribedAt: active ? null : new Date() } });
    await logActivity(tenant.id, {
      entity: "email",
      action: active ? "SUBSCRIBER_REACTIVATE" : "SUBSCRIBER_UNSUBSCRIBE",
      summary: `${active ? "Volvió a suscribir" : "Dio de baja"} a ${sub.email}`,
    });
    revalidatePath("/admin/email-marketing");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo actualizar el suscriptor");
  }
}

export async function deleteSubscriber(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const sub = await prisma.emailSubscriber.findFirst({ where: { id, tenantId: tenant.id } });
    if (!sub) throw new ActionError("Suscriptor no encontrado");
    await prisma.emailSubscriber.delete({ where: { id } });
    await logActivity(tenant.id, { entity: "email", action: "SUBSCRIBER_DELETE", summary: `Borró a ${sub.email} de la lista de mails` });
    revalidatePath("/admin/email-marketing");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo borrar el suscriptor");
  }
}

export async function setNewsletterSignup(enabled: boolean) {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.settings.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: "newsletter_signup" } },
      update: { value: enabled ? "on" : "off" },
      create: { tenantId: tenant.id, key: "newsletter_signup", value: enabled ? "on" : "off" },
    });
    await logActivity(tenant.id, {
      entity: "email",
      action: "SIGNUP_TOGGLE",
      summary: `${enabled ? "Mostró" : "Ocultó"} el formulario de suscripción del sitio`,
    });
    revalidatePath("/", "layout");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo guardar");
  }
}

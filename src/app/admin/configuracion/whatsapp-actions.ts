"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { logActivity } from "@/lib/activity-log";
import { WHATSAPP_TEMPLATES, WHATSAPP_TEMPLATE_IDS, type WhatsappTemplateId } from "@/lib/whatsapp-templates";

const MAX_LENGTH = 1500;

// Un texto igual al original (o vacío) no se guarda: así, si más adelante
// cambia el texto de fábrica, le llega a quien nunca lo tocó.
export async function saveWhatsappTemplate(id: WhatsappTemplateId, text: string) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    if (!WHATSAPP_TEMPLATE_IDS.includes(id)) throw new ActionError("Texto no encontrado");
    const def = WHATSAPP_TEMPLATES[id];
    const value = text.trim();
    if (value.length > MAX_LENGTH) throw new ActionError(`El texto puede tener hasta ${MAX_LENGTH} caracteres`);
    if (!value || value === def.default) {
      await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: def.key } });
    } else {
      await prisma.settings.upsert({
        where: { tenantId_key: { tenantId: tenant.id, key: def.key } },
        update: { value },
        create: { tenantId: tenant.id, key: def.key, value },
      });
    }
    await logActivity(
      tenant.id,
      { entity: "configuracion", action: "UPDATE", summary: `Cambió el texto de WhatsApp «${def.label}»` },
      { user: session.user },
    );
    revalidatePath("/admin", "layout");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo guardar el texto");
  }
}

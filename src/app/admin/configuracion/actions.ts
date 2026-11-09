"use server";

import { ActionError, toUserError } from "@/lib/action-error";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/activity-log";
import { saveUploadedFile } from "@/lib/storage";
import { saveTextSetting, saveImageSetting } from "@/lib/settings-storage";
import { getTelegramSettings } from "@/lib/settings";
import { sendTelegram } from "@/lib/telegram";
import { DEFAULT_AI_MODELS } from "@/lib/ai-agent/types";

// ---------- Editor de texto enriquecido (compartido) ----------

export async function uploadRichTextImage(formData: FormData) {
  try {
    return await runUploadRichTextImage(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUploadRichTextImage(formData: FormData) {
  await requireTenantAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new ActionError("Elegí una imagen");
  if (!file.type.startsWith("image/")) throw new ActionError("El archivo debe ser una imagen");
  return saveUploadedFile(file, "content");
}

export async function updatePopupConfig(formData: FormData) {
  try {
    return await runUpdatePopupConfig(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdatePopupConfig(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const enabled = formData.get("enabled") === "true";
  const frequency = String(formData.get("frequency") ?? "ONCE");
  const html = String(formData.get("html") ?? "");

  await Promise.all([
    saveTextSetting(tenant.id, String(enabled), "popup_enabled"),
    saveTextSetting(tenant.id, frequency, "popup_frequency"),
    saveTextSetting(tenant.id, html, "popup_html"),
    saveTextSetting(tenant.id, String(Date.now()), "popup_version"),
  ]);
  revalidatePath("/");
  revalidatePath("/admin/configuracion");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió el pop-up del sitio" });
  return { ok: true as const };
}

// ---------- Modo mantenimiento ----------

export async function updateMaintenanceConfig(formData: FormData) {
  try {
    return await runUpdateMaintenanceConfig(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateMaintenanceConfig(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const enabled = formData.get("enabled") === "true";
  const html = String(formData.get("html") ?? "");

  await Promise.all([
    saveTextSetting(tenant.id, String(enabled), "maintenance_enabled"),
    saveTextSetting(tenant.id, html, "maintenance_html"),
  ]);
  revalidatePath("/", "layout");
  await logActivity(tenant.id, {
    entity: "configuracion",
    action: "UPDATE",
    summary: enabled ? "Puso el sitio en mantenimiento" : "Sacó el sitio de mantenimiento",
  });
  return { ok: true as const };
}

// ---------- Telegram (aviso al equipo) ----------

const telegramSchema = z.object({
  botToken: z.string().optional(),
  chatId: z.string().min(1, "Ingresá el chat ID"),
});

export async function updateTelegramSettings(formData: FormData) {
  try {
    return await runUpdateTelegramSettings(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateTelegramSettings(formData: FormData) {
  const { tenant } = await requireTenantAdmin();

  const parsed = telegramSchema.parse({
    botToken: formData.get("botToken") || undefined,
    chatId: formData.get("chatId"),
  });

  // El token es secreto: si el campo vino vacío es porque ya estaba
  // cargado y no lo tocaron — no lo pisamos con "".
  const existingToken = (
    await prisma.settings.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: "telegram_bot_token" } } })
  )?.value;
  if (!parsed.botToken && !existingToken) {
    throw new ActionError("Ingresá el token del bot");
  }

  await Promise.all([
    saveTextSetting(tenant.id, parsed.chatId, "telegram_chat_id"),
    parsed.botToken ? saveTextSetting(tenant.id, parsed.botToken, "telegram_bot_token") : Promise.resolve(),
  ]);

  revalidatePath("/admin/configuracion");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió la configuración de Telegram" });
  return { ok: true as const };
}

export async function removeTelegramSettings() {
  try {
    return await runRemoveTelegramSettings();
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runRemoveTelegramSettings() {
  const { tenant } = await requireTenantAdmin();
  await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: { in: ["telegram_bot_token", "telegram_chat_id"] } } });
  revalidatePath("/admin/configuracion");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Desconectó Telegram" });
  return { ok: true as const };
}

export async function sendTestTelegram(draftToken: string, draftChatId: string) {
  try {
    return await runSendTestTelegram(draftToken, draftChatId);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runSendTestTelegram(draftToken: string, draftChatId: string) {
  const { tenant } = await requireTenantAdmin();
  const saved = await getTelegramSettings(tenant.id);
  const token = draftToken.trim() || saved.botToken || "";
  const chatId = draftChatId.trim() || saved.chatId || "";
  if (!token || !chatId) throw new ActionError("Faltan el token o el chat ID");

  const result = await sendTelegram(token, chatId, "✅ <b>Prueba</b>\nSi ves este mensaje, los avisos al equipo están funcionando.");
  if (!result.ok) throw new ActionError(result.error ?? "No se pudo enviar");
  return { ok: true as const };
}

// ---------- SEO ----------

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function updateSeoSettings(formData: FormData) {
  try {
    return await runUpdateSeoSettings(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateSeoSettings(formData: FormData) {
  const { tenant } = await requireTenantAdmin();

  const parsed = seoSchema.parse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
  });

  await Promise.all([
    saveTextSetting(tenant.id, parsed.title, "seo_title"),
    saveTextSetting(tenant.id, parsed.description, "seo_description"),
  ]);

  await saveImageSetting(tenant.id, formData.get("ogImage") as File | null, "seo_og_image_url");

  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió la configuración de SEO" });
  return { ok: true as const };
}

export async function removeSeoImage() {
  try {
    return await runRemoveSeoImage();
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runRemoveSeoImage() {
  const { tenant } = await requireTenantAdmin();
  await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: "seo_og_image_url" } });
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Quitó la imagen para redes (SEO)" });
  return { ok: true as const };
}

// ---------- Agente de ventas IA ----------

const aiProviderSchema = z.object({
  provider: z.enum(["", "openai", "gemini"]),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export async function updateAiProviderSettings(formData: FormData) {
  try {
    return await runUpdateAiProviderSettings(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateAiProviderSettings(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const parsed = aiProviderSchema.parse({
    provider: formData.get("provider") || "",
    apiKey: formData.get("apiKey") || undefined,
    model: formData.get("model") || undefined,
  });
  const provider = parsed.provider || null;

  // La clave es secreta: si el campo vino vacío es porque ya estaba cargada
  // y no la tocaron — no la pisamos con "". Si cambió de proveedor sin
  // cargar una clave nueva, la vieja ya no sirve para el proveedor nuevo.
  const existing = await prisma.settings.findUnique({
    where: { tenantId_key: { tenantId: tenant.id, key: "ai_provider" } },
  });
  const changedProvider = provider !== (existing?.value || null);

  await Promise.all([
    saveTextSetting(tenant.id, provider ?? undefined, "ai_provider"),
    saveTextSetting(
      tenant.id,
      parsed.model?.trim() || (provider ? DEFAULT_AI_MODELS[provider] : undefined),
      "ai_model",
    ),
    parsed.apiKey
      ? saveTextSetting(tenant.id, parsed.apiKey, "ai_api_key")
      : changedProvider
        ? saveTextSetting(tenant.id, undefined, "ai_api_key")
        : Promise.resolve(),
  ]);

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió el proveedor de IA" });
  return { ok: true as const };
}

const aiAssistantSchema = z.object({
  enabled: z.string().optional(),
  name: z.string().max(60).optional(),
  welcomeMessage: z.string().max(500).optional(),
  instructions: z.string().max(6000).optional(),
  humanStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  humanEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export async function updateAiAssistantSettings(formData: FormData) {
  try {
    return await runUpdateAiAssistantSettings(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateAiAssistantSettings(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const humanDays = formData
    .getAll("humanDays")
    .map((v) => Number(v))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const parsed = aiAssistantSchema.parse({
    enabled: formData.get("enabled") || undefined,
    name: formData.get("name") || undefined,
    welcomeMessage: formData.get("welcomeMessage") || undefined,
    instructions: formData.get("instructions") || undefined,
    humanStartTime: formData.get("humanStartTime") || "09:00",
    humanEndTime: formData.get("humanEndTime") || "18:00",
  });

  await Promise.all([
    saveTextSetting(tenant.id, parsed.enabled === "true" ? "true" : "false", "ai_assistant_enabled"),
    saveTextSetting(tenant.id, parsed.name, "ai_assistant_name"),
    saveTextSetting(tenant.id, parsed.welcomeMessage, "ai_welcome_message"),
    saveTextSetting(tenant.id, parsed.instructions, "ai_instructions"),
    saveTextSetting(tenant.id, humanDays.join(","), "ai_human_days"),
    saveTextSetting(tenant.id, parsed.humanStartTime, "ai_human_start_time"),
    saveTextSetting(tenant.id, parsed.humanEndTime, "ai_human_end_time"),
  ]);

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "configuracion", action: "UPDATE", summary: "Cambió la configuración del asistente IA" });
  return { ok: true as const };
}

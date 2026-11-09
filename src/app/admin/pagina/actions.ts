"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/activity-log";
import { saveUploadedFile } from "@/lib/storage";
import { saveTextSetting, saveImageSetting, saveFaviconSetting } from "@/lib/settings-storage";
import { CATALOG_FILTER_KEYS, CATALOG_FILTER_LABELS } from "@/lib/estate/catalog-filters";
import { STORE_TEMPLATES } from "./templates";
import { ARQ_ENABLED_KEY, ARQ_SETTINGS_KEY, arqContentSchema } from "@/lib/arquitectura";

// ---------- Identidad (nombre, logo, favicon, textos del sitio) ----------

const hexColor = z
  .union([z.literal(""), z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")]);
const identitySchema = z.object({
  storeName: z.string().min(1, "Ingresá el nombre del negocio"),
  headerBgColor: hexColor,
  menuBgColor: hexColor,
  footerBgColor: hexColor,
  buttonColor: hexColor,
  badgeColor: hexColor,
  showNameInHeader: z.boolean(),
  logoHeight: z.coerce.number().int().min(32).max(120),
  footerLogoHeight: z.coerce.number().int().min(32).max(120),
});

export async function updateIdentity(formData: FormData) {
  try {
    return await runUpdateIdentity(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la identidad");
  }
}

async function runUpdateIdentity(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const parsed = identitySchema.parse({
    storeName: formData.get("storeName"),
    headerBgColor: formData.get("headerBgColor") ?? "",
    menuBgColor: formData.get("menuBgColor") ?? "",
    footerBgColor: formData.get("footerBgColor") ?? "",
    buttonColor: formData.get("buttonColor") ?? "",
    badgeColor: formData.get("badgeColor") ?? "",
    showNameInHeader: formData.has("showNameInHeader"),
    logoHeight: formData.get("logoHeight") || 64,
    footerLogoHeight: formData.get("footerLogoHeight") || 56,
  });

  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "store_name" } },
    update: { value: parsed.storeName },
    create: { tenantId: tenant.id, key: "store_name", value: parsed.storeName },
  });
  await saveImageSetting(tenant.id, formData.get("logo") as File | null, "store_logo_url");
  await saveImageSetting(tenant.id, formData.get("footerLogo") as File | null, "store_footer_logo_url");
  await saveFaviconSetting(tenant.id, formData.get("favicon") as File | null, "store_favicon_url");
  await saveTextSetting(tenant.id, formData.get("addToCartLabel") as string | null ?? undefined, "store_add_to_cart_label");
  await saveTextSetting(tenant.id, parsed.headerBgColor, "store_header_bg_color");
  await saveTextSetting(tenant.id, parsed.menuBgColor, "store_menu_bg_color");
  await saveTextSetting(tenant.id, parsed.footerBgColor, "store_footer_bg_color");
  await saveTextSetting(tenant.id, parsed.buttonColor, "store_button_color");
  await saveTextSetting(tenant.id, parsed.badgeColor, "store_badge_color");
  await saveTextSetting(
    tenant.id,
    parsed.showNameInHeader ? undefined : "false",
    "store_show_name_in_header",
  );
  await saveTextSetting(
    tenant.id,
    parsed.logoHeight === 64 ? undefined : String(parsed.logoHeight),
    "store_logo_height",
  );
  await saveTextSetting(
    tenant.id,
    parsed.footerLogoHeight === 56 ? undefined : String(parsed.footerLogoHeight),
    "store_footer_logo_height",
  );

  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió la identidad del sitio (nombre, logo, colores)" });
  return { ok: true as const };
}

// ---------- Home (portada) ----------

export async function updateHome(formData: FormData) {
  try {
    return await runUpdateHome(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la página de inicio");
  }
}

async function runUpdateHome(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  await saveImageSetting(tenant.id, formData.get("cover") as File | null, "store_cover_url");
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió la foto de portada" });
  return { ok: true as const };
}

// ---------- Datos de contacto ----------

const contactSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export async function updateContact(formData: FormData) {
  try {
    return await runUpdateContact(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar los datos de contacto");
  }
}

async function runUpdateContact(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const parsed = contactSchema.parse({
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    province: formData.get("province") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
  });

  await Promise.all([
    saveTextSetting(tenant.id, parsed.address, "store_address"),
    saveTextSetting(tenant.id, parsed.city, "store_city"),
    saveTextSetting(tenant.id, parsed.province, "store_province"),
    saveTextSetting(tenant.id, parsed.phone, "store_phone"),
    saveTextSetting(tenant.id, parsed.email, "store_email"),
  ]);
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió los datos de contacto" });
  return { ok: true as const };
}

// ---------- Redes sociales ----------

const socialSchema = z.object({
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
});

export async function updateSocial(formData: FormData) {
  try {
    return await runUpdateSocial(formData);
  } catch (err) {
    return toUserError(err, "No se pudieron guardar las redes");
  }
}

async function runUpdateSocial(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const parsed = socialSchema.parse({
    whatsapp: formData.get("whatsapp") || undefined,
    instagram: formData.get("instagram") || undefined,
    facebook: formData.get("facebook") || undefined,
    youtube: formData.get("youtube") || undefined,
  });

  await Promise.all([
    saveTextSetting(tenant.id, parsed.whatsapp, "store_whatsapp"),
    saveTextSetting(tenant.id, parsed.instagram, "store_instagram"),
    saveTextSetting(tenant.id, parsed.facebook, "store_facebook"),
    saveTextSetting(tenant.id, parsed.youtube, "store_youtube"),
  ]);
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió las redes sociales" });
  return { ok: true as const };
}

// ---------- Footer (textos, el resto ya sale de Identidad/Contacto/Redes) ----------

export async function updateFooter(formData: FormData) {
  try {
    return await runUpdateFooter(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar el footer");
  }
}

async function runUpdateFooter(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  await Promise.all([
    saveTextSetting(tenant.id, formData.get("footerTagline") as string | null ?? undefined, "store_footer_tagline"),
    saveTextSetting(
      tenant.id,
      formData.get("footerPitchTitle") as string | null ?? undefined,
      "store_footer_pitch_title",
    ),
    saveTextSetting(
      tenant.id,
      formData.get("footerPitchText") as string | null ?? undefined,
      "store_footer_pitch_text",
    ),
  ]);
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió el pie de página" });
  return { ok: true as const };
}

// ---------- Template (mock: por ahora todos usan el mismo diseño) ----------

export async function updateTemplate(templateId: string) {
  try {
    return await runUpdateTemplate(templateId);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la plantilla");
  }
}

async function runUpdateTemplate(templateId: string) {
  if (!STORE_TEMPLATES.includes(templateId as (typeof STORE_TEMPLATES)[number])) {
    throw new ActionError("Plantilla inválida");
  }
  const { tenant } = await requireTenantAdmin();
  await saveTextSetting(tenant.id, templateId, "store_template");
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió la plantilla del sitio" });
  return { ok: true as const };
}

// ---------- Filtros del buscador público (home, /mapa) ----------

export async function updateCatalogFilters(formData: FormData) {
  try {
    return await runUpdateCatalogFilters(formData);
  } catch (err) {
    return toUserError(err, "No se pudieron guardar los filtros");
  }
}

async function runUpdateCatalogFilters(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  // Un solo campo con la lista ordenada (el orden en que el admin las dejó
  // en /admin/pagina es el orden en que se muestran en el buscador — ver
  // PropertySearchForm). Se valida cada token por las dudas de que llegue
  // algo raro.
  const raw = String(formData.get("filters") ?? "");
  const enabled = raw
    .split(",")
    .map((v) => v.trim())
    .filter((key): key is (typeof CATALOG_FILTER_KEYS)[number] =>
      CATALOG_FILTER_KEYS.includes(key as (typeof CATALOG_FILTER_KEYS)[number]),
    );
  // "none" en vez de string vacío: saveTextSetting borra la fila si el valor
  // es falsy, y sin este sentinel "destildé todo a propósito" quedaría
  // indistinguible de "todavía no configuró nada" (ver getCatalogFilterSettings).
  await saveTextSetting(tenant.id, enabled.length ? enabled.join(",") : "none", "catalog_filters");

  // Textos personalizados de la opción "sin elegir" de cada select (ej.
  // "Ciudad" en vez de "Cualquier tipo") — solo se guardan los que el admin
  // dejó distintos del default, para no arrastrar basura si el día de
  // mañana cambia CATALOG_FILTER_LABELS.
  const rawLabels = String(formData.get("labels") ?? "{}");
  let labelsInput: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(rawLabels);
    if (parsed && typeof parsed === "object") labelsInput = parsed;
  } catch {
    // ignorar JSON inválido — no rompe el guardado del resto del form
  }
  const overrides: Record<string, string> = {};
  for (const key of CATALOG_FILTER_KEYS) {
    const value = labelsInput[key];
    if (typeof value === "string" && value.trim() && value.trim() !== CATALOG_FILTER_LABELS[key]) {
      overrides[key] = value.trim().slice(0, 60);
    }
  }
  await saveTextSetting(
    tenant.id,
    Object.keys(overrides).length ? JSON.stringify(overrides) : undefined,
    "catalog_filter_labels",
  );

  revalidatePath("/", "layout");
  revalidatePath("/mapa");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió los filtros del catálogo" });
  return { ok: true as const };
}

// ---------- Imágenes (remover logo/portada/favicon) ----------

export async function removeStoreImage(
  key: "store_logo_url" | "store_footer_logo_url" | "store_cover_url" | "store_favicon_url",
) {
  try {
    return await runRemoveStoreImage(key);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runRemoveStoreImage(
  key: "store_logo_url" | "store_footer_logo_url" | "store_cover_url" | "store_favicon_url",
) {
  const { tenant } = await requireTenantAdmin();
  await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key } });
  revalidatePath("/", "layout");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Quitó una imagen del sitio" });
  return { ok: true as const };
}

// ---------- Sobre nosotros ----------

export async function updateAboutText(formData: FormData) {
  try {
    return await runUpdateAboutText(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runUpdateAboutText(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  await saveTextSetting(tenant.id, String(formData.get("text") ?? ""), "about_text");
  await saveTextSetting(
    tenant.id,
    formData.get("columns") === "true" ? "true" : undefined,
    "about_text_columns",
  );
  revalidatePath("/sobre-nosotros");
  revalidatePath("/admin/pagina");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Editó el texto de Sobre nosotros" });
  return { ok: true as const };
}

export async function addAboutMedia(formData: FormData) {
  try {
    return await runAddAboutMedia(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runAddAboutMedia(formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new ActionError("Elegí un archivo");

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) throw new ActionError("El archivo debe ser una imagen o un video");

  const url = await saveUploadedFile(file, "about");
  const last = await prisma.aboutMedia.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { order: "desc" },
  });
  await prisma.aboutMedia.create({
    data: {
      tenantId: tenant.id,
      type: isImage ? "IMAGE" : "VIDEO",
      url,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath("/sobre-nosotros");
  revalidatePath("/admin/pagina");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Agregó una foto o video a Sobre nosotros" });
  return { ok: true as const };
}

export async function deleteAboutMedia(id: string) {
  try {
    return await runDeleteAboutMedia(id);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runDeleteAboutMedia(id: string) {
  const { tenant } = await requireTenantAdmin();
  await prisma.aboutMedia.delete({ where: { id, tenantId: tenant.id } });
  revalidatePath("/sobre-nosotros");
  revalidatePath("/admin/pagina");
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Quitó una foto o video de Sobre nosotros" });
  return { ok: true as const };
}

export async function reorderAboutMedia(orderedIds: string[]) {
  try {
    return await runReorderAboutMedia(orderedIds);
  } catch (err) {
    return toUserError(err, "No se pudo guardar la configuración");
  }
}

async function runReorderAboutMedia(orderedIds: string[]) {
  const { tenant } = await requireTenantAdmin();
  await prisma.$transaction(
    orderedIds.map((id, i) => prisma.aboutMedia.update({ where: { id, tenantId: tenant.id }, data: { order: i } })),
  );
  revalidatePath("/sobre-nosotros");
  revalidatePath("/admin/pagina");
  return { ok: true as const };
}

// ---------- Arquitectura (Equipo, Servicios, portada de Obras) ----------

export async function saveArqContent(json: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch {
      throw new ActionError("Contenido inválido");
    }
    const parsed = arqContentSchema.safeParse(raw);
    if (!parsed.success) throw new ActionError("Revisá los textos: alguno es demasiado largo.");
    await prisma.settings.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: ARQ_SETTINGS_KEY } },
      update: { value: JSON.stringify(parsed.data) },
      create: { tenantId: tenant.id, key: ARQ_SETTINGS_KEY, value: JSON.stringify(parsed.data) },
    });
    revalidatePath("/arquitectura", "layout");
    revalidatePath("/admin/pagina");
    await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Editó las páginas de Arquitectura" });
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo guardar");
  }
}

// Muestra u oculta la sección en el sitio público (menú, Inicio y páginas).
export async function setArqEnabled(enabled: boolean) {
  try {
    const { tenant } = await requireTenantAdmin();
    const value = enabled ? "true" : "false";
    await prisma.settings.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: ARQ_ENABLED_KEY } },
      update: { value },
      create: { tenantId: tenant.id, key: ARQ_ENABLED_KEY, value },
    });
    revalidatePath("/", "layout");
    await logActivity(tenant.id, {
      entity: "pagina",
      action: "UPDATE",
      summary: enabled ? "Mostró la sección Arquitectura en el sitio" : "Ocultó la sección Arquitectura del sitio",
    });
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo cambiar la visibilidad");
  }
}

export async function resetArqContent() {
  try {
    const { tenant } = await requireTenantAdmin();
    await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: ARQ_SETTINGS_KEY } });
    revalidatePath("/arquitectura", "layout");
    revalidatePath("/admin/pagina");
    await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Vació el contenido de Arquitectura" });
    return { ok: true as const };
  } catch (err) {
    return toUserError(err, "No se pudo restablecer");
  }
}

// Sube una foto y devuelve la URL; queda en uso recién cuando se guarda el
// contenido con saveArqContent.
export async function uploadArqImage(formData: FormData) {
  try {
    await requireTenantAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new ActionError("Elegí una imagen");
    if (!file.type.startsWith("image/")) throw new ActionError("El archivo debe ser una imagen");
    if (file.size > 15 * 1024 * 1024) throw new ActionError("La imagen no puede pesar más de 15 MB");
    const url = await saveUploadedFile(file, "arquitectura");
    return { ok: true as const, url };
  } catch (err) {
    return toUserError(err, "No se pudo subir la imagen");
  }
}

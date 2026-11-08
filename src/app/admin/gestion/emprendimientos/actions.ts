"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ActionError, toUserError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { logActivity } from "@/lib/activity-log";
import { saveUploadedFile } from "@/lib/storage";

const fieldSchema = z.object({
  label: z.string().trim().min(1),
  type: z.enum([
    "TEXT",
    "TEXTAREA",
    "EMAIL",
    "PHONE",
    "NUMBER",
    "DATE",
    "SELECT",
  ]),
  required: z.boolean(),
  options: z.array(z.string()),
});

const schema = z.object({
  name: z.string().trim().min(1, "Ingresá el nombre"),
  address: z.string().trim().min(1, "Ingresá la ubicación"),
  city: z.string().trim().min(1, "Ingresá la ciudad"),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  developer: z.string().trim(),
  stage: z.string().trim().min(1),
  progress: z.number().int().min(0).max(100).nullable(),
  estimatedDelivery: z.string().trim().max(100).nullable(),
  description: z.string().trim().min(1, "Ingresá una descripción"),
  descriptionColumns: z.boolean(),
  amenities: z.array(z.string()),
  financing: z.string().trim(),
  videoUrl: z.string().url("Ingresá una URL de video válida").nullable(),
  formTitle: z.string().trim().min(1),
  submitLabel: z.string().trim().min(1),
  published: z.boolean(),
  categoryId: z.string().trim().nullable(),
  fields: z.array(fieldSchema).min(1, "Agregá al menos un campo al formulario"),
  existingImages: z.array(
    z.object({ id: z.string(), order: z.number().int().nonnegative() }),
  ),
  newImages: z.array(
    z.object({ key: z.string(), order: z.number().int().nonnegative() }),
  ),
});

async function parseAndUpload(formData: FormData) {
  const parsed = schema.parse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    developer: String(formData.get("developer") ?? ""),
    stage: formData.get("stage"),
    progress: formData.get("progress")
      ? Number(formData.get("progress"))
      : null,
    estimatedDelivery:
      String(formData.get("estimatedDelivery") ?? "").trim() || null,
    description: formData.get("description"),
    descriptionColumns: formData.get("descriptionColumns") === "true",
    amenities: String(formData.get("amenities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    financing: String(formData.get("financing") ?? ""),
    videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
    formTitle: formData.get("formTitle"),
    submitLabel: formData.get("submitLabel"),
    published: formData.get("published") === "true",
    categoryId: String(formData.get("categoryId") ?? "").trim() || null,
    fields: JSON.parse(String(formData.get("fields") || "[]")),
    existingImages: JSON.parse(String(formData.get("existingImages") || "[]")),
    newImages: JSON.parse(String(formData.get("newImages") || "[]")),
  });
  const uploaded: { url: string; order: number }[] = [];
  for (const image of parsed.newImages) {
    const file = formData.get(`image_${image.key}`);
    if (file instanceof File && file.size) {
      uploaded.push({
        url: await saveUploadedFile(file, "developments"),
        order: image.order,
      });
    }
  }
  return { parsed, uploaded };
}

export async function saveDevelopment(id: string | null, formData: FormData) {
  try {
    const { tenant } = await requireTenantAdmin();
    const { parsed, uploaded } = await parseAndUpload(formData);
    const { fields, existingImages } = parsed;
    // La FK de categoría no incluye tenantId: validar acá que sea propia.
    if (
      parsed.categoryId &&
      !(await prisma.estateDevelopmentCategory.findFirst({
        where: { id: parsed.categoryId, tenantId: tenant.id },
        select: { id: true },
      }))
    ) {
      throw new ActionError("Categoría no encontrada");
    }
    const data = {
      name: parsed.name,
      address: parsed.address,
      city: parsed.city,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      developer: parsed.developer,
      stage: parsed.stage,
      progress: parsed.progress,
      estimatedDelivery: parsed.estimatedDelivery,
      description: parsed.description,
      descriptionColumns: parsed.descriptionColumns,
      amenities: parsed.amenities,
      financing: parsed.financing,
      videoUrl: parsed.videoUrl,
      formTitle: parsed.formTitle,
      submitLabel: parsed.submitLabel,
      published: parsed.published,
      categoryId: parsed.categoryId,
    };
    const development = await prisma.$transaction(async (tx) => {
      if (!id) {
        return tx.estateDevelopment.create({
          data: {
            ...data,
            tenantId: tenant.id,
            fields: {
              create: fields.map((field, order) => ({
                ...field,
                options: field.type === "SELECT" ? field.options : [],
                order,
              })),
            },
            images: { create: uploaded },
          },
        });
      }
      const current = await tx.estateDevelopment.findUnique({
        where: { id, tenantId: tenant.id },
      });
      if (!current) throw new ActionError("Obra no encontrada");
      await tx.estateDevelopmentField.deleteMany({
        where: { developmentId: id },
      });
      await tx.estateDevelopmentImage.deleteMany({
        where: {
          developmentId: id,
          id: { notIn: existingImages.map((image) => image.id) },
        },
      });
      for (const image of existingImages) {
        await tx.estateDevelopmentImage.updateMany({
          where: { id: image.id, developmentId: id },
          data: { order: image.order },
        });
      }
      return tx.estateDevelopment.update({
        where: { id, tenantId: tenant.id },
        data: {
          ...data,
          fields: {
            create: fields.map((field, order) => ({
              ...field,
              options: field.type === "SELECT" ? field.options : [],
              order,
            })),
          },
          images: { create: uploaded },
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/arquitectura/obras", "layout");
    await logActivity(tenant.id, {
      entity: "emprendimientos",
      entityId: development.id,
      action: id ? "UPDATE" : "CREATE",
      summary: `${id ? "Editó" : "Creó"} la obra «${parsed.name}»`,
    });
    revalidatePath("/admin/gestion/emprendimientos");
    return { id: development.id };
  } catch (error) {
    return toUserError(error, "No se pudo guardar la obra");
  }
}

export async function deleteDevelopment(id: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const deleted = await prisma.estateDevelopment.delete({
      where: { id, tenantId: tenant.id },
    });
    await logActivity(tenant.id, { entity: "emprendimientos", entityId: id, action: "DELETE", summary: `Eliminó la obra «${deleted.name}»` });
    revalidatePath("/");
    revalidatePath("/arquitectura/obras", "layout");
    revalidatePath("/admin/gestion/emprendimientos");
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo eliminar la obra");
  }
}

export async function uploadDevelopmentTextImage(formData: FormData) {
  try {
    await requireTenantAdmin();
    const file = formData.get("file");
    if (
      !(file instanceof File) ||
      !file.size ||
      !file.type.startsWith("image/")
    )
      throw new ActionError("Elegí una imagen válida");
    return await saveUploadedFile(file, "content");
  } catch (error) {
    return toUserError(error, "No se pudo subir la imagen");
  }
}

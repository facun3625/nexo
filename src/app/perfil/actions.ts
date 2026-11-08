"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ActionError, toUserError } from "@/lib/action-error";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

const profileSchema = z.object({
  name: z.string().min(1, "Ingresá tu nombre"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function updateProfile(formData: FormData) {
  try {
    return await runUpdateProfile(formData);
  } catch (err) {
    return toUserError(err, "No se pudo guardar tu perfil");
  }
}

async function runUpdateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new ActionError("No autorizado");

  const parsed = profileSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
  });

  let image: string | undefined;
  const file = formData.get("photo") as File | null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) throw new ActionError("La foto debe ser una imagen");
    image = await saveUploadedFile(file, "avatars");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.name.trim(),
      phone: parsed.phone?.trim() || null,
      address: parsed.address?.trim() || null,
      ...(image ? { image } : {}),
    },
  });

  revalidatePath("/perfil");

  return { ok: true as const, image: image ?? null };
}

import { ActionError } from "@/lib/action-error";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, saveFaviconWithRoundedCorners } from "@/lib/storage";

export async function saveTextSetting(tenantId: string, value: string | undefined, key: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    await prisma.settings.deleteMany({ where: { tenantId, key } });
    return;
  }
  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value: trimmed },
    create: { tenantId, key, value: trimmed },
  });
}

export async function saveImageSetting(tenantId: string, file: File | null, key: string) {
  if (!file || file.size === 0) return;
  if (!file.type.startsWith("image/")) {
    throw new ActionError("El archivo debe ser una imagen");
  }
  const url = await saveUploadedFile(file, "branding");
  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value: url },
    create: { tenantId, key, value: url },
  });
}

export async function saveFaviconSetting(tenantId: string, file: File | null, key: string) {
  if (!file || file.size === 0) return;
  if (!file.type.startsWith("image/")) {
    throw new ActionError("El archivo debe ser una imagen");
  }
  const url = await saveFaviconWithRoundedCorners(file, "branding");
  await prisma.settings.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value: url },
    create: { tenantId, key, value: url },
  });
}

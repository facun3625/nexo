"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { CONTENT_DEFAULTS, getAllContent } from "@/lib/content";
import { createAuditLog } from "@/lib/audit";
import ContenidoClient from "./ContenidoClient";

async function saveBlock(key: string, value: string) {
  "use server";
  await prisma.contentBlock.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      label: CONTENT_DEFAULTS[key]?.label ?? key,
      page: CONTENT_DEFAULTS[key]?.page ?? "otro",
      multiline: CONTENT_DEFAULTS[key]?.multiline ?? false,
    },
  });
  await createAuditLog("UPDATE", "ContentBlock", key, { value });
  revalidatePath("/");
  revalidatePath("/nosotros");
  revalidatePath("/tasacion");
  revalidatePath("/propiedades");
  revalidatePath("/mapa");
  revalidatePath("/favoritos");
}

export default async function ContenidoPage() {
  const saved = await getAllContent();

  // Merge defaults con lo guardado en DB
  const blocks = Object.entries(CONTENT_DEFAULTS).map(([key, def]) => ({
    key,
    label: def.label,
    page: def.page,
    multiline: def.multiline,
    value: saved[key] ?? def.value,
  }));

  return <ContenidoClient blocks={blocks} saveBlock={saveBlock} />;
}

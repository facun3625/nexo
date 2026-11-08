"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";

const schema = z.object({
  status: z.enum([
    "NEW",
    "IN_PROGRESS",
    "QUOTED",
    "RESPONDED",
    "ACCEPTED",
    "REJECTED",
    "CLOSED",
  ]),
  internalNotes: z.string().trim().max(10000),
});

export async function updateDevelopmentInquiry(id: string, formData: FormData) {
  const { tenant } = await requireTenantAdmin();
  const parsed = schema.parse({
    status: formData.get("status"),
    internalNotes: String(formData.get("internalNotes") ?? ""),
  });
  await prisma.$transaction(async (tx) => {
    const inquiry = await tx.estateDevelopmentInquiry.update({
      where: { id, tenantId: tenant.id },
      data: {
        status: parsed.status,
        internalNotes: parsed.internalNotes || null,
      },
    });
    await tx.estateDevelopmentInquiryEvent.create({
      data: {
        inquiryId: inquiry.id,
        status: inquiry.status,
        notes: inquiry.internalNotes,
      },
    });
  });
  revalidatePath("/admin/gestion/consultas-emprendimientos");
  revalidatePath(`/admin/gestion/consultas-emprendimientos/${id}`);
  revalidatePath("/admin", "layout");
}

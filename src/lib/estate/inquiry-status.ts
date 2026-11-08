import type { Prisma } from "@/generated/prisma/client";

// Estados de una consulta inmobiliaria, en el orden en que avanza:
// entra (NEW) → alguien la abre (READ) → alguien se comunica (CONTACTED) →
// calificada / cerrada.
export const INQUIRY_STATUSES = ["NEW", "READ", "CONTACTED", "QUALIFIED", "CLOSED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

type Actor = { id?: string | null; name?: string | null; email?: string | null };

export function actorName(user: Actor | null | undefined) {
  return user?.name?.trim() || user?.email?.trim() || "Usuario del panel";
}

// Registra quién cambió el estado. No hace nada si el estado no cambió, así
// guardar la ficha sin tocar el estado no ensucia el historial.
export async function logInquiryStatusChange(
  db: Prisma.TransactionClient,
  inquiryId: string,
  previous: string | null,
  next: string,
  user: Actor | null | undefined,
) {
  if (previous === next) return;
  await db.estateInquiryStatusChange.create({
    data: {
      inquiryId,
      status: next,
      changedById: user?.id ?? null,
      changedByName: actorName(user),
    },
  });
}

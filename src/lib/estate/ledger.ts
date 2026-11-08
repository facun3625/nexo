import { Prisma } from "@/generated/prisma/client";
import { argentinaDayStart } from "./modules";
import { amount } from "./validation";
import { ActionError } from "@/lib/action-error";
export type ReceiptInput = {
  chargeId: string;
  amount: string;
  method: "TRANSFER" | "CASH";
  reference: string;
  idempotencyKey: string;
  paidAt: Date;
};
// Caller must use a Serializable transaction to protect the outstanding balance.
export async function receiveEstatePayment(
  tx: Prisma.TransactionClient,
  tenantId: string,
  actorId: string,
  data: ReceiptInput,
) {
  amount.parse(data.amount);
  const duplicate = await tx.estateReceipt.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (duplicate) {
    if (
      duplicate.tenantId !== tenantId ||
      duplicate.chargeId !== data.chargeId ||
      !duplicate.amount.equals(data.amount) ||
      duplicate.reference !== data.reference ||
      duplicate.method !== data.method ||
      duplicate.paidAt.getTime() !== data.paidAt.getTime()
    )
      throw new ActionError("El identificador de cobro ya fue utilizado");
    return;
  }
  const charge = await tx.estateCharge.findFirst({
    where: { id: data.chargeId, tenantId: tenantId },
    include: { receipts: true },
  });
  if (!charge || charge.cancelled)
    throw new ActionError("Obligación no disponible");
  const paid = charge.receipts.reduce(
    (sum, r) => sum.plus(r.amount),
    new Prisma.Decimal(0),
  );
  if (new Prisma.Decimal(data.amount).greaterThan(charge.amount.minus(paid)))
    throw new ActionError("El cobro supera el saldo pendiente");
  if (data.paidAt >= new Date(argentinaDayStart().getTime() + 86400000))
    throw new ActionError("La fecha del cobro no puede estar en el futuro");
  const receipt = await tx.estateReceipt.create({
    data: { ...data, tenantId: tenantId },
  });
  await tx.estateAuditEvent.create({
    data: {
      tenantId: tenantId,
      actorId: actorId,
      actorName: (await tx.user.findUnique({ where: { id: actorId }, select: { name: true, email: true } }))?.name ?? "",
      entity: "cobranzas",
      entityId: receipt.id,
      action: "CONFIRM_MANUAL_PAYMENT",
      summary: `Registró un cobro de ${receipt.amount.toString()}`,
    },
  });
}

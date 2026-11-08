import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendMail } from "@/lib/mailer";
import { getStoreSettings } from "@/lib/settings";
import { paymentReminderEmail } from "@/lib/email-templates";
import { money, dateLabel } from "@/lib/estate/modules";
import {
  currentPeriod,
  periodDueDate,
  latestUpdateBoundary,
  computeLateFee,
  computePercentUpdate,
} from "@/lib/estate/billing-automation";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3010";
const REMINDER_DAYS_BEFORE = 3;

// Ciclo de automatización de Contratos (Etapa 6), factorizado para poder
// correrlo de dos formas: el cron diario de /api/cron/estate-billing (sobre
// todas las tiendas) y el botón "Generar cargos de este mes" del panel (un
// solo tenantId) — mismo cálculo, mismo criterio de idempotencia, para que
// tocar el botón no produzca nada distinto de lo que haría el cron esa
// noche.
//
// Diseño: generar una cuota o un punitorio es una acción de bajo riesgo y
// reversible (ya existe "Anular obligación" en Cobranzas para una emitida
// sin cobros) — eso se aplica directo. Cambiar el monto del alquiler por una
// actualización es la acción de mayor impacto y más difícil de deshacer, así
// que esa queda en "modo revisión": el cron calcula y deja una
// EstateBillingSuggestion pendiente de aprobar a mano (ver
// approveBillingSuggestion/dismissBillingSuggestion en gestion/actions.ts).
export async function runEstateBillingCycle(contractWhere: Prisma.EstateContractWhereInput) {
  const today = new Date();
  const period = currentPeriod(today);

  const contracts = await prisma.estateContract.findMany({
    where: contractWhere,
    include: {
      contact: { include: { portalUser: { select: { email: true } } } },
    },
  });

  let chargesGenerated = 0;
  let lateFeesGenerated = 0;
  let updateSuggestions = 0;
  let extraChargeSuggestions = 0;
  let remindersSent = 0;
  let indexPending = 0;

  for (const contract of contracts) {
    // 6.1 — generación de cuotas. Idempotente por el índice único
    // (contractId, period, concept): correr esto dos veces el mismo día (o
    // reintentar tras un timeout) no duplica nada.
    if (contract.dueDay && contract.firstChargePeriod && period >= contract.firstChargePeriod) {
      try {
        await prisma.estateCharge.create({
          data: {
            tenantId: contract.tenantId,
            contractId: contract.id,
            concept: "Alquiler",
            period,
            dueAt: periodDueDate(period, contract.dueDay),
            amount: contract.amount,
            currency: contract.currency,
          },
        });
        chargesGenerated++;
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    // 6.2 — punitorios. Solo MONTHLY/ONCE se aplican solos acá; DAILY queda
    // afuera a propósito (ver Etapa 6.2 del plan: acumular un monto que
    // crece día a día no encaja con "un cargo = un monto fijo" tal como está
    // modelado hoy).
    if (contract.lateFeeEnabled && contract.lateFeeFrequency && contract.lateFeeFrequency !== "DAILY") {
      const rentCharge = await prisma.estateCharge.findUnique({
        where: { contractId_period_concept: { contractId: contract.id, period, concept: "Alquiler" } },
        include: { receipts: true },
      });
      if (rentCharge && !rentCharge.cancelled) {
        const paid = rentCharge.receipts.reduce((n, r) => n.plus(r.amount), new Prisma.Decimal(0));
        const balance = rentCharge.amount.minus(paid);
        const graceCutoff = new Date(
          rentCharge.dueAt.getTime() + (contract.graceDays ?? 0) * 24 * 3600 * 1000,
        );
        if (balance.greaterThan(0) && today > graceCutoff) {
          const feeAmount = computeLateFee(
            balance,
            contract.lateFeeType,
            contract.lateFeeValue ?? new Prisma.Decimal(0),
            contract.lateFeeCap,
          );
          if (feeAmount.greaterThan(0)) {
            try {
              await prisma.estateCharge.create({
                data: {
                  tenantId: contract.tenantId,
                  contractId: contract.id,
                  concept: "Punitorios",
                  period,
                  dueAt: rentCharge.dueAt,
                  amount: feeAmount,
                  currency: contract.currency,
                },
              });
              lateFeesGenerated++;
            } catch (error) {
              if (!isUniqueConstraintError(error)) throw error;
            }
          }
        }
      }
    }

    // 6.3 — actualización del alquiler. Nunca cambia `amount` solo: siempre
    // queda como sugerencia pendiente de aprobar (ver comentario de arriba).
    if (contract.updateType !== "NONE" && contract.firstUpdateAt) {
      const boundary = latestUpdateBoundary(contract.firstUpdateAt, contract.updateFrequency, today);
      if (boundary) {
        const payload =
          contract.updateType === "FIXED_PERCENT" && contract.updatePercent
            ? {
                newAmount: computePercentUpdate(
                  contract.amount,
                  contract.updatePercent,
                  contract.updateRounding,
                ).toString(),
                oldAmount: contract.amount.toString(),
                percent: contract.updatePercent.toString(),
              }
            : contract.updateType === "IPC" || contract.updateType === "ICL"
              ? await (async () => {
                  const indexValue = await prisma.estateRentIndexValue.findUnique({
                    where: {
                      tenantId_index_period: {
                        tenantId: contract.tenantId,
                        index: contract.updateType,
                        period: boundary.period,
                      },
                    },
                  });
                  if (!indexValue) {
                    indexPending++;
                    return null;
                  }
                  return {
                    newAmount: computePercentUpdate(
                      contract.amount,
                      indexValue.percent,
                      contract.updateRounding,
                    ).toString(),
                    oldAmount: contract.amount.toString(),
                    percent: indexValue.percent.toString(),
                    index: contract.updateType,
                  };
                })()
              : // STEPPED / MANUAL / OTHER_INDEX: no hay forma de calcular el
                // monto solo — se deja la sugerencia igual, sin newAmount, como
                // recordatorio de que corresponde revisar.
                { note: "Corresponde actualizar — revisar manualmente." };

        if (payload) {
          try {
            await prisma.estateBillingSuggestion.create({
              data: {
                tenantId: contract.tenantId,
                contractId: contract.id,
                kind: "RENT_UPDATE",
                period: boundary.period,
                payload,
              },
            });
            updateSuggestions++;
          } catch (error) {
            if (!isUniqueConstraintError(error)) throw error;
          }
        }
      }
    }

    // 6.4 — gastos recurrentes (expensas, ABL, tasas). El conjunto que
    // corresponde puede cambiar mes a mes, así que nunca se generan solos
    // como el alquiler: se junta el catálogo de conceptos activos del
    // contrato en una única sugerencia por período, para revisar a mano
    // (ver approveBillingSuggestion, kind EXTRA_CHARGES).
    const concepts = await prisma.estateContractChargeConcept.findMany({
      where: { contractId: contract.id, active: true },
    });
    if (concepts.length > 0) {
      try {
        await prisma.estateBillingSuggestion.create({
          data: {
            tenantId: contract.tenantId,
            contractId: contract.id,
            kind: "EXTRA_CHARGES",
            period,
            payload: {
              items: concepts.map((c) => ({
                conceptId: c.id,
                concept: c.name,
                amount: c.lastAmount?.toString() ?? "",
                currency: c.lastCurrency ?? contract.currency,
              })),
            },
          },
        });
        extraChargeSuggestions++;
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;
      }
    }

    // 6.5 — recordatorio de vencimiento (Etapa 4 del portal). Solo a
    // contratos con un inquilino que ya tiene cuenta en /mi-alquiler — sin
    // eso no hay nada que mostrarle si hace click. reminderSentAt evita
    // reenviar el mismo mail cada día hasta que se pague.
    const portalEmail = contract.contact.portalUser?.email;
    if (portalEmail) {
      const upcoming = await prisma.estateCharge.findMany({
        where: {
          contractId: contract.id,
          cancelled: false,
          reminderSentAt: null,
          dueAt: {
            gte: today,
            lte: new Date(today.getTime() + REMINDER_DAYS_BEFORE * 24 * 3600 * 1000),
          },
        },
        include: { receipts: true },
      });
      for (const charge of upcoming) {
        const paid = charge.receipts.reduce((n, r) => n.plus(r.amount), new Prisma.Decimal(0));
        if (charge.amount.minus(paid).lessThanOrEqualTo(0)) continue;
        try {
          const storeSettings = await getStoreSettings(contract.tenantId);
          await sendMail({
            tenantId: contract.tenantId,
            to: portalEmail,
            subject: `Vence pronto: ${charge.concept} de ${contract.reference}`,
            html: paymentReminderEmail({
              storeName: storeSettings.storeName,
              contractReference: contract.reference,
              concept: charge.concept,
              amountLabel: money(charge.amount, charge.currency),
              dueDateLabel: dateLabel(charge.dueAt),
              portalUrl: `${ROOT_DOMAIN.startsWith("localhost") ? "http" : "https"}://${ROOT_DOMAIN}/mi-alquiler`,
            }),
            type: "PAYMENT_REMINDER",
          });
          await prisma.estateCharge.update({
            where: { id: charge.id },
            data: { reminderSentAt: new Date() },
          });
          remindersSent++;
        } catch (error) {
          console.error("No se pudo mandar el recordatorio de vencimiento", error);
        }
      }
    }
  }

  return {
    ok: true as const,
    period,
    contractsChecked: contracts.length,
    chargesGenerated,
    lateFeesGenerated,
    updateSuggestions,
    extraChargeSuggestions,
    remindersSent,
    indexPending,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

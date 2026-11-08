"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { saveUploadedFile } from "@/lib/storage";
import { FLOOR_PLAN_TYPES, MAX_FLOOR_PLAN_SIZE } from "@/lib/estate/property-features";
import { receiveEstatePayment } from "@/lib/estate/ledger";
import { periodDueDate } from "@/lib/estate/billing-automation";
import { runEstateBillingCycle } from "@/lib/estate/billing-cron";
import { agentPermissionsFromForm } from "@/lib/agent-permissions";
import { modules } from "@/lib/estate/modules";
import { INQUIRY_STATUSES, logInquiryStatusChange } from "@/lib/estate/inquiry-status";
import { logActivity } from "@/lib/activity-log";
import {
  agentSchema,
  amount,
  chargeSchema,
  contactSchema,
  contractSchema,
  day,
  notes,
  optionalAmount,
  optionalId,
  propertySchema,
  requiredText,
  visitSchema,
} from "@/lib/estate/validation";

type Tx = Prisma.TransactionClient;
async function verifyRelations(
  tx: Tx,
  tenantId: string,
  data: {
    propertyId?: string | null;
    contactId?: string | null;
    ownerId?: string | null;
    developmentId?: string | null;
    contractId?: string | null;
  },
) {
  if (
    data.propertyId &&
    !(await tx.estateProperty.findUnique({
      where: { id_tenantId: { id: data.propertyId, tenantId } },
    }))
  )
    throw new ActionError("Propiedad no encontrada");
  for (const id of [data.contactId, data.ownerId])
    if (
      id &&
      !(await tx.estateContact.findFirst({
        where: { id, tenantId, archived: false },
      }))
    )
      throw new ActionError("Contacto no encontrado");
  if (
    data.developmentId &&
    !(await tx.estateDevelopment.findUnique({
      where: { id_tenantId: { id: data.developmentId, tenantId } },
    }))
  )
    throw new ActionError("Obra no encontrada");
  if (
    data.contractId &&
    !(await tx.estateContract.findUnique({
      where: { id_tenantId: { id: data.contractId, tenantId } },
    }))
  )
    throw new ActionError("Contrato no encontrado");
}
function refreshEstate() {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

// Abrir la ficha la pasa de "Ingresada" a "Leída" y registra quién la
// abrió — se llama desde MarkSeenOnMount, que solo se dispara cuando el
// componente realmente monta en el navegador (nunca durante el prefetch de
// un <Link>, que ejecutaría esto con solo pasar el mouse cerca si viviera en
// el render de la página).
export async function markEstateInquirySeen(id: string) {
  const { tenant, session } = await requireTenantAdmin();
  const changed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.estateInquiry.updateMany({
      where: { id, tenantId: tenant.id, status: "NEW" },
      data: { status: "READ" },
    });
    if (count > 0) await logInquiryStatusChange(tx, id, "NEW", "READ", session.user);
    return count > 0;
  });
  if (changed) refreshEstate();
}

// Cambio rápido de estado desde la ficha, sin tener que guardar todo el
// formulario.
export async function setEstateInquiryStatus(id: string, status: string) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    const next = z.enum(INQUIRY_STATUSES).parse(status);
    await prisma.$transaction(async (tx) => {
      const inquiry = await tx.estateInquiry.findFirst({
        where: { id, tenantId: tenant.id },
        select: { status: true },
      });
      if (!inquiry) throw new ActionError("Consulta no encontrada");
      if (inquiry.status === next) return;
      await tx.estateInquiry.update({ where: { id }, data: { status: next } });
      await logInquiryStatusChange(tx, id, inquiry.status, next, session.user);
    });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo cambiar el estado");
  }
}

export async function deleteEstateInquiry(id: string) {
  try {
    const { tenant, session } = await requireTenantAdmin();
    const inquiry = await prisma.estateInquiry.findFirst({
      where: { id, tenantId: tenant.id },
      select: { contact: { select: { name: true } } },
    });
    const { count } = await prisma.estateInquiry.deleteMany({
      where: { id, tenantId: tenant.id },
    });
    if (count === 0) throw new ActionError("Consulta no encontrada");
    await logActivity(
      tenant.id,
      { entity: "consultas", entityId: id, action: "DELETE", summary: `Eliminó la consulta de «${inquiry?.contact.name ?? "—"}»` },
      { user: session.user },
    );
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return toUserError(error, "No se pudo eliminar la consulta");
  }
}
function actionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return {
        error: "Ya existe un registro con esa referencia, código o período.",
      };
    if (error.code === "P2025")
      return { error: "Registro no encontrado en esta inmobiliaria." };
    if (error.code === "P2034")
      return { error: "Otro usuario modificó estos datos. Volvé a intentar." };
  }
  return toUserError(
    error,
    "No se pudo guardar. Revisá los datos e intentá nuevamente.",
  );
}
export async function saveEstateRecord(
  module: string,
  id: string | null,
  form: FormData,
) {
  const { tenant, session } = await requireTenantAdmin();
  try {
    if (!Object.hasOwn(modules, module))
      throw new ActionError("Sección inválida");
    if (module === "agentes" && session.user.role !== "ADMIN")
      throw new ActionError("Sólo un administrador puede gestionar agentes");
    const raw = Object.fromEntries(form.entries());
    const files = form
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (
      files.length > 10 ||
      files.reduce((n, f) => n + f.size, 0) > 18 * 1024 * 1024 ||
      files.some(
        (f) =>
          f.size > 8 * 1024 * 1024 ||
          !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    )
      throw new ActionError(
        "Subí hasta 10 imágenes JPG, PNG o WEBP, de hasta 8 MB cada una y 18 MB en total.",
      );
    const uploads: string[] = [];
    let floorPlanUrl: string | null | undefined;
    const floorPlan = form.get("floorPlan");
    // Validate the property and ownership before writing files to disk.
    if (module === "propiedades") {
      propertySchema.parse({
        ...raw,
        published: form.has("published"),
        featured: form.has("featured"),
        saleShowPrice: form.has("saleShowPrice"),
        rentShowPrice: form.has("rentShowPrice"),
      });
      if (
        id &&
        !(await prisma.estateProperty.findFirst({
          where: { id, tenantId: tenant.id },
        }))
      )
        throw new ActionError("Propiedad no encontrada");
      if (floorPlan instanceof File && floorPlan.size > 0) {
        if (floorPlan.size > MAX_FLOOR_PLAN_SIZE || !FLOOR_PLAN_TYPES.some((type) => type === floorPlan.type))
          throw new ActionError("El plano debe ser JPG, PNG, WEBP o PDF de hasta 8 MB.");
        if (files.reduce((total, file) => total + file.size, floorPlan.size) > 18 * 1024 * 1024)
          throw new ActionError("Las fotos y el plano no pueden superar 18 MB por envío.");
        floorPlanUrl = await saveUploadedFile(floorPlan, `${tenant.id}/properties/plans`);
      } else if (form.has("removeFloorPlan")) {
        floorPlanUrl = null;
      }
      for (const file of files)
        uploads.push(await saveUploadedFile(file, `${tenant.id}/properties`));
    }
    const savedId = await prisma.$transaction(
      async (tx) => {
        const tenantId = tenant.id;
        const where = { id: id ?? "", tenantId };
        let record: { id: string };
        switch (module) {
          case "operaciones": {
            const data = z
              .object({
                propertyId: requiredText,
                contactId: requiredText,
                operation: z.enum(["SALE", "RENT"]),
                stage: z.enum(["NEGOTIATION", "RESERVED", "WON", "LOST"]),
                amount: optionalAmount,
                currency: z.enum(["ARS", "USD"]),
                agentName: requiredText,
                notes,
              })
              .parse(raw);
            await verifyRelations(tx, tenantId, data);
            const old = id
              ? await tx.estateDeal.findFirstOrThrow({ where })
              : null;
            if (
              old &&
              (old.propertyId !== data.propertyId ||
                old.operation !== data.operation)
            )
              throw new ActionError(
                "Creá una nueva operación para cambiar de inmueble o modalidad.",
              );
            if (old?.stage === "WON" && data.stage !== "WON")
              throw new ActionError(
                "Una operación concretada no se reabre desde este formulario.",
              );
            if (data.stage === "WON" && !data.amount)
              throw new ActionError(
                "Ingresá el importe final para concretar la operación.",
              );
            if (["RESERVED", "WON"].includes(data.stage)) {
              if (
                await tx.estateDeal.count({
                  where: {
                    tenantId,
                    propertyId: data.propertyId,
                    operation: data.operation,
                    id: { not: id ?? "" },
                    stage: { in: ["RESERVED", "WON"] },
                  },
                })
              )
                throw new ActionError(
                  "Ya existe una reserva o cierre para esa oferta.",
                );
              const listing = await tx.estateListing.findFirst({
                where: {
                  tenantId,
                  propertyId: data.propertyId,
                  operation: data.operation,
                },
              });
              if (!listing)
                throw new ActionError(
                  "La propiedad no tiene esa oferta de venta o alquiler.",
                );
              await tx.estateListing.updateMany({
                where: {
                  tenantId,
                  propertyId: data.propertyId,
                  operation: data.operation,
                },
                data: {
                  status:
                    data.stage === "RESERVED"
                      ? "RESERVED"
                      : data.operation === "SALE"
                        ? "SOLD"
                        : "RENTED",
                },
              });
            } else if (old?.stage === "RESERVED") {
              await tx.estateListing.updateMany({
                where: {
                  tenantId,
                  propertyId: data.propertyId,
                  operation: data.operation,
                  status: "RESERVED",
                },
                data: { status: "AVAILABLE" },
              });
            }
            record = id
              ? await tx.estateDeal.update({ where, data })
              : await tx.estateDeal.create({ data: { ...data, tenantId } });
            break;
          }
          case "tasaciones": {
            const data = z
              .object({
                contactId: requiredText,
                address: requiredText,
                propertyType: requiredText,
                status: z.enum(["NEW", "CONTACTED", "COMPLETED", "CANCELLED"]),
                amount: optionalAmount,
                currency: z.enum(["ARS", "USD"]),
                notes,
              })
              .parse(raw);
            await verifyRelations(tx, tenantId, data);
            record = id
              ? await tx.estateValuation.update({ where, data })
              : await tx.estateValuation.create({
                  data: { ...data, tenantId },
                });
            break;
          }
          case "clientes": {
            const data = contactSchema.parse({
              ...raw,
              roles: form.getAll("roles"),
            });
            record = id
              ? await tx.estateContact.update({ where, data })
              : await tx.estateContact.create({ data: { ...data, tenantId } });
            break;
          }
          case "agentes": {
            const data = agentSchema.parse(raw);
            if (id) {
              record = await tx.estateAgent.update({ where, data });
              break;
            }

            const accessEnabled = form.has("accessEnabled");
          const permissions = agentPermissionsFromForm(form);
            if (!accessEnabled) {
              record = await tx.estateAgent.create({ data: { ...data, tenantId, permissions } });
              break;
            }

            const loginEmail = z.email("Ingresá un usuario válido (email)").max(254).parse(
              String(form.get("loginEmail") ?? "").trim().toLowerCase(),
            );
            const password = z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(72, "La contraseña puede tener hasta 72 caracteres").parse(
              String(form.get("loginPassword") ?? ""),
            );
            const existing = await tx.user.findUnique({
              where: { tenantId_email: { tenantId, email: loginEmail } },
            });
            if (existing) throw new ActionError("Ese usuario ya pertenece a otra cuenta de esta inmobiliaria");
            const user = await tx.user.create({
              data: {
                tenantId,
                name: data.name,
                email: loginEmail,
                passwordHash: await bcrypt.hash(password, 12),
                role: "AGENT",
              },
            });
            record = await tx.estateAgent.create({
              data: { ...data, tenantId, userId: user.id, accessEnabled: true, permissions },
            });
            break;
          }
          case "propiedades": {
            const parsed = propertySchema.parse({
              ...raw,
              published: form.has("published"),
              featured: form.has("featured"),
              saleShowPrice: form.has("saleShowPrice"),
              rentShowPrice: form.has("rentShowPrice"),
            });
            const {
              offerType,
              salePrice,
              saleCurrency,
              saleWhatsapp,
              saleShowPrice,
              rentPrice,
              rentCurrency,
              rentWhatsapp,
              rentShowPrice,
              ...data
            } = parsed;
            const saleEnabled = offerType === "SALE" || offerType === "BOTH";
            const rentEnabled =
              offerType === "RENT" || offerType === "RENT_TEMP" || offerType === "BOTH";
            const temporary = offerType === "RENT_TEMP";
            await verifyRelations(tx, tenantId, data);
            record = id
              ? await tx.estateProperty.update({ where, data: { ...data, floorPlanUrl } })
              : await tx.estateProperty.create({ data: { ...data, floorPlanUrl, tenantId } });
            for (const [operation, enabled, price, currency, isTemporary, whatsapp, showPrice] of [
              ["SALE", saleEnabled, salePrice, saleCurrency, false, saleWhatsapp, saleShowPrice],
              ["RENT", rentEnabled, rentPrice, rentCurrency, temporary, rentWhatsapp, rentShowPrice],
            ] as const) {
              if (enabled)
                await tx.estateListing.upsert({
                  where: {
                    propertyId_operation: { propertyId: record.id, operation },
                  },
                  create: {
                    tenantId,
                    propertyId: record.id,
                    operation,
                    price,
                    currency,
                    temporary: isTemporary,
                    whatsapp,
                    showPrice,
                  },
                  update: { price, currency, temporary: isTemporary, whatsapp, showPrice },
                });
              else {
                if (
                  await tx.estateDeal.count({
                    where: {
                      tenantId,
                      propertyId: record.id,
                      operation,
                      stage: { in: ["RESERVED", "WON"] },
                    },
                  })
                )
                  throw new ActionError(
                    "No se puede retirar una oferta con una reserva o cierre registrado.",
                  );
                await tx.estateListing.deleteMany({
                  where: { tenantId, propertyId: record.id, operation },
                });
              }
            }
            const last = await tx.estateMedia.aggregate({
              where: { tenantId, propertyId: record.id },
              _max: { position: true },
            });
            await tx.estateMedia.createMany({
              data: uploads.map((url, i) => ({
                tenantId,
                propertyId: record.id,
                url,
                position: (last._max.position ?? -1) + 1 + i,
              })),
            });
            break;
          }
          case "consultas": {
            const data = z
              .object({
                assignedAgentId: optionalId,
                contactId: requiredText,
                propertyId: optionalId,
                message: notes.refine(Boolean, "Ingresá la consulta"),
                status: z.enum(INQUIRY_STATUSES),
                notes,
              })
              .parse(raw);
            await verifyRelations(tx, tenantId, data);
            if (data.assignedAgentId && !(await tx.estateAgent.findFirst({ where: { id: data.assignedAgentId, tenantId } })))
              throw new ActionError("Agente no encontrado en esta inmobiliaria");
            const previous = id
              ? await tx.estateInquiry.findFirst({ where, select: { status: true } })
              : null;
            record = id
              ? await tx.estateInquiry.update({ where, data })
              : await tx.estateInquiry.create({ data: { ...data, tenantId } });
            await logInquiryStatusChange(tx, record.id, previous?.status ?? null, data.status, session.user);
            break;
          }
          case "visitas": {
            const data = visitSchema.parse(raw);
            await verifyRelations(tx, tenantId, data);
            if (
              ["SCHEDULED", "CONFIRMED"].includes(data.status) &&
              (await tx.estateVisit.count({
                where: {
                  tenantId,
                  id: { not: id ?? "" },
                  status: { in: ["SCHEDULED", "CONFIRMED"] },
                  startsAt: { lt: data.endsAt },
                  endsAt: { gt: data.startsAt },
                  OR: [
                    { propertyId: data.propertyId },
                    {
                      agentName: {
                        equals: data.agentName,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              }))
            )
              throw new ActionError(
                "El inmueble o agente ya tiene una visita en ese horario.",
              );
            record = id
              ? await tx.estateVisit.update({ where, data })
              : await tx.estateVisit.create({ data: { ...data, tenantId } });
            break;
          }
          case "contratos": {
            const data = contractSchema.parse(raw);
            await verifyRelations(tx, tenantId, data);
            if (
              id &&
              (await tx.estateCharge.count({
                where: { tenantId, contractId: id },
              }))
            ) {
              const old = await tx.estateContract.findFirstOrThrow({ where });
              if (
                old.currency !== data.currency ||
                old.contactId !== data.contactId ||
                old.propertyId !== data.propertyId
              )
                throw new ActionError(
                  "Un contrato con obligaciones no puede cambiar de moneda, inmueble o inquilino.",
                );
            }
            if (
              data.status === "ACTIVE" &&
              (await tx.estateContract.count({
                where: {
                  tenantId,
                  id: { not: id ?? "" },
                  propertyId: data.propertyId,
                  status: "ACTIVE",
                  startsAt: { lte: data.endsAt },
                  endsAt: { gte: data.startsAt },
                },
              }))
            )
              throw new ActionError(
                "La propiedad ya tiene un contrato activo durante ese período.",
              );
            record = id
              ? await tx.estateContract.update({ where, data })
              : await tx.estateContract.create({ data: { ...data, tenantId } });
            break;
          }
          case "cobranzas": {
            if (id)
              throw new ActionError(
                "Las obligaciones emitidas no se editan. Anulá la obligación si no tiene cobros.",
              );
            const data = chargeSchema.parse(raw);
            await verifyRelations(tx, tenantId, data);
            const contract = await tx.estateContract.findFirstOrThrow({
              where: { id: data.contractId, tenantId },
            });
            if (contract.status !== "ACTIVE")
              throw new ActionError("El contrato debe estar activo");
            if (contract.currency !== data.currency)
              throw new ActionError(
                "La moneda debe coincidir con la del contrato",
              );
            record = await tx.estateCharge.create({
              data: { ...data, tenantId },
            });
            break;
          }
          case "emprendimientos": {
            const data = z
              .object({
                name: requiredText,
                address: requiredText,
                city: requiredText,
                stage: z.enum(["PROJECT", "CONSTRUCTION", "FINISHED"]),
                description: notes,
              })
              .parse(raw);
            record = id
              ? await tx.estateDevelopment.update({ where, data })
              : await tx.estateDevelopment.create({
                  data: { ...data, tenantId },
                });
            break;
          }
          default:
            throw new ActionError("Sección inválida");
        }
        const recordName = String(raw.title ?? raw.name ?? raw.address ?? "").trim();
        await logActivity(
          tenantId,
          {
            entity: module,
            entityId: record.id,
            action: id ? "UPDATE" : "CREATE",
            summary: `${id ? "Editó" : "Creó"} en ${modules[module as keyof typeof modules].title}${recordName ? `: «${recordName}»` : ""}`,
          },
          { db: tx, user: session.user },
        );
        return record.id;
      },
      { isolationLevel: "Serializable" },
    );
    refreshEstate();
    return { ok: true, id: savedId };
  } catch (error) {
    return actionError(error);
  }
}

// Toggle rápido desde el listado — a diferencia de saveEstateRecord (valida
// el registro entero, sube fotos, etc.) esto solo prende/apaga un booleano.
// Al destacar, se manda al final del orden manual de destacadas para que no
// aparezca de golpe primera sin que el admin lo haya elegido así.
export async function toggleEstatePropertyFeatured(id: string) {
  const { tenant, session } = await requireTenantAdmin();
  try {
    const property = await prisma.estateProperty.findUnique({
      where: { id_tenantId: { id, tenantId: tenant.id } },
      select: { featured: true, title: true },
    });
    if (!property) throw new ActionError("Propiedad no encontrada");

    if (property.featured) {
      await prisma.estateProperty.update({
        where: { id_tenantId: { id, tenantId: tenant.id } },
        data: { featured: false },
      });
    } else {
      const last = await prisma.estateProperty.findFirst({
        where: { tenantId: tenant.id, featured: true },
        orderBy: { featuredOrder: "desc" },
        select: { featuredOrder: true },
      });
      await prisma.estateProperty.update({
        where: { id_tenantId: { id, tenantId: tenant.id } },
        data: { featured: true, featuredOrder: (last?.featuredOrder ?? -1) + 1 },
      });
    }
    await logActivity(
      tenant.id,
      {
        entity: "propiedades",
        entityId: id,
        action: property.featured ? "UNFEATURE" : "FEATURE",
        summary: `${property.featured ? "Sacó de destacadas" : "Destacó"} «${property.title}»`,
      },
      { user: session.user },
    );
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderFeaturedEstateProperties(orderedIds: string[]) {
  const { tenant } = await requireTenantAdmin();
  try {
    await prisma.$transaction(
      orderedIds.map((id, i) =>
        prisma.estateProperty.update({
          where: { id_tenantId: { id, tenantId: tenant.id } },
          data: { featuredOrder: i },
        }),
      ),
    );
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteEstatePropertyImage(id: string) {
  const { tenant, session } = await requireTenantAdmin();
  try {
    const media = await prisma.estateMedia.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true, propertyId: true, property: { select: { title: true } } },
    });
    if (!media) throw new ActionError("Imagen no encontrada");
    await prisma.estateMedia.delete({ where: { id: media.id } });
    await logActivity(
      tenant.id,
      { entity: "propiedades", entityId: media.propertyId, action: "DELETE_IMAGE", summary: `Eliminó una foto de «${media.property.title}»` },
      { user: session.user },
    );
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function reorderEstatePropertyImages(
  propertyId: string,
  orderedIds: string[],
) {
  const { tenant } = await requireTenantAdmin();
  try {
    await prisma.$transaction(
      orderedIds.map((id, i) =>
        prisma.estateMedia.update({
          where: { id, tenantId: tenant.id, propertyId },
          data: { position: i },
        }),
      ),
    );
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function recordEstateReceipt(form: FormData) {
  const { tenant, session } = await requireTenantAdmin();
  try {
    const data = z
      .object({
        chargeId: requiredText,
        amount,
        method: z.enum(["TRANSFER", "CASH"]),
        reference: requiredText,
        idempotencyKey: z.uuid(),
        paidAt: day,
      })
      .parse(Object.fromEntries(form));
    await prisma.$transaction(
      async (tx) => {
        const charge = await tx.estateCharge.findFirst({
          where: { id: data.chargeId, tenantId: tenant.id, contractId: { not: null } },
          select: { id: true },
        });
        if (!charge) throw new ActionError("Obligación no disponible");
        await receiveEstatePayment(tx, tenant.id, session.user.id, data);
      },
      { isolationLevel: "Serializable" },
    );
    refreshEstate();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelEstateCharge(form: FormData) {
  const { tenant, session } = await requireTenantAdmin();
  try {
    const id = requiredText.parse(form.get("id"));
    await prisma.$transaction(
      async (tx) => {
        const charge = await tx.estateCharge.findFirst({
          where: { id, tenantId: tenant.id, contractId: { not: null } },
          include: { _count: { select: { receipts: true } } },
        });
        if (!charge || charge._count.receipts)
          throw new ActionError(
            "Solo se pueden anular obligaciones sin cobros",
          );
        await tx.estateCharge.update({
          where: { id, tenantId: tenant.id },
          data: { cancelled: true },
        });
        await logActivity(
          tenant.id,
          { entity: "cobranzas", entityId: id, action: "CANCEL", summary: "Anuló una obligación de cobro" },
          { db: tx, user: session.user },
        );
      },
      { isolationLevel: "Serializable" },
    );
    refreshEstate();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

// ---------- Documentos de contrato (Etapa 5) ----------
// Acciones inmediatas, independientes del submit grande de RecordForm —
// subir/borrar un documento no depende de tocar "Guardar cambios" en el
// resto del contrato (mismo criterio que borrar/reordenar fotos arriba).

const documentTypeSchema = z.enum(["SIGNED_CONTRACT", "INVENTORY", "DELIVERY_ACT", "OTHER"]);
const documentVisibilitySchema = z.enum(["AGENCY_ONLY", "TENANT", "OWNER", "BOTH_PARTIES"]);

export async function uploadContractDocument(form: FormData) {
  const { tenant } = await requireTenantAdmin();
  try {
    const contractId = requiredText.parse(form.get("contractId"));
    const title = requiredText.parse(form.get("title"));
    const type = documentTypeSchema.parse(form.get("type"));
    const visibility = documentVisibilitySchema.parse(form.get("visibility"));
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      throw new ActionError("Elegí un archivo para subir");
    if (file.size > 15 * 1024 * 1024)
      throw new ActionError("El archivo no puede superar los 15 MB");
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    const url = await saveUploadedFile(file, `${tenant.id}/contracts`);
    const created = await prisma.estateContractDocument.create({
      data: { tenantId: tenant.id, contractId, title, type, visibility, url },
    });
    refreshEstate();
    return {
      ok: true as const,
      document: {
        id: created.id,
        title: created.title,
        type: created.type,
        visibility: created.visibility,
        url: created.url,
        createdAt: created.createdAt,
      },
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteContractDocument(id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const doc = await prisma.estateContractDocument.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!doc) throw new ActionError("Documento no encontrado");
    await prisma.estateContractDocument.delete({ where: { id: doc.id } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateContractDocumentVisibility(id: string, visibility: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const parsed = documentVisibilitySchema.parse(visibility);
    const doc = await prisma.estateContractDocument.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!doc) throw new ActionError("Documento no encontrado");
    await prisma.estateContractDocument.update({
      where: { id: doc.id },
      data: { visibility: parsed },
    });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// ---------- Garantes del contrato ----------
// Varios-a-muchos, acciones inmediatas igual que los documentos — agregar o
// quitar un garante no depende del submit grande de RecordForm.

export async function addContractGuarantor(form: FormData) {
  const { tenant } = await requireTenantAdmin();
  try {
    const contractId = requiredText.parse(form.get("contractId"));
    const contactId = requiredText.parse(form.get("contactId"));
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    const contact = await prisma.estateContact.findFirst({
      where: { id: contactId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!contact) throw new ActionError("Contacto no encontrado");
    const created = await prisma.estateContractGuarantor.create({
      data: { tenantId: tenant.id, contractId, contactId },
    });
    refreshEstate();
    return { ok: true as const, id: created.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeContractGuarantor(id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const row = await prisma.estateContractGuarantor.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!row) throw new ActionError("Garante no encontrado");
    await prisma.estateContractGuarantor.delete({ where: { id: row.id } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// ---------- Conceptos recurrentes del contrato (expensas, ABL, tasas) ----------
// Cada concepto guarda el monto vigente (lastAmount/lastCurrency) — el mismo
// que se va a usar todos los meses hasta que se edite acá. "Cargar cobros de
// este mes" arma una sugerencia con ese monto ya cargado para revisar (ver
// approveBillingSuggestion, kind EXTRA_CHARGES): la mayoría de los meses el
// monto no cambió, así que revisar es solo confirmar; cuando sí cambia (ej.
// subieron las expensas) se edita acá antes de generar el cobro de ese mes.

export async function addContractChargeConcept(form: FormData) {
  const { tenant } = await requireTenantAdmin();
  try {
    const contractId = requiredText.parse(form.get("contractId"));
    const name = requiredText.parse(form.get("name"));
    const rawAmount = optionalAmount.parse(form.get("amount"));
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { id: true, currency: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    const created = await prisma.estateContractChargeConcept.create({
      data: {
        tenantId: tenant.id,
        contractId,
        name,
        lastAmount: rawAmount ?? undefined,
        lastCurrency: rawAmount ? contract.currency : undefined,
      },
    });
    refreshEstate();
    return { ok: true as const, id: created.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateContractChargeConceptAmount(id: string, rawAmount: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const parsedAmount = optionalAmount.parse(rawAmount);
    const row = await prisma.estateContractChargeConcept.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contract: { select: { currency: true } } },
    });
    if (!row) throw new ActionError("Concepto no encontrado");
    await prisma.estateContractChargeConcept.update({
      where: { id: row.id },
      data: {
        lastAmount: parsedAmount ?? null,
        lastCurrency: parsedAmount ? row.contract.currency : null,
      },
    });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function setContractChargeConceptActive(id: string, active: boolean) {
  const { tenant } = await requireTenantAdmin();
  try {
    const row = await prisma.estateContractChargeConcept.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!row) throw new ActionError("Concepto no encontrado");
    await prisma.estateContractChargeConcept.update({ where: { id: row.id }, data: { active } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeContractChargeConcept(id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const row = await prisma.estateContractChargeConcept.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!row) throw new ActionError("Concepto no encontrado");
    await prisma.estateContractChargeConcept.delete({ where: { id: row.id } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// ---------- Fotos de estado del inmueble al iniciar el alquiler (Etapa 7, opcional) ----------

export async function uploadContractHandoverPhoto(form: FormData) {
  const { tenant } = await requireTenantAdmin();
  try {
    const contractId = requiredText.parse(form.get("contractId"));
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0)
      throw new ActionError("Elegí una foto para subir");
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    const url = await saveUploadedFile(file, `${tenant.id}/contract-handovers`);
    const created = await prisma.estateContractHandoverPhoto.create({
      data: { tenantId: tenant.id, contractId, url },
    });
    refreshEstate();
    return { ok: true as const, photo: { id: created.id, url: created.url } };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteContractHandoverPhoto(id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const photo = await prisma.estateContractHandoverPhoto.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!photo) throw new ActionError("Foto no encontrada");
    await prisma.estateContractHandoverPhoto.delete({ where: { id: photo.id } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// El cron de /api/cron/estate-billing corre solo, una vez por día, sobre
// todas las tiendas — nada obliga a esperarlo para ver cómo queda el mes:
// este botón corre el mismo cálculo (runEstateBillingCycle) ahora mismo,
// acotado a UN contrato puntual (vive en su ficha, junto a "Gastos
// recurrentes"): cada contrato tiene sus propios conceptos y, mes a mes, sus
// propios montos, así que no tiene sentido tirarlos todos juntos desde la
// lista. Genera lo que corresponda (cuota de alquiler, punitorios) y deja las
// sugerencias de actualización/gastos recurrentes para revisar ahí mismo —
// no aprueba nada solo.
export async function generateBillingForContract(contractId: string) {
  try {
    const { tenant } = await requireTenantAdmin();
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { status: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    if (contract.status !== "ACTIVE") {
      throw new ActionError("Este contrato no está activo — no se generan cobros.");
    }
    const result = await runEstateBillingCycle({ id: contractId, tenantId: tenant.id });
    refreshEstate();
    return result;
  } catch (error) {
    return actionError(error);
  }
}

// ---------- Modo revisión de actualizaciones de alquiler (Etapa 6.5) ----------
// El cron de /api/cron/estate-billing deja acá lo que calculó; estas dos
// acciones son el único lugar donde el monto de un contrato cambia por una
// actualización automática — siempre con un click humano de por medio.

const extraChargeItemSchema = z.object({
  conceptId: requiredText,
  concept: requiredText,
  amount,
  currency: z.enum(["ARS", "USD"]),
  include: z.boolean(),
});

export async function approveBillingSuggestion(
  id: string,
  extraChargeItems?: z.infer<typeof extraChargeItemSchema>[],
) {
  const { tenant } = await requireTenantAdmin();
  try {
    const suggestion = await prisma.estateBillingSuggestion.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!suggestion) throw new ActionError("Sugerencia no encontrada");
    if (suggestion.kind === "RENT_UPDATE") {
      const payload = suggestion.payload as { newAmount?: string } | null;
      if (!payload?.newAmount)
        throw new ActionError(
          "Esta sugerencia no tiene un monto calculado — no se puede aplicar sola, hay que editar el contrato a mano.",
        );
      await prisma.$transaction([
        prisma.estateContract.update({
          where: { id: suggestion.contractId, tenantId: tenant.id },
          data: { amount: payload.newAmount },
        }),
        prisma.estateBillingSuggestion.delete({ where: { id: suggestion.id } }),
      ]);
    } else if (suggestion.kind === "EXTRA_CHARGES") {
      const contract = await prisma.estateContract.findFirst({
        where: { id: suggestion.contractId, tenantId: tenant.id },
        select: { dueDay: true },
      });
      if (!contract) throw new ActionError("Contrato no encontrado");
      const dueAt = periodDueDate(suggestion.period, contract.dueDay ?? 10);
      // Se valida solo lo que quedó tildado — un ítem descartado puede no
      // tener nunca un monto cargado, y eso es válido.
      const included = z
        .array(extraChargeItemSchema)
        .parse((extraChargeItems ?? []).filter((item) => item.include));
      await prisma.$transaction(async (tx) => {
        for (const item of included) {
          await tx.estateCharge.upsert({
            where: {
              contractId_period_concept: {
                contractId: suggestion.contractId,
                period: suggestion.period,
                concept: item.concept,
              },
            },
            create: {
              tenantId: tenant.id,
              contractId: suggestion.contractId,
              concept: item.concept,
              period: suggestion.period,
              dueAt,
              amount: item.amount,
              currency: item.currency,
            },
            // Si ya existe (doble aprobación, o se cargó a mano antes) no lo
            // pisa — el monto emitido queda como quedó.
            update: {},
          });
          await tx.estateContractChargeConcept.updateMany({
            where: { id: item.conceptId, tenantId: tenant.id },
            data: { lastAmount: item.amount, lastCurrency: item.currency },
          });
        }
        await tx.estateBillingSuggestion.delete({ where: { id: suggestion.id } });
      });
    }
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function dismissBillingSuggestion(id: string) {
  const { tenant } = await requireTenantAdmin();
  try {
    const suggestion = await prisma.estateBillingSuggestion.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!suggestion) throw new ActionError("Sugerencia no encontrada");
    await prisma.estateBillingSuggestion.delete({ where: { id: suggestion.id } });
    refreshEstate();
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// party: "tenant" marca/desmarca tenantAcceptedHandoverAt, "owner" el de owner.
export async function setContractHandoverAcceptance(
  contractId: string,
  party: "tenant" | "owner",
  accepted: boolean,
) {
  const { tenant } = await requireTenantAdmin();
  try {
    const contract = await prisma.estateContract.findFirst({
      where: { id: contractId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!contract) throw new ActionError("Contrato no encontrado");
    const acceptedAt = accepted ? new Date() : null;
    await prisma.estateContract.update({
      where: { id: contract.id },
      data:
        party === "tenant"
          ? { tenantAcceptedHandoverAt: acceptedAt }
          : { ownerAcceptedHandoverAt: acceptedAt },
    });
    refreshEstate();
    return { ok: true as const, acceptedAt };
  } catch (error) {
    return actionError(error);
  }
}

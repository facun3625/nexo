import Link from "next/link";
import { KeyRoundIcon, FileTextIcon, ReceiptTextIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getPortalContact } from "@/lib/require-portal";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { money, dateLabel, labels } from "@/lib/estate/modules";

const docTypeLabel: Record<string, string> = {
  SIGNED_CONTRACT: "Contrato firmado",
  INVENTORY: "Inventario",
  DELIVERY_ACT: "Acta de entrega",
  OTHER: "Otro",
};

function EmptyState({ title, description, ctaHref, ctaLabel }: { title: string; description: string; ctaHref?: string; ctaLabel?: string }) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <KeyRoundIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          {ctaLabel}
        </Link>
      )}
    </main>
  );
}

export default async function MiAlquilerPage() {
  const { tenant, session, contact } = await getPortalContact();

  if (!tenant) return null;

  if (!session) {
    return (
      <div className="public-inner-page public-account-page flex flex-1 flex-col">
        <StoreHero />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
          <EmptyState
            title="Mi alquiler"
            description="Iniciá sesión para ver tu contrato y lo que tenés que pagar."
            ctaHref="/login?callbackUrl=/mi-alquiler"
            ctaLabel="Ingresar"
          />
        </div>
        <StoreFooter />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="public-inner-page public-account-page flex flex-1 flex-col">
        <StoreHero />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
          <EmptyState
            title="Sin acceso al portal"
            description="Esta cuenta no tiene un contrato de alquiler vinculado. Si tenés uno, consultá con la inmobiliaria."
          />
        </div>
        <StoreFooter />
      </div>
    );
  }

  const contracts = await prisma.estateContract.findMany({
    where: { contactId: contact.id, tenantId: tenant.id },
    include: { property: { select: { title: true, address: true, city: true } } },
    orderBy: { startsAt: "desc" },
  });
  const contractIds = contracts.map((c) => c.id);

  const [charges, documents] = await Promise.all([
    contractIds.length
      ? prisma.estateCharge.findMany({
          where: { contractId: { in: contractIds }, tenantId: tenant.id },
          include: { receipts: true },
          orderBy: { dueAt: "desc" },
        })
      : Promise.resolve([]),
    contractIds.length
      ? prisma.estateContractDocument.findMany({
          where: {
            contractId: { in: contractIds },
            tenantId: tenant.id,
            visibility: { in: ["TENANT", "BOTH_PARTIES"] },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="public-inner-page public-account-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto w-full max-w-[1440px] flex-1 bg-background">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Mi alquiler</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hola, {contact.name}.</p>

          {contracts.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Todavía no tenés ningún contrato cargado.
            </p>
          ) : (
            <div className="mt-8 flex flex-col gap-8">
              {contracts.map((contract) => {
                const contractCharges = charges.filter((c) => c.contractId === contract.id);
                const contractDocs = documents.filter((d) => d.contractId === contract.id);
                return (
                  <section key={contract.id} className="rounded-2xl border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {contract.reference}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">{contract.property.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {[contract.property.address, contract.property.city].filter(Boolean).join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dateLabel(contract.startsAt)} – {dateLabel(contract.endsAt)} ·{" "}
                          {money(contract.amount, contract.currency)} / mes
                        </p>
                      </div>
                      <span
                        className={
                          contract.status === "ACTIVE"
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                        }
                      >
                        {labels[contract.status] ?? contract.status}
                      </span>
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ReceiptTextIcon className="size-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Cobros</h3>
                      </div>
                      {contractCharges.length > 0 ? (
                        <ul className="flex flex-col divide-y rounded-xl border">
                          {contractCharges.map((charge) => {
                            const paid = charge.receipts.reduce(
                              (n, r) => n.plus(r.amount),
                              new Prisma.Decimal(0),
                            );
                            const balance = charge.amount.minus(paid);
                            const isPaid = !charge.cancelled && balance.lessThanOrEqualTo(0);
                            const isOverdue = !isPaid && !charge.cancelled && charge.dueAt < new Date();
                            return (
                              <li key={charge.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                                <span className="min-w-0 flex-1 truncate font-medium">
                                  {charge.concept} · {charge.period}
                                </span>
                                <span className="text-muted-foreground">Vence {dateLabel(charge.dueAt)}</span>
                                <span className="font-semibold">{money(charge.amount, charge.currency)}</span>
                                <span
                                  className={
                                    charge.cancelled
                                      ? "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                      : isPaid
                                        ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                        : isOverdue
                                          ? "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                                          : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
                                  }
                                >
                                  {charge.cancelled ? "Anulado" : isPaid ? "Pagado" : isOverdue ? "Vencido" : "Pendiente"}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">Todavía no hay cobros generados.</p>
                      )}
                    </div>

                    {contractDocs.length > 0 && (
                      <div className="mt-5 border-t pt-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FileTextIcon className="size-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold">Documentos</h3>
                        </div>
                        <ul className="flex flex-col divide-y rounded-xl border">
                          {contractDocs.map((doc) => (
                            <li key={doc.id} className="px-3 py-2.5 text-sm">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary hover:underline"
                              >
                                {doc.title}
                              </a>
                              <p className="text-xs text-muted-foreground">
                                {docTypeLabel[doc.type] ?? doc.type}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

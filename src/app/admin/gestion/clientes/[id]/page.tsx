import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileTextIcon, IdCardIcon, MailIcon, ShieldCheckIcon, WalletIcon } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { estateRows, estateOptions } from "@/lib/estate/data";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { money, dateLabel, labels, chargeStatus } from "@/lib/estate/modules";
import { RecordForm } from "@/components/estate/record-form";
import { SectionNav } from "@/components/estate/section-nav";

export default async function EditarContactoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  const [options, [record]] = await Promise.all([
    estateOptions(tenant.id),
    estateRows("clientes", tenant.id, "", 0, id),
  ]);
  if (!record) notFound();

  const [contractsAsTenant, guarantorRows, ownedProperties] = await Promise.all([
    prisma.estateContract.findMany({
      where: { contactId: id, tenantId: tenant.id },
      include: { property: { select: { title: true, code: true } } },
      orderBy: { startsAt: "desc" },
    }),
    prisma.estateContractGuarantor.findMany({
      where: { contactId: id, tenantId: tenant.id },
      include: {
        contract: {
          include: {
            property: { select: { title: true } },
            contact: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.estateProperty.findMany({
      where: { ownerId: id, tenantId: tenant.id },
      select: { id: true, title: true, code: true, published: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const hasActiveContract = contractsAsTenant.some((c) => c.status === "ACTIVE");

  // Cuenta corriente: junta los cargos de todos los contratos donde esta
  // persona es inquilina (no como garante — el garante no es a quien se le
  // factura). Se agrupa por moneda porque un mismo cliente puede tener
  // contratos en ARS y en USD.
  const contractIds = contractsAsTenant.map((c) => c.id);
  const charges = contractIds.length
    ? await prisma.estateCharge.findMany({
        where: { contractId: { in: contractIds } },
        include: { receipts: true, contract: { select: { reference: true } } },
        orderBy: { dueAt: "desc" },
      })
    : [];

  const totalsByCurrency = new Map<string, { charged: Prisma.Decimal; paid: Prisma.Decimal }>();
  const pendingCharges: { id: string; label: string; period: string; dueAt: Date; currency: string; balance: Prisma.Decimal; status: string }[] = [];
  for (const charge of charges) {
    const paid = charge.receipts.reduce((n, r) => n.plus(r.amount), new Prisma.Decimal(0));
    const balance = charge.amount.minus(paid);
    if (!charge.cancelled) {
      const totals = totalsByCurrency.get(charge.currency) ?? { charged: new Prisma.Decimal(0), paid: new Prisma.Decimal(0) };
      totals.charged = totals.charged.plus(charge.amount);
      totals.paid = totals.paid.plus(paid);
      totalsByCurrency.set(charge.currency, totals);
    }
    if (!charge.cancelled && balance.greaterThan(0)) {
      pendingCharges.push({
        id: charge.id,
        label: `${charge.contract?.reference ?? ""} · ${charge.concept}`,
        period: charge.period,
        dueAt: charge.dueAt,
        currency: charge.currency,
        balance,
        status: chargeStatus(charge, balance, paid),
      });
    }
  }
  pendingCharges.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  const navItems = [
    { id: "datos", label: "Datos", icon: <IdCardIcon className="size-4" /> },
    ...(charges.length > 0
      ? [{ id: "cuenta-corriente", label: "Cuenta corriente", icon: <WalletIcon className="size-4" /> }]
      : []),
    ...(contractsAsTenant.length > 0
      ? [{ id: "historial-inquilino", label: "Historial como inquilino", icon: <FileTextIcon className="size-4" /> }]
      : []),
    ...(guarantorRows.length > 0
      ? [{ id: "historial-garante", label: "Historial como garante", icon: <ShieldCheckIcon className="size-4" /> }]
      : []),
    ...(ownedProperties.length > 0
      ? [{ id: "propiedades-propias", label: "Propiedades propias", icon: <Building2 className="size-4" /> }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/gestion/clientes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Clientes y contactos
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{record.title}</h1>
            {typeof record.values.email === "string" && record.values.email && (
              <Link
                href={`/admin/email-marketing/nuevo?contacto=${record.id}`}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium"
              >
                <MailIcon className="size-4" />
                Enviarle propiedades por mail
              </Link>
            )}
            {hasActiveContract && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Contrato activo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[210px_1fr]">
        <SectionNav items={navItems} />
        <div className="min-w-0 space-y-6">
      <section id="datos" className="scroll-mt-6 rounded-2xl border bg-card p-5 sm:p-7">
        <RecordForm
          module="clientes"
          id={record.id}
          values={record.values}
          options={options}
        />
      </section>

      {charges.length > 0 && (
        <div id="cuenta-corriente" className="scroll-mt-6 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <WalletIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Cuenta corriente</h2>
          </div>
          <div className="mb-5 flex flex-wrap gap-4">
            {[...totalsByCurrency.entries()].map(([currency, t]) => (
              <div key={currency} className="grid min-w-64 flex-1 grid-cols-3 gap-3 rounded-xl border p-4 text-sm">
                <div className="text-muted-foreground">
                  Facturado
                  <p className="mt-1 font-semibold text-foreground">{money(t.charged, currency)}</p>
                </div>
                <div className="text-muted-foreground">
                  Cobrado
                  <p className="mt-1 font-semibold text-foreground">{money(t.paid, currency)}</p>
                </div>
                <div className="text-muted-foreground">
                  Saldo
                  <p className={`mt-1 font-semibold ${t.charged.minus(t.paid).greaterThan(0) ? "text-destructive" : "text-foreground"}`}>
                    {money(t.charged.minus(t.paid), currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {pendingCharges.length > 0 ? (
            <ul className="flex flex-col divide-y rounded-xl border">
              {pendingCharges.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.label} · {c.period}
                  </span>
                  <span className="text-xs text-muted-foreground">Vence {dateLabel(c.dueAt)}</span>
                  <span className="text-sm font-semibold">{money(c.balance, c.currency)}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.status === "Vencida" ? "bg-destructive/10 text-destructive" : "bg-muted"
                    }`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No tiene saldo pendiente.</p>
          )}
        </div>
      )}

      {contractsAsTenant.length > 0 && (
        <div id="historial-inquilino" className="scroll-mt-6 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileTextIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Historial como inquilino</h2>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border">
            {contractsAsTenant.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <Link
                  href={`/admin/gestion/contratos/${c.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
                >
                  {c.reference} · {c.property.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {dateLabel(c.startsAt)} – {dateLabel(c.endsAt)} · {money(c.amount, c.currency)}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {labels[c.status] ?? c.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guarantorRows.length > 0 && (
        <div id="historial-garante" className="scroll-mt-6 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Historial como garante</h2>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border">
            {guarantorRows.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <Link
                  href={`/admin/gestion/contratos/${g.contract.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
                >
                  {g.contract.reference} · {g.contract.property.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Inquilino: {g.contract.contact.name}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {labels[g.contract.status] ?? g.contract.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ownedProperties.length > 0 && (
        <div id="propiedades-propias" className="scroll-mt-6 rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">Propiedades propias</h2>
          </div>
          <ul className="flex flex-col divide-y rounded-xl border">
            {ownedProperties.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <Link
                  href={`/admin/gestion/propiedades/${p.id}`}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
                >
                  {p.code} · {p.title}
                </Link>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {p.published ? "Publicada" : "Sin publicar"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

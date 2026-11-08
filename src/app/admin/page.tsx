import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Users,
  FileText,
  Plus,
} from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { money, dateLabel, argentinaDayStart } from "@/lib/estate/modules";
import { Prisma } from "@/generated/prisma/client";
export default async function AdminPage() {
  const { tenant } = await requireTenantAdmin();
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 30 * 86400000);
  const [
    properties,
    contacts,
    inquiries,
    contracts,
    expiring,
    charges,
  ] = await Promise.all([
    prisma.estateProperty.count({ where: { tenantId: tenant.id } }),
    prisma.estateContact.count({
      where: { tenantId: tenant.id, archived: false },
    }),
    prisma.estateInquiry.count({
      where: { tenantId: tenant.id, status: "NEW" },
    }),
    prisma.estateContract.count({
      where: { tenantId: tenant.id, status: "ACTIVE" },
    }),
    prisma.estateContract.findMany({
      where: {
        tenantId: tenant.id,
        status: "ACTIVE",
        endsAt: { gte: now, lte: monthAhead },
      },
      include: { property: true },
      orderBy: { endsAt: "asc" },
      take: 5,
    }),
    prisma.estateCharge.findMany({
      where: {
        tenantId: tenant.id,
        contractId: { not: null },
        cancelled: false,
        dueAt: { lt: argentinaDayStart(now) },
      },
      include: { receipts: true },
    }),
  ]);
  const balances: Record<string, Prisma.Decimal> = {};
  for (const c of charges) {
    const balance = c.amount.minus(
      c.receipts.reduce((a, r) => a.plus(r.amount), new Prisma.Decimal(0)),
    );
    if (balance.gt(0))
      balances[c.currency] = (
        balances[c.currency] ?? new Prisma.Decimal(0)
      ).plus(balance);
  }
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Tu inmobiliaria, en un solo lugar
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Resumen de actividad
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cartera, relaciones y administración al día.
          </p>
        </div>
        <Link
          href="/admin/gestion/propiedades?new=1"
          className="inline-flex h-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground"
        >
          <Plus className="size-4" />
          Nueva propiedad
        </Link>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Propiedades",
            value: properties,
            icon: Building2,
            href: "propiedades",
          },
          {
            label: "Contactos",
            value: contacts,
            icon: Users,
            href: "clientes",
          },
          {
            label: "Consultas nuevas",
            value: inquiries,
            icon: CalendarDays,
            href: "consultas",
          },
          {
            label: "Contratos activos",
            value: contracts,
            icon: FileText,
            href: "contratos",
          },
        ].map((c) => (
          <Link
            key={c.href}
            href={`/admin/gestion/${c.href}`}
            className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40"
          >
            <div className="flex justify-between">
              <c.icon className="size-5 text-primary" />
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-5 text-3xl font-semibold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Vencimientos y cobranzas</h2>
          <div className="my-5 space-y-3">
            {Object.entries(balances).map(([currency, balance]) => (
              <p
                key={currency}
                className="rounded-xl bg-amber-500/10 p-4 text-sm"
              >
                Saldo vencido: <strong>{money(balance, currency)}</strong>
              </p>
            ))}
            {!Object.keys(balances).length && (
              <p className="text-sm text-muted-foreground">
                Sin obligaciones vencidas pendientes.
              </p>
            )}
            {expiring.map((c) => (
              <p key={c.id} className="border-t pt-3 text-sm">
                {c.reference} · {c.property.title}
                <span className="block text-muted-foreground">
                  Contrato vence el {dateLabel(c.endsAt)}
                </span>
              </p>
            ))}
          </div>
          <Link
            href="/admin/gestion/cobranzas"
            className="text-sm text-primary"
          >
            Ver cuenta corriente →
          </Link>
        </section>
      </div>
    </div>
  );
}

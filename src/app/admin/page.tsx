import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Users,
  Plus,
} from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
export default async function AdminPage() {
  const { tenant } = await requireTenantAdmin();
  const [properties, contacts, inquiries] = await Promise.all([
    prisma.estateProperty.count({ where: { tenantId: tenant.id } }),
    prisma.estateContact.count({
      where: { tenantId: tenant.id, archived: false },
    }),
    prisma.estateInquiry.count({
      where: { tenantId: tenant.id, status: "NEW" },
    }),
  ]);
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
            Cartera, contactos y consultas al día.
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
      <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}

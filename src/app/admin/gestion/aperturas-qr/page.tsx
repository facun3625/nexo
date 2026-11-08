import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { getStoreSettings, getWhatsappTemplates } from "@/lib/settings";
import { renderWhatsappTemplate } from "@/lib/whatsapp-templates";
import { toWhatsAppWebLink } from "@/lib/social-links";
import { SITE_URL } from "@/lib/site-url";
import { MarkAllQrVisitsButton, QrVisitActions } from "./qr-visit-actions";

const PAGE_SIZE = 30;
const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

export const metadata = { title: "Aperturas de QR" };

export default async function AperturasQrPage({ searchParams }: { searchParams: Promise<{ page?: string; propiedad?: string }> }) {
  const { tenant } = await requireTenantAdmin();
  const search = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.page)) || 1));
  const where = { tenantId: tenant.id, ...(search.propiedad ? { propertyId: search.propiedad } : {}) };
  const [visits, pendingCount, { storeName }, templates] = await Promise.all([
    prisma.estateQrVisit.findMany({
      where,
      include: { property: { select: { id: true, title: true, code: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
    }),
    prisma.estateQrVisit.count({ where: { ...where, handledAt: null } }),
    getStoreSettings(tenant.id),
    getWhatsappTemplates(tenant.id),
  ]);
  const query = search.propiedad ? `propiedad=${encodeURIComponent(search.propiedad)}&` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Aperturas de QR</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Personas que escanearon el QR de una propiedad y dejaron sus datos para verla.{" "}
            <Link href="/admin/configuracion?tab=whatsapp" className="underline">Editar el texto de WhatsApp</Link>
          </p>
          {search.propiedad && (
            <Link href="/admin/gestion/aperturas-qr" className="mt-2 inline-block text-sm text-primary underline">
              Ver las de todas las propiedades
            </Link>
          )}
        </div>
        {pendingCount > 0 && <MarkAllQrVisitsButton />}
      </div>
      {visits.length ? (
        <div className="divide-y overflow-hidden rounded-2xl border bg-card">
          {visits.slice(0, PAGE_SIZE).map((visit) => {
            const text = renderWhatsappTemplate(templates.qrVisit, {
              nombre: visit.firstName,
              inmobiliaria: storeName,
              propiedad: visit.property.title,
              link: `${SITE_URL}/propiedades/${visit.property.id}`,
            });
            return (
              <div key={visit.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 font-semibold">
                    {visit.firstName} {visit.lastName}
                    {!visit.handledAt && (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">● Nueva</span>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">{visit.phone} · {dateFormatter.format(visit.createdAt)}</p>
                  <p className="mt-2 text-sm">
                    <Link href={`/admin/gestion/propiedades/${visit.property.id}`} className="font-medium hover:underline">
                      {visit.property.title}
                    </Link>{" "}
                    <span className="text-muted-foreground">({visit.property.code})</span>
                  </p>
                </div>
                <QrVisitActions id={visit.id} handled={Boolean(visit.handledAt)} whatsappHref={toWhatsAppWebLink(visit.phone, text)} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">Todavía nadie abrió un QR</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cada propiedad tiene su QR para descargar dentro de su ficha en el panel.</p>
        </div>
      )}
      <nav aria-label="Paginación" className="flex justify-between text-sm">
        {page > 1 ? <Link href={`?${query}page=${page - 1}`} className="underline">Anterior</Link> : <span />}
        {visits.length > PAGE_SIZE && <Link href={`?${query}page=${page + 1}`} className="underline">Siguiente</Link>}
      </nav>
    </div>
  );
}

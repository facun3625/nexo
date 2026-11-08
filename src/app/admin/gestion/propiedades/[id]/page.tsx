import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeDollarSignIcon, ImageIcon, MailIcon, MapPinIcon, Tags, TextIcon, SearchIcon } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { estateRows, estateOptions } from "@/lib/estate/data";
import { RecordForm } from "@/components/estate/record-form";
import { SectionNav } from "@/components/estate/section-nav";
import { getMercadoLibreSettings } from "@/lib/mercadolibre/settings";
import { MercadoLibrePanel } from "./mercadolibre-panel";
import { PropertyQrButton } from "./property-qr-button";
import { PropertyQrDetails } from "./property-qr-card";

const NAV_ITEMS = [
  { id: "section-publicacion", label: "Publicación", icon: <TextIcon className="size-4" /> },
  { id: "section-precio", label: "Precio y características", icon: <BadgeDollarSignIcon className="size-4" /> },
  { id: "section-ubicacion", label: "Ubicación", icon: <MapPinIcon className="size-4" /> },
  { id: "section-media", label: "Fotos, video y plano", icon: <ImageIcon className="size-4" /> },
  { id: "section-seo", label: "Google (SEO)", icon: <SearchIcon className="size-4" /> },
];

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  const [options, [record], mlSettings, mlListings] = await Promise.all([
    estateOptions(tenant.id),
    estateRows("propiedades", tenant.id, "", 0, id),
    getMercadoLibreSettings(tenant.id),
    prisma.estateListing.findMany({
      where: { propertyId: id, tenantId: tenant.id },
      select: { id: true, operation: true, mlItemId: true, mlPermalink: true, mlStatus: true, mlLastError: true, mlLastSyncedAt: true },
      orderBy: { operation: "asc" },
    }),
  ]);
  if (!record) notFound();

  const qrDetails = (
    <PropertyQrDetails
      tenantId={tenant.id}
      propertyId={record.id}
      code={String(record.values.code ?? record.id)}
      published={record.values.published === true}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/gestion/propiedades"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Propiedades
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {record.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/gestion/categorias"
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
          >
            <Tags className="size-4" />
            Categorías
          </Link>
          {record.values.published === true && (
            <Link
              href={`/admin/email-marketing/nuevo?propiedad=${record.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <MailIcon className="size-4" />
              Enviar por mail
            </Link>
          )}
          {record.values.published === true && (
            <Link
              href={`/propiedades/${record.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
            >
              Ver publicación
              <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[210px_1fr]">
        <SectionNav items={NAV_ITEMS} extra={<PropertyQrButton>{qrDetails}</PropertyQrButton>} />
        <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-7">
          <RecordForm
            module="propiedades"
            id={record.id}
            values={record.values}
            media={record.media}
            options={options}
          />
        </section>
      </div>
      <section className="rounded-2xl border bg-card p-5 sm:p-7">{qrDetails}</section>
      <MercadoLibrePanel
        propertyId={record.id}
        connected={mlSettings.connected}
        listings={mlListings.map((l) => ({
          ...l,
          mlLastSyncedAt: l.mlLastSyncedAt ? l.mlLastSyncedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}

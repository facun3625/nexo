import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { QR_COOKIE } from "@/lib/qr";
import { QrGateForm } from "./qr-gate-form";

export const metadata: Metadata = { title: "Ver propiedad", robots: { index: false, follow: false } };

// Si la misma persona vuelve a abrir el mismo QR enseguida (recarga, doble
// escaneo) no cuenta como otra apertura.
const REPEAT_WINDOW_MS = 30 * 60 * 1000;

async function recordReturningVisit(
  tenantId: string,
  propertyId: string,
  lead: { firstName: string; lastName: string; phone: string },
) {
  const recent = await prisma.estateQrVisit.findFirst({
    where: { tenantId, propertyId, phone: lead.phone, createdAt: { gte: new Date(Date.now() - REPEAT_WINDOW_MS) } },
    select: { id: true },
  });
  if (recent) return;
  await prisma.estateQrVisit.create({
    data: { tenantId, propertyId, firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone },
  });
}

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const property = await prisma.estateProperty.findFirst({
    where: { id, tenantId: tenant.id },
    select: {
      id: true,
      title: true,
      city: true,
      neighborhood: true,
      published: true,
      listings: { where: { status: "AVAILABLE" }, select: { id: true } },
      media: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  const settings = await getStoreSettings(tenant.id);
  const logo = settings.logoUrl && (
    <Image src={settings.logoUrl} alt={settings.storeName} width={240} height={64} className="mx-auto h-14 w-auto object-contain" />
  );

  // QR ya impreso de una propiedad vendida o despublicada: sin error.
  if (!property || !property.published || property.listings.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-4 py-10 text-center">
        {logo}
        <h1 className="text-2xl font-semibold">Esta propiedad ya no está disponible</h1>
        <p className="text-muted-foreground">Pero tenemos otras opciones que te pueden interesar.</p>
        <Link href="/propiedades" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground">
          Ver todas las propiedades
        </Link>
      </main>
    );
  }

  // Ya dejó sus datos en este celular: se registra la apertura y entra directo.
  const leadId = (await cookies()).get(QR_COOKIE)?.value;
  const lead = leadId
    ? await prisma.estateQrVisit.findFirst({ where: { id: leadId, tenantId: tenant.id } })
    : null;
  if (lead) {
    await recordReturningVisit(tenant.id, property.id, lead);
    redirect(`/propiedades/${property.id}`);
  }

  const photo = property.media[0]?.url;
  const place = [property.neighborhood, property.city].filter(Boolean).join(", ");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5 px-4 py-8">
      {logo}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {photo && (
          <div className="relative aspect-[16/9] bg-muted">
            <Image src={photo} alt="" fill priority sizes="(max-width: 480px) 100vw, 448px" className="object-cover" />
          </div>
        )}
        <div className="space-y-4 p-5">
          <div>
            <h1 className="text-lg font-semibold leading-snug">{property.title}</h1>
            {place && <p className="mt-1 text-sm text-muted-foreground">{place}</p>}
          </div>
          <p className="text-sm">Dejanos tus datos para ver la propiedad.</p>
          <QrGateForm propertyId={property.id} />
        </div>
      </div>
    </main>
  );
}

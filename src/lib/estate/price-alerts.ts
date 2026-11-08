import { prisma } from "@/lib/prisma";
import { money } from "@/lib/estate/modules";

export type PriceAlertRow = Awaited<ReturnType<typeof getPriceAlertRows>>[number];

// Compara cada aviso contra el precio actual de su oferta. Solo cuenta como
// baja si sigue publicada, con precio visible y en la misma moneda: no se
// convierten monedas.
export async function getPriceAlertRows(tenantId: string) {
  const alerts = await prisma.estatePriceAlert.findMany({
    where: { tenantId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          code: true,
          published: true,
          listings: { select: { operation: true, price: true, currency: true, showPrice: true, status: true, temporary: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return alerts.map((alert) => {
    const listing = alert.property.listings.find((l) => l.operation === alert.operation);
    const available = Boolean(alert.property.published && listing?.status === "AVAILABLE");
    const current = available && listing?.showPrice && listing.price && Number(listing.price) > 0 ? listing : null;
    const dropped = Boolean(current && current.currency === alert.currency && Number(current.price) < Number(alert.baselinePrice));
    return {
      id: alert.id,
      name: alert.name,
      phone: alert.phone,
      email: alert.email,
      notifiedAt: alert.notifiedAt,
      createdAt: alert.createdAt,
      property: { id: alert.property.id, title: alert.property.title, code: alert.property.code },
      available,
      dropped,
      baselineText: money(alert.baselinePrice, alert.currency),
      currentText: current?.price ? money(current.price, current.currency) : null,
    };
  });
}

export async function getDroppedPriceAlerts(tenantId: string) {
  return (await getPriceAlertRows(tenantId)).filter((row) => row.dropped);
}

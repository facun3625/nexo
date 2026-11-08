import Link from "next/link";

import { requireTenantAdmin } from "@/lib/require-admin";
import { getPriceAlertRows } from "@/lib/estate/price-alerts";
import { getStoreSettings, getWhatsappTemplates } from "@/lib/settings";
import { renderWhatsappTemplate } from "@/lib/whatsapp-templates";
import { toWhatsAppWebLink } from "@/lib/social-links";
import { SITE_URL } from "@/lib/site-url";
import { PriceAlertActions } from "./price-alert-actions";

const PAGE_SIZE = 30;
const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

export const metadata = { title: "Avisarme si baja el precio" };

export default async function AvisosPrecioPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { tenant } = await requireTenantAdmin();
  const search = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.page)) || 1));
  const [rows, { storeName }, templates] = await Promise.all([
    getPriceAlertRows(tenant.id),
    getStoreSettings(tenant.id),
    getWhatsappTemplates(tenant.id),
  ]);
  // Primero a quién hay que avisarle.
  const sorted = [...rows].sort((a, b) => Number(b.dropped) - Number(a.dropped));
  const droppedCount = rows.filter((r) => r.dropped).length;
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Avisarme si baja el precio</h1>
        {droppedCount > 0 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {droppedCount === 1 ? "A 1 persona le bajó" : `A ${droppedCount} personas les bajó`} el precio de la propiedad que siguen. Avisales con un clic.
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Personas que pidieron el aviso desde la ficha de una propiedad. Cuando bajás un precio, aparecen acá arriba con el mensaje listo.{" "}
          <Link href="/admin/configuracion?tab=whatsapp" className="underline">Editar el texto de WhatsApp</Link>
        </p>
      </div>
      {visible.length ? (
        <div className="divide-y overflow-hidden rounded-2xl border bg-card">
          {visible.map((row) => {
            const text = renderWhatsappTemplate(templates.priceDrop, {
              nombre: row.name.trim().split(/\s+/)[0] ?? "",
              inmobiliaria: storeName,
              propiedad: row.property.title,
              precio_anterior: row.baselineText,
              precio: row.currentText ?? "",
              link: `${SITE_URL}/propiedades/${row.property.id}`,
            });
            return (
              <div key={row.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold">{row.name}</h2>
                  <p className="text-sm text-muted-foreground">{row.phone} · {row.email}</p>
                  <p className="mt-2 text-sm">
                    <Link href={`/admin/gestion/propiedades/${row.property.id}`} className="font-medium hover:underline">
                      {row.property.title}
                    </Link>{" "}
                    <span className="text-muted-foreground">({row.property.code})</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pidió el aviso el {dateFormatter.format(row.createdAt)}
                    {row.notifiedAt && ` · Último aviso: ${dateFormatter.format(row.notifiedAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      row.dropped ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.dropped
                      ? `● Bajó de ${row.baselineText} a ${row.currentText}`
                      : row.available
                        ? `Sin baja · ${row.currentText ?? "Precio oculto"}`
                        : "Propiedad no disponible"}
                  </span>
                  <PriceAlertActions
                    id={row.id}
                    dropped={row.dropped}
                    whatsappHref={row.dropped ? toWhatsAppWebLink(row.phone, text) : null}
                    mailHref={
                      row.dropped
                        ? `/admin/email-marketing/nuevo?propiedad=${row.property.id}&para=${encodeURIComponent(row.email)}&nombre=${encodeURIComponent(row.name)}`
                        : null
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">Todavía nadie pidió un aviso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El botón «Avisarme si baja el precio» aparece en las fichas con precio publicado.
          </p>
        </div>
      )}
      <nav aria-label="Paginación" className="flex justify-between text-sm">
        {page > 1 ? <Link href={`?page=${page - 1}`} className="underline">Anterior</Link> : <span />}
        {sorted.length > page * PAGE_SIZE && <Link href={`?page=${page + 1}`} className="underline">Siguiente</Link>}
      </nav>
    </div>
  );
}

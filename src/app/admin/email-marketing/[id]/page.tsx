import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CopyIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { getMailBrand } from "@/lib/email-marketing/data";
import { CAMPAIGN_STATUS, renderMarketingEmail, templateDef, type MailContent } from "@/lib/email-marketing/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutoRefresh } from "./auto-refresh";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, tenantId: tenant.id },
    include: { recipients: { orderBy: [{ success: "asc" }, { email: "asc" }], take: 500 } },
  });
  if (!campaign) notFound();

  const content = campaign.content as unknown as MailContent;
  const brand = await getMailBrand(tenant.id);
  const single = campaign.audience === "SINGLE";
  const html = renderMarketingEmail(content, brand, {
    recipientName: single ? campaign.recipients[0]?.name : "María",
    unsubscribeUrl: single ? null : "#",
  });
  const status = CAMPAIGN_STATUS[campaign.status] ?? CAMPAIGN_STATUS.SENT;
  const pendingCount = campaign.recipientCount - campaign.sentCount - campaign.failedCount;
  const reuseHref = `/admin/email-marketing/nuevo?${single ? "" : "modo=lista&"}propiedad=${content.items
    .filter((i) => i.kind === "property")
    .map((i) => i.id)
    .join(",")}`;

  return (
    <div className="flex flex-col gap-5">
      {campaign.status === "SENDING" && <AutoRefresh />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/email-marketing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Email marketing
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{campaign.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dateFormatter.format(campaign.createdAt)} · {campaign.createdByName} ·{" "}
            {single ? "A un cliente" : `A la lista${campaign.audience === "LIST_AND_CONTACTS" ? " + clientes" : ""}`} · Plantilla{" "}
            {templateDef(campaign.template).name}
          </p>
        </div>
        <Button variant="outline" render={<Link href={reuseHref} />}>
          <CopyIcon className="size-4" />
          Usar de base para otro
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <Badge variant={status.variant}>{status.label}</Badge>
          <p className="mt-2 text-xs text-muted-foreground">Estado</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-semibold">{campaign.recipientCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Destinatarios</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{campaign.sentCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Enviados{pendingCount > 0 ? ` · ${pendingCount} en cola` : ""}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className={`text-2xl font-semibold ${campaign.failedCount ? "text-destructive" : ""}`}>{campaign.failedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Con error</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Destinatarios</h2>
          <ul className="max-h-[75vh] divide-y overflow-y-auto rounded-2xl border bg-card">
            {campaign.recipients.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{r.name || r.email}</p>
                  {r.name && <p className="truncate text-xs text-muted-foreground">{r.email}</p>}
                  {r.error && <p className="truncate text-xs text-destructive">{r.error}</p>}
                </div>
                <Badge variant={r.success === true ? "default" : r.success === false ? "destructive" : "outline"}>
                  {r.success === true ? "Enviado" : r.success === false ? "Error" : "En cola"}
                </Badge>
              </li>
            ))}
          </ul>
          {campaign.recipientCount > campaign.recipients.length && (
            <p className="text-xs text-muted-foreground">Se muestran los primeros {campaign.recipients.length}.</p>
          )}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">El mail</h2>
          <iframe title="Mail enviado" srcDoc={html} sandbox="" className="h-[75vh] w-full rounded-2xl border bg-white" />
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { MailPlusIcon, SendIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { getStoreSettings } from "@/lib/settings";
import { isMailerConfigured } from "@/lib/mailer";
import { getAudience } from "@/lib/email-marketing/data";
import { templateDef, CAMPAIGN_STATUS } from "@/lib/email-marketing/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscribersPanel } from "./subscribers-panel";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function EmailMarketingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tenant } = await requireTenantAdmin();
  const { tab } = await searchParams;
  const mailerReady = await isMailerConfigured(tenant.id);
  const [campaigns, subscribers, audience, settings] = await Promise.all([
    prisma.emailCampaign.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.emailSubscriber.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" } }),
    getAudience(tenant.id, true),
    getStoreSettings(tenant.id),
  ]);
  const activeSubscribers = subscribers.filter((s) => !s.unsubscribedAt).length;

  const stats = [
    { label: "Suscriptores activos", value: activeSubscribers },
    { label: "Personas con mail (suscriptores + clientes)", value: audience.length },
    { label: "Dados de baja", value: subscribers.length - activeSubscribers },
    { label: "Mails enviados", value: campaigns.reduce((n, c) => n + c.sentCount, 0) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Email marketing</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Mandá propiedades a un cliente en segundos o novedades a toda la lista, con el logo y los colores de la
            inmobiliaria.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/admin/email-marketing/nuevo" />}>
            <SendIcon className="size-4" />
            Enviar a un cliente
          </Button>
          <Button render={<Link href="/admin/email-marketing/nuevo?modo=lista" />}>
            <MailPlusIcon className="size-4" />
            Mail a toda la lista
          </Button>
        </div>
      </div>

      {!mailerReady && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          Todavía no hay correo configurado. Cargá los datos del SMTP en <Link href="/admin/configuracion?tab=correo" className="font-semibold underline">Configuración → Correo</Link>.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-4">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue={tab === "suscriptores" ? "suscriptores" : "envios"}>
        <TabsList>
          <TabsTrigger value="envios">Envíos</TabsTrigger>
          <TabsTrigger value="suscriptores">Suscriptores</TabsTrigger>
        </TabsList>

        <TabsContent value="envios">
          {campaigns.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Todavía no se mandó ningún mail. Probá con &quot;Enviar a un cliente&quot;: elegís la propiedad, el cliente, y listo.
            </p>
          ) : (
            <ul className="divide-y rounded-2xl border bg-card">
              {campaigns.map((c) => {
                const status = CAMPAIGN_STATUS[c.status] ?? CAMPAIGN_STATUS.SENT;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/email-marketing/${c.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm transition hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1 basis-64">
                        <p className="truncate font-medium">{c.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {dateFormatter.format(c.createdAt)} · {c.audience === "SINGLE" ? "A un cliente" : `A la lista · ${templateDef(c.template).name}`} ·{" "}
                          {c.createdByName}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {c.sentCount}/{c.recipientCount} enviados
                        {c.failedCount > 0 && <span className="text-destructive"> · {c.failedCount} con error</span>}
                      </span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="suscriptores">
          <SubscribersPanel
            signupEnabled={settings.newsletterSignup}
            rows={subscribers.map((s) => ({
              id: s.id,
              email: s.email,
              name: s.name,
              source: s.source,
              active: !s.unsubscribedAt,
              when: dateFormatter.format(s.unsubscribedAt ?? s.createdAt),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

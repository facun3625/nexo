import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { getStoreSettings } from "@/lib/settings";
import { isMailerConfigured } from "@/lib/mailer";
import { actorName } from "@/lib/estate/inquiry-status";
import { getAudience, getMailBrand, getMailCatalog } from "@/lib/email-marketing/data";
import { MailComposer } from "./mail-composer";

export default async function NuevoMailPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; propiedad?: string; contacto?: string; para?: string; nombre?: string }>;
}) {
  const { tenant, session } = await requireTenantAdmin();
  const params = await searchParams;
  const mailerReady = await isMailerConfigured(tenant.id);
  const [brand, catalog, contacts, subscribers, withContacts, settings] = await Promise.all([
    getMailBrand(tenant.id),
    getMailCatalog(tenant.id),
    prisma.estateContact.findMany({
      where: { tenantId: tenant.id, archived: false, email: { not: null } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getAudience(tenant.id, false),
    getAudience(tenant.id, true),
    getStoreSettings(tenant.id),
  ]);

  const mode = params.modo === "lista" ? "list" : "single";
  const propertyIds = (params.propiedad ?? "").split(",").filter(Boolean);
  const userName = actorName(session.user);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/email-marketing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Email marketing
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Nuevo mail</h1>
      </div>
      {!mailerReady && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          Todavía no hay correo configurado. Cargá los datos del SMTP en <Link href="/admin/configuracion?tab=correo" className="font-semibold underline">Configuración → Correo</Link>. Podés
          armar el mail y ver la vista previa, pero no se va a poder enviar.
        </p>
      )}
      <MailComposer
        brand={brand}
        properties={catalog.properties}
        developments={catalog.developments}
        contacts={contacts.map((c) => ({ id: c.id, name: c.name, email: c.email ?? "" }))}
        audience={{ subscribers: subscribers.length, withContacts: withContacts.length }}
        myEmail={session.user.email ?? settings.email ?? ""}
        signature={`Saludos,\n${userName === "Usuario del panel" ? settings.storeName : `${userName}\n${settings.storeName}`}`}
        initial={{ mode, propertyIds, contactId: params.contacto ?? null, email: params.para ?? "", name: params.nombre ?? "" }}
      />
    </div>
  );
}

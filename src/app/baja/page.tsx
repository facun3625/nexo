import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { UnsubscribeButton } from "./unsubscribe-button";

export const metadata: Metadata = {
  title: "Darse de baja",
  robots: { index: false },
};

// La baja se confirma con un botón y no al abrir el link: los antivirus de
// correo abren los links de los mails solos y darían de baja a la gente sin
// que lo pida.
export default async function BajaPage({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const [{ e = "", t = "" }, settings] = await Promise.all([searchParams, getStoreSettings(tenant.id)]);

  return (
    <main className="min-h-screen">
      <StoreHero />
      <article className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Suscripción</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Darse de baja</h1>
        {e && t ? (
          <>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              ¿Querés dejar de recibir los mails de novedades de {settings.storeName} en <strong className="text-foreground">{e}</strong>?
              Vas a seguir pudiendo consultar por propiedades en el sitio cuando quieras.
            </p>
            <UnsubscribeButton email={e} token={t} />
          </>
        ) : (
          <p className="mt-6 leading-relaxed text-muted-foreground">
            El link de baja está incompleto. Usá el link &quot;Darme de baja&quot; que viene al pie de cada mail.
          </p>
        )}
      </article>
      <StoreFooter />
    </main>
  );
}

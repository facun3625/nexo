import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Términos de uso",
  alternates: { canonical: "/terminos" },
};

export default async function TermsPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const settings = await getStoreSettings(tenant.id);

  const sections: [string, string][] = [
    ["1. El sitio", `Este sitio es operado por ${settings.storeName} para publicar propiedades y gestionar consultas, visitas y contratos de alquiler.`],
    ["2. Información de las propiedades", "Hacemos un esfuerzo razonable para mantener actualizada la información publicada (precio, estado, disponibilidad), pero puede sufrir cambios sin previo aviso. Las condiciones finales de cada operación se confirman con el agente a cargo."],
    ["3. Cuenta y portal de inquilinos/propietarios", "Si tenés acceso al portal, sos responsable de mantener tus credenciales seguras y de la actividad realizada desde tu cuenta."],
    ["4. Uso permitido", "No podés usar el sitio para fines ilegales, fraudulentos o que vulneren derechos de terceros."],
    ["5. Contacto", "Para cualquier consulta sobre estos términos, usá la página de Contacto."],
  ];

  return (
    <main className="min-h-screen">
      <StoreHero />
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Información legal</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Términos de uso</h1>
        <p className="mt-8 leading-relaxed text-muted-foreground">
          Estos términos regulan el acceso y uso del sitio de {settings.storeName}.
        </p>
        <div className="mt-10 space-y-9">
          {sections.map(([title, text]) => (
            <section key={title}>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
            </section>
          ))}
        </div>
      </article>
      <StoreFooter />
    </main>
  );
}

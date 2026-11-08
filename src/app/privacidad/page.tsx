import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacyPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const settings = await getStoreSettings(tenant.id);

  const sections: [string, string][] = [
    ["Qué información tratamos", `Tratamos los datos de contacto que nos dejás (nombre, email, teléfono) cuando consultás por una propiedad, pedís una visita o usás el portal de inquilinos/propietarios de ${settings.storeName}.`],
    ["Para qué la usamos", "Usamos esa información para responder tus consultas, coordinar visitas, gestionar contratos y cobranzas cuando corresponde, y para enviarte comunicaciones relacionadas con tus operaciones."],
    ["Con quién la compartimos", "No vendemos tus datos. Podemos compartir información puntual con proveedores que nos ayudan a operar el sitio (hosting, envío de mails, almacenamiento de imágenes), bajo condiciones de confidencialidad."],
    ["Conservación y seguridad", "Conservamos tu información mientras sea necesaria para la relación comercial y aplicamos medidas razonables de seguridad para protegerla."],
    ["Tus derechos", "Podés pedirnos acceso, corrección o eliminación de tus datos personales escribiéndonos por Contacto."],
    ["Cookies", "Usamos cookies técnicas necesarias para el funcionamiento del sitio (sesión, preferencias) y una cookie anónima para medir visitas."],
  ];

  return (
    <main className="min-h-screen">
      <StoreHero />
      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs font-black uppercase tracking-[.18em] text-primary">Tu información</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Política de privacidad</h1>
        <p className="mt-8 leading-relaxed text-muted-foreground">
          Esta política explica cómo {settings.storeName} trata la información de quienes nos contactan o usan el sitio.
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

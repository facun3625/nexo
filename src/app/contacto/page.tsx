import { notFound } from "next/navigation";
import { MapPinIcon, PhoneIcon, MailIcon } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { toWhatsAppLink, toInstagramLink } from "@/lib/social-links";
import { WhatsAppIcon, InstagramIcon } from "@/components/catalog/social-icons";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contacto",
  description: "Escribinos o llamanos: te ayudamos a comprar, vender, alquilar o tasar tu propiedad.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactoPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const { storeName, address, phone, email, whatsapp, instagram } =
    await getStoreSettings(tenant.id);
  const hasContactInfo = Boolean(
    address || phone || email || whatsapp || instagram,
  );

  return (
    <div className="public-inner-page public-form-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-8 px-4 py-10 sm:px-6 lg:gap-10 lg:px-8 lg:py-14">
          <div className="public-page-heading mx-auto flex w-full max-w-2xl flex-col gap-4 text-center">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              Estamos para ayudarte
            </span>
            <h1 className="text-[clamp(1.85rem,6vw,2.5rem)] font-bold tracking-tight text-foreground">
              Contactá a {storeName}
            </h1>
            <span className="mx-auto h-1 w-12 rounded-full bg-primary" />
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ContactForm />

            {hasContactInfo && (
              <aside className="h-fit rounded-2xl border bg-muted/30 p-6">
                <h2 className="text-sm font-semibold">Datos de contacto</h2>
                <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                  {address && (
                    <span className="flex min-w-0 items-start gap-2">
                      <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                      <span className="min-w-0 break-words">{address}</span>
                    </span>
                  )}
                  {phone && (
                    <span className="flex items-center gap-2">
                      <PhoneIcon className="size-4 shrink-0" />
                      {phone}
                    </span>
                  )}
                  {email && (
                    <span className="flex items-center gap-2">
                      <MailIcon className="size-4 shrink-0" />
                      <span className="min-w-0 break-all">{email}</span>
                    </span>
                  )}
                </div>
                {(whatsapp || instagram) && (
                  <div className="mt-5 flex items-center gap-2">
                    {whatsapp && (
                      <a
                        href={toWhatsAppLink(whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                      >
                        <WhatsAppIcon className="size-4" />
                      </a>
                    )}
                    {instagram && (
                      <a
                        href={toInstagramLink(instagram)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                      >
                        <InstagramIcon className="size-4" />
                      </a>
                    )}
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

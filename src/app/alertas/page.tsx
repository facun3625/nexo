import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { getSearchOptions } from "@/lib/estate/search-options";
import { AlertForm } from "./alert-form";

export const metadata = {
  title: "Recibí alertas de propiedades",
  description: "Dejanos qué buscás y te avisamos apenas entra una propiedad que coincida.",
  alternates: { canonical: "/alertas" },
};

export default async function AlertasPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const [{ storeName }, options] = await Promise.all([getStoreSettings(tenant.id), getSearchOptions(tenant.id)]);

  return (
    <div className="public-inner-page public-form-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-8 px-4 py-10 sm:px-6 lg:gap-10 lg:px-8 lg:py-14">
          <div className="public-page-heading mx-auto flex w-full max-w-2xl flex-col gap-4 text-center">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              Alertas de propiedades
            </span>
            <h1 className="text-[clamp(1.85rem,6vw,2.5rem)] font-bold tracking-tight text-foreground">
              No te pierdas la propiedad ideal
            </h1>
            <span className="mx-auto h-1 w-12 rounded-full bg-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              Guardá lo que estás buscando para que {storeName} pueda cruzarlo
              con las propiedades disponibles y contactarte cuando encuentre una coincidencia.
            </p>
          </div>

          <div className="mx-auto w-full max-w-2xl lg:max-w-5xl">
            <AlertForm options={options} />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

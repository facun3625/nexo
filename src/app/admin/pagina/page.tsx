import { getStoreSettings } from "@/lib/settings";
import { CoverVideoField } from "./cover-video-field";
import { getAboutContent, getAboutValues } from "@/lib/about";
import { getCatalogFilterSettings, getCatalogFilterLabels } from "@/lib/estate/catalog-filter-settings";
import { requireTenantAdmin } from "@/lib/require-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateSelectorForm } from "./template-selector-form";
import { IdentityForm } from "./identity-form";
import { HomeForm } from "./home-form";
import { AboutUsForm } from "./about-us-form";
import { ContactForm } from "./contact-form";
import { SocialForm } from "./social-form";
import { FooterForm } from "./footer-form";
import { CatalogFiltersForm } from "./catalog-filters-form";
import { ArquitecturaForm } from "./arquitectura-form";
import { AboutValuesForm } from "./about-values-form";
import { ArquitecturaVisibility } from "./arquitectura-visibility";
import { getArqContent } from "@/lib/arquitectura-content";

const VALID_TABS = new Set([
  "template",
  "identidad",
  "home",
  "buscador",
  "nosotros",
  "arquitectura",
  "contacto",
  "redes",
  "footer",
]);

export default async function PaginaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { tab } = await searchParams;
  const initialTab = tab && VALID_TABS.has(tab) ? tab : "template";
  const [settings, aboutContent, catalogFilters, catalogFilterLabels, arqContent, aboutValues] = await Promise.all([
    getStoreSettings(tenant.id),
    getAboutContent(tenant.id),
    getCatalogFilterSettings(tenant.id),
    getCatalogFilterLabels(tenant.id),
    getArqContent(tenant.id),
    getAboutValues(tenant.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Página web</h1>
        <p className="text-sm text-muted-foreground">
          Elegí una plantilla y completá cada sección de tu sitio público.
        </p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="w-full">
          <TabsTrigger value="template" className="flex-1">
            Plantilla
          </TabsTrigger>
          <TabsTrigger value="identidad" className="flex-1">
            Identidad
          </TabsTrigger>
          <TabsTrigger value="home" className="flex-1">
            Home
          </TabsTrigger>
          <TabsTrigger value="buscador" className="flex-1">
            Buscador
          </TabsTrigger>
          <TabsTrigger value="nosotros" className="flex-1">
            Nosotros
          </TabsTrigger>
          <TabsTrigger value="arquitectura" className="flex-1">
            Arquitectura
          </TabsTrigger>
          <TabsTrigger value="contacto" className="flex-1">
            Contacto
          </TabsTrigger>
          <TabsTrigger value="redes" className="flex-1">
            Redes
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex-1">
            Footer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <TemplateSelectorForm template={settings.template} />
        </TabsContent>

        <TabsContent value="identidad">
          <IdentityForm key={JSON.stringify(settings)} settings={settings} />
        </TabsContent>

        <TabsContent value="home">
          <div className="flex flex-col gap-4">
            <HomeForm key={JSON.stringify(settings)} settings={settings} />
            <CoverVideoField key={settings.coverVideoUrl ?? "sin-video"} url={settings.coverVideoUrl} />
          </div>
        </TabsContent>

        <TabsContent value="buscador">
          <CatalogFiltersForm
            key={JSON.stringify(catalogFilters) + JSON.stringify(catalogFilterLabels)}
            enabledOrder={catalogFilters}
            labels={catalogFilterLabels}
          />
        </TabsContent>

        <TabsContent value="nosotros">
          <div className="flex flex-col gap-4">
            <AboutUsForm content={aboutContent} />
            <AboutValuesForm key={JSON.stringify(aboutValues)} values={aboutValues} />
          </div>
        </TabsContent>

        <TabsContent value="arquitectura">
          <ArquitecturaVisibility enabled={settings.showArquitectura} />
          <ArquitecturaForm key={JSON.stringify(arqContent)} content={arqContent} />
        </TabsContent>

        <TabsContent value="contacto">
          <ContactForm key={JSON.stringify(settings)} settings={settings} />
        </TabsContent>

        <TabsContent value="redes">
          <SocialForm key={JSON.stringify(settings)} settings={settings} />
        </TabsContent>

        <TabsContent value="footer">
          <FooterForm key={JSON.stringify(settings)} settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

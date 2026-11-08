import { getStoreSettings, getSeoSettings, getTelegramSettings, getAiAssistantSettings } from "@/lib/settings";
import { getPopupConfig } from "@/lib/popup";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getMercadoLibreSettings } from "@/lib/mercadolibre/settings";
import { mercadoLibreRedirectUri } from "@/lib/mercadolibre/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PopupForm } from "./popup-form";
import { SeoSettingsForm } from "./seo-settings-form";
import { TelegramSettingsForm } from "./telegram-settings-form";
import { AiAssistantSettingsForm } from "./ai-assistant-settings-form";
import { MercadoLibreSettingsForm } from "./mercadolibre-settings-form";
import { BackupsPanel } from "./backups-panel";
import { SmtpSettingsForm } from "./smtp-settings-form";
import { getSmtpSettings } from "@/lib/smtp-settings";
import { listBackups, MAX_BACKUPS } from "@/lib/backup";

import { WhatsappTemplatesForm } from "./whatsapp-templates-form";
import { getWhatsappTemplates } from "@/lib/settings";

const VALID_TABS = new Set(["popup", "seo", "telegram", "ia", "mercadolibre", "correo", "whatsapp", "backups"]);

const backupDate = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "full",
  timeStyle: "short",
  hour12: false,
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mlError?: string }>;
}) {
  const { tenant, session } = await requireTenantAdmin();
  const isAdmin = session.user.role === "ADMIN";
  const { tab, mlError } = await searchParams;
  const initialTab = tab && VALID_TABS.has(tab) ? tab : "popup";
  const [settings, popupConfig, seoSettings, telegramSettings, aiSettings, mlSettings, properties, mlLocations, backups, smtpSettings] = await Promise.all([
    getStoreSettings(tenant.id),
    getPopupConfig(tenant.id),
    getSeoSettings(tenant.id),
    getTelegramSettings(tenant.id),
    getAiAssistantSettings(tenant.id),
    getMercadoLibreSettings(tenant.id),
    prisma.estateProperty.findMany({
      where: { tenantId: tenant.id },
      select: { city: true, neighborhood: true },
      distinct: ["city", "neighborhood"],
      orderBy: { city: "asc" },
    }),
    prisma.estateMlLocation.findMany({ where: { tenantId: tenant.id } }),
    isAdmin ? listBackups() : Promise.resolve([]),
    getSmtpSettings(tenant.id),
  ]);

  const mlLocationRows = properties.map((p) => ({
    city: p.city,
    neighborhood: p.neighborhood,
    mapping: mlLocations.find((m) => m.city === p.city && m.neighborhood === p.neighborhood) ?? null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Configuración</h1>

      <Tabs defaultValue={initialTab}>
        <TabsList className="w-full">
          <TabsTrigger value="popup" className="flex-1">
            Pop-up
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex-1">
            SEO
          </TabsTrigger>
          <TabsTrigger value="telegram" className="flex-1">
            Telegram
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex-1">
            Agente IA
          </TabsTrigger>
          <TabsTrigger value="mercadolibre" className="flex-1">
            Mercado Libre
          </TabsTrigger>
          <TabsTrigger value="correo" className="flex-1">
            Correo
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1">
            WhatsApp
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="backups" className="flex-1">
              Copias de seguridad
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="popup">
          <PopupForm key={popupConfig.version} config={popupConfig} />
        </TabsContent>

        <TabsContent value="seo">
          <SeoSettingsForm
            key={JSON.stringify(seoSettings)}
            settings={seoSettings}
            storeName={settings.storeName}
          />
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramSettingsForm key={JSON.stringify(telegramSettings)} settings={telegramSettings} />
        </TabsContent>

        <TabsContent value="ia">
          <AiAssistantSettingsForm key={JSON.stringify(aiSettings)} settings={aiSettings} />
        </TabsContent>

        <TabsContent value="mercadolibre">
          <MercadoLibreSettingsForm
            clientId={mlSettings.clientId}
            configured={mlSettings.configured}
            connected={mlSettings.connected}
            userId={mlSettings.userId}
            redirectUri={mercadoLibreRedirectUri()}
            mlError={mlError ?? null}
            locationRows={mlLocationRows}
          />
        </TabsContent>

        <TabsContent value="correo">
          <SmtpSettingsForm key={JSON.stringify(smtpSettings)} settings={smtpSettings} myEmail={session.user.email ?? ""} />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsappTemplatesForm templates={await getWhatsappTemplates(tenant.id)} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="backups">
            <BackupsPanel
              max={MAX_BACKUPS}
              backups={backups.map((b) => ({ filename: b.filename, sizeBytes: b.sizeBytes, when: backupDate.format(b.createdAt) }))}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

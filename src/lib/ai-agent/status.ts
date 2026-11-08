import { cache } from "react";
import { getAiAssistantSettings, getStoreSettings } from "@/lib/settings";
import { getHumanSellerAvailability, type HumanSellerAvailability } from "@/lib/ai-agent/availability";

export type AssistantStatus = {
  enabled: boolean;
  name: string;
  welcomeMessage: string;
  humanSeller: HumanSellerAvailability;
};

// Estado público del asistente (nunca incluye el proveedor ni la API key):
// lo usan el layout en el primer render y el widget cada minuto, para que
// un cambio en Configuración se vea sin recargar la página.
export const getAssistantStatus = cache(async (tenantId: string): Promise<AssistantStatus> => {
  const [assistant, store] = await Promise.all([
    getAiAssistantSettings(tenantId),
    getStoreSettings(tenantId),
  ]);
  const humanSeller = getHumanSellerAvailability({
    storeName: store.storeName,
    whatsappPhone: store.whatsapp,
    humanDays: assistant.humanDays,
    humanStartTime: assistant.humanStartTime,
    humanEndTime: assistant.humanEndTime,
  });
  return {
    enabled: assistant.enabled && Boolean(assistant.provider && assistant.apiKey),
    name: assistant.name,
    welcomeMessage: assistant.welcomeMessage,
    humanSeller,
  };
});

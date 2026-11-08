"use client";

import { usePathname } from "next/navigation";
import { useStoreSettings } from "@/lib/store-settings-context";
import { toWhatsAppLink } from "@/lib/social-links";
import { WhatsAppIcon } from "@/components/catalog/social-icons";

export function WhatsAppWidget() {
  const pathname = usePathname();
  const { whatsapp } = useStoreSettings();

  // Ocultar en el panel admin, si no hay número configurado, o en el
  // checkout — ahí compite por el mismo rincón con la barra fija del total
  // (ver checkout-form.tsx), y la prioridad ahí es que el total no se pierda.
  if (!whatsapp || pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <a
      href={toWhatsAppLink(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-[99] flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6 sm:size-14"
      aria-label="Contactar por WhatsApp"
    >
      <WhatsAppIcon className="size-6 sm:size-7" />
    </a>
  );
}

import { Mail, Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { toWhatsAppLink } from "@/lib/social-links";

// Cierre común de las páginas de Arquitectura.
export function ArquitecturaContact({
  phone,
  whatsapp,
  email,
}: {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}) {
  if (!email && !whatsapp && !phone) return null;
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Hablemos</p>
        <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">¿Tenés un proyecto en mente?</h2>
        <p className="mt-3 text-muted-foreground">
          La primera entrevista de asesoramiento es sin costo.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Mail className="size-4" />
            {email}
          </a>
        )}
        {whatsapp ? (
          <a
            href={toWhatsAppLink(whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-105"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        ) : (
          phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold transition hover:bg-muted"
            >
              <Phone className="size-4" />
              {phone}
            </a>
          )
        )}
      </div>
    </section>
  );
}

import React from "react";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { getContent } from "@/lib/content";

interface SiteConfig {
  facebook?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export default async function Footer({ siteConfig }: { siteConfig: SiteConfig }) {
  const phone = siteConfig?.phone || "";
  const whatsapp = siteConfig?.whatsapp || "";
  const email = siteConfig?.email || "";
  const address = siteConfig?.address || "";
  const facebook = siteConfig?.facebook || "";
  const instagram = siteConfig?.instagram || "";

  const [tagline, col2Titulo, col2Texto, col2Cta, ctaTitulo, ctaSubtitulo] = await Promise.all([
    getContent("footer_tagline"),
    getContent("footer_col2_titulo"),
    getContent("footer_col2_texto"),
    getContent("footer_col2_cta"),
    getContent("footer_cta_titulo"),
    getContent("footer_cta_subtitulo"),
  ]);

  return (
    <footer id="contacto" className="bg-[#262522] text-white">

      {/* CTA strip */}
      <div className="border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-[0.4em] font-semibold mb-1">{ctaSubtitulo}</p>
            <h3 className="text-2xl md:text-3xl font-bold text-white">{ctaTitulo}</h3>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2.5 bg-brand-orange hover:bg-orange-700 transition-colors text-white font-bold text-[13px] uppercase tracking-wider px-8 py-4 rounded-lg"
              >
                <Phone size={14} />
                {phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] transition-colors text-white font-bold text-[13px] uppercase tracking-wider px-8 py-4 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Col 1 — Marca */}
          <div>
            <img src="/logo.png" alt="Penalva Inmobiliaria" className="h-10 w-auto object-contain mb-5 brightness-0 invert opacity-75" />
            <p className="text-[13px] text-white/30 leading-relaxed mb-6 max-w-xs">
              {tagline}
            </p>
            <div className="flex gap-4">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-colors">
                  <Facebook size={13} />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-colors">
                  <Instagram size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Col 2 — Texto */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-5">{col2Titulo}</h4>
            <p className="text-[13px] text-white/40 leading-relaxed">{col2Texto}</p>
            <p className="mt-4 text-[13px] text-brand-orange/80">{col2Cta}</p>
          </div>

          {/* Col 3 — Contacto */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-5">Contacto</h4>
            <div className="space-y-4">
              {phone && (
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-brand-orange/15 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/25 transition-colors">
                    <Phone size={13} className="text-brand-orange" />
                  </div>
                  <span className="text-[13px] text-white/40 group-hover:text-white/70 transition-colors">{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-brand-orange/15 flex items-center justify-center shrink-0 group-hover:bg-brand-orange/25 transition-colors mt-0.5">
                    <Mail size={13} className="text-brand-orange" />
                  </div>
                  <span className="text-[13px] text-white/40 group-hover:text-white/70 transition-colors break-all leading-snug">{email}</span>
                </a>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-orange/15 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={13} className="text-brand-orange" />
                  </div>
                  <span className="text-[13px] text-white/40 leading-snug">{address}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-white/15">
          <span>© {new Date().getFullYear()} Penalva Inmobiliaria de P+P SRL. Todos los derechos reservados.</span>
          <a href="https://kubbo.com.ar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span className="text-white/20 text-[10px] uppercase tracking-widest">Desarrollado por</span>
            <img src="/kubbo.png" alt="Kubbo" className="h-4 w-auto opacity-60" />
          </a>
        </div>
      </div>

    </footer>
  );
}

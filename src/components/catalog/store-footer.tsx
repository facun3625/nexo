"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, PhoneIcon, MailIcon } from "lucide-react";

import { useStoreSettings } from "@/lib/store-settings-context";
import { contrastText } from "@/lib/contrast-color";
import { toWhatsAppLink, toInstagramLink } from "@/lib/social-links";
import { WhatsAppIcon, InstagramIcon } from "./social-icons";
import { RichText } from "./rich-text";
import { NewsletterSignup } from "./newsletter-signup";
import { KubboLogo } from "@/components/catalog/kubbo-logo";

export function StoreFooter() {
  const { newsletterSignup } = useStoreSettings();
  return (
    <>
      {newsletterSignup && <NewsletterSignup />}
      <StoreFooterBody />
    </>
  );
}

function StoreFooterBody() {
  const {
    template,
    storeName,
    logoUrl,
    footerLogoUrl,
    address,
    phone,
    email,
    whatsapp,
    instagram,
    footerBgColor,
    footerLogoHeight,
    footerTagline,
    footerPitchTitle,
    footerPitchText,
  } = useStoreSettings();
  const hasSocial = Boolean(whatsapp || instagram);
  const hasContactInfo = Boolean(address || phone || email);
  const footerFg = contrastText(footerBgColor);
  const footerStyle = { backgroundColor: footerBgColor, color: footerFg };
  const footerLogoSrc = footerLogoUrl ?? logoUrl;
  // El chip blanco es para que el logo del HEADER (pensado para fondo claro)
  // no se pierda al reusarse en un footer oscuro. Si el tenant subió un logo
  // propio para el footer, es porque ya lo diseñó para ese fondo (ej: una
  // versión blanca del isologo) — envolverlo en blanco lo taparía.
  const footerLogoChipClass = footerLogoUrl ? "" : "bg-white";

  if (template === "moderno") {
    return (
      <footer className="px-4 pb-4 pt-10 sm:px-6 lg:px-8 lg:pb-8" style={footerStyle}>
        <section id="hablemos-hoy" className="mx-auto grid w-full max-w-[1440px] gap-8 rounded-[2rem] bg-white/10 px-6 py-9 ring-1 ring-white/15 backdrop-blur sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-14 lg:py-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-current/55">¿Querés vender o alquilar?</p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-.04em] sm:text-6xl">Hablemos de tu próximo paso.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {phone && <a href={`tel:${phone}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-neutral-900"><PhoneIcon className="size-4" />{phone}</a>}
            {whatsapp && <a href={toWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white"><WhatsAppIcon className="size-4" />WhatsApp</a>}
            {!phone && !whatsapp && <Link href="/contacto" className="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-neutral-900">Contactanos</Link>}
          </div>
        </section>
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-2 py-14 text-sm sm:px-6 lg:grid-cols-[1.15fr_1fr_1fr]">
          <div>
            {footerLogoSrc ? (
              <span className={`flex w-fit items-center overflow-hidden rounded-xl p-2 ${footerLogoChipClass}`} style={{ height: footerLogoHeight, maxWidth: footerLogoHeight * 3.5 }}>
                <Image src={footerLogoSrc} alt={storeName} width={Math.round(footerLogoHeight * 3.5)} height={footerLogoHeight} className="size-full object-contain" />
              </span>
            ) : <strong className="text-2xl">{storeName}</strong>}
            <RichText html={footerTagline} className="mt-5 max-w-sm text-current/60" />
            {hasSocial && <div className="mt-5 flex gap-3">
              {whatsapp && <a href={toWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex size-10 items-center justify-center rounded-full border border-current/20"><WhatsAppIcon className="size-4" /></a>}
              {instagram && <a href={toInstagramLink(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex size-10 items-center justify-center rounded-full border border-current/20"><InstagramIcon className="size-4" /></a>}
            </div>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-current/45">{footerPitchTitle}</p>
            <RichText html={footerPitchText} className="mt-5 max-w-sm text-current/70" />
          </div>
          {hasContactInfo && <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-current/45">Contacto</p>
            <div className="mt-5 flex flex-col gap-4 text-current/75">
              {phone && <span className="flex gap-3"><PhoneIcon className="mt-0.5 size-4 shrink-0" />{phone}</span>}
              {email && <span className="flex gap-3 break-all"><MailIcon className="mt-0.5 size-4 shrink-0" />{email}</span>}
              {address && <span className="flex gap-3"><MapPinIcon className="mt-0.5 size-4 shrink-0" />{address}</span>}
            </div>
          </div>}
        </div>
        <FooterCredit />
      </footer>
    );
  }

  if (template === "minimal") {
    return (
      <footer id="hablemos-hoy" className="border-t border-neutral-200 bg-white px-4 text-neutral-900 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px] py-14 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[.28em] text-neutral-400">Contacto</p>
              <h2 className="mt-5 max-w-xl text-4xl font-medium leading-tight tracking-[-.04em] sm:text-6xl">Conversemos sobre lo que estás buscando.</h2>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                {phone && <a href={`tel:${phone}`} className="border-b border-neutral-900 pb-1">{phone}</a>}
                {whatsapp && <a href={toWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer" className="border-b border-neutral-900 pb-1">WhatsApp</a>}
                {!phone && !whatsapp && <Link href="/contacto" className="border-b border-neutral-900 pb-1">Contactanos</Link>}
              </div>
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase tracking-[.24em] text-neutral-400">{footerPitchTitle}</p>
              <RichText html={footerPitchText} className="mt-5 leading-6 text-neutral-500" />
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase tracking-[.24em] text-neutral-400">Datos</p>
              <div className="mt-5 flex flex-col gap-3 text-neutral-600">
                {address && <span>{address}</span>}
                {email && <span className="break-all">{email}</span>}
                {phone && <span>{phone}</span>}
              </div>
              {hasSocial && <div className="mt-7 flex gap-5">
                {whatsapp && <a href={toWhatsAppLink(whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon className="size-5" /></a>}
                {instagram && <a href={toInstagramLink(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon className="size-5" /></a>}
              </div>}
            </div>
          </div>
          <div className="mt-16 flex flex-col gap-5 border-t border-neutral-200 pt-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {footerLogoSrc ? <Image src={footerLogoSrc} alt={storeName} width={Math.round(footerLogoHeight * 3.5)} height={footerLogoHeight} className="max-h-12 w-auto object-contain" /> : <strong className="text-xl font-medium">{storeName}</strong>}
              <RichText html={footerTagline} className="mt-3 max-w-md text-sm text-neutral-400" />
            </div>
            <FooterCredit minimal />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <>
      <section
        id="hablemos-hoy"
        className="scroll-mt-20 border-t border-border py-10 sm:py-12"
        style={footerStyle}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-current/50">
              ¿Querés vender o alquilar?
            </p>
            <h2 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-bold">
              Hablemos hoy.
            </h2>
          </div>
          <div className="grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
              >
                <PhoneIcon className="size-4" />
                {phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={toWhatsAppLink(whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white transition duration-200 hover:brightness-105"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
            )}
            {!phone && !whatsapp && (
              <Link
                href="/contacto"
                className="rounded-xl px-6 py-3.5 font-semibold transition hover:opacity-90"
                style={{ backgroundColor: footerFg, color: footerBgColor }}
              >
                Contactanos
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="py-10 sm:py-12" style={footerStyle}>
        <div className="mx-auto grid w-full max-w-[1440px] gap-9 border-t border-current/10 px-4 pt-10 text-sm sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          <div>
            {footerLogoSrc ? (
              <span
                className={`flex w-auto items-center justify-center overflow-hidden rounded-xl p-1.5 ${footerLogoChipClass}`}
                style={{ height: footerLogoHeight, maxWidth: footerLogoHeight * 3.5 }}
              >
                <Image
                  src={footerLogoSrc}
                  alt={storeName}
                  width={Math.round(footerLogoHeight * 3.5)}
                  height={footerLogoHeight}
                  className="size-full object-contain"
                />
              </span>
            ) : (
              <span className="text-lg font-semibold text-current">
                {storeName}
              </span>
            )}
            <RichText html={footerTagline} className="mt-4 max-w-xs text-current/60" />
            {hasSocial && (
              <div className="mt-4 flex items-center gap-2">
                {whatsapp && (
                  <a
                    href={toWhatsAppLink(whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 items-center justify-center rounded-full border border-current/15 text-current/70 transition-colors hover:border-current/30 hover:text-current"
                  >
                    <WhatsAppIcon className="size-4" />
                  </a>
                )}
                {instagram && (
                  <a
                    href={toInstagramLink(instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-9 items-center justify-center rounded-full border border-current/15 text-current/70 transition-colors hover:border-current/30 hover:text-current"
                  >
                    <InstagramIcon className="size-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-current/50">
              {footerPitchTitle}
            </h3>
            <RichText html={footerPitchText} className="mt-4 text-current/70" />
          </div>

          {hasContactInfo && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-current/50">
                Contacto
              </h3>
              <div className="mt-4 flex flex-col gap-4">
                {phone && (
                  <div className="flex items-center gap-3 text-current/80">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-current/10 text-current">
                      <PhoneIcon className="size-4" />
                    </span>
                    {phone}
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-3 text-current/80">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-current/10 text-current">
                      <MailIcon className="size-4" />
                    </span>
                    <span className="min-w-0 break-all">{email}</span>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-3 text-current/80">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-current/10 text-current">
                      <MapPinIcon className="size-4" />
                    </span>
                    <span className="min-w-0 break-words">{address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-[1440px] flex-wrap items-baseline justify-center gap-2 border-t border-current/10 px-4 pt-6 text-center text-sm text-current/60 lg:px-8">
          <span>Desarrollado por</span>
          <a
            href="https://kubbo.com.ar"
            target="_blank"
            rel="noreferrer"
            aria-label="kubbo.com.ar"
            className="inline-flex transition-opacity hover:opacity-80"
          >
            <KubboLogo className="block h-3.5 w-auto" />
          </a>
        </div>
      </footer>
    </>
  );
}

function FooterCredit({ minimal = false }: { minimal?: boolean }) {
  return (
    <div className={`${minimal ? "text-neutral-400" : "border-t border-current/10 pt-6 text-current/55"} flex flex-wrap items-baseline justify-center gap-2 text-center text-sm`}>
      <span>Desarrollado por</span>
      <a href="https://kubbo.com.ar" target="_blank" rel="noreferrer" aria-label="kubbo.com.ar" className="inline-flex transition-opacity hover:opacity-80">
        <KubboLogo className="block h-3.5 w-auto" />
      </a>
    </div>
  );
}

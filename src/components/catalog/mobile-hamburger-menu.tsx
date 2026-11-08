"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MapPinIcon, PhoneIcon, MailIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStoreSettings } from "@/lib/store-settings-context";
import { ARQ_SECTIONS } from "@/lib/arquitectura";
import {
  toWhatsAppLink,
  toInstagramLink,
  toFacebookLink,
  toYoutubeLink,
} from "@/lib/social-links";
import {
  WhatsAppIcon,
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
} from "./social-icons";

export function MobileHamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const {
    address,
    phone,
    email,
    whatsapp,
    instagram,
    facebook,
    youtube,
    hasServices,
  } = useStoreSettings();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="flex size-9 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/10 text-current backdrop-blur-md transition-colors duration-200 hover:bg-current/20">
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </button>
        }
      />
      <SheetContent
        side="left"
        className="w-[min(88vw,350px)] overflow-y-auto border-white/10 bg-foreground text-white duration-200 ease-out"
      >
        <SheetHeader className="text-left mb-2 px-6 pt-6 pb-2">
          <SheetTitle className="text-white text-base">Menú</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-6 pb-6">
          <nav className="flex flex-col gap-2">
            {[
              { href: "/", label: "Inicio" },
              ...(hasServices
                ? [{ href: "/servicios", label: "Servicios" }]
                : []),
              { href: "/sobre-nosotros", label: "Sobre nosotros" },
              { href: "/arquitectura", label: "Arquitectura", children: ARQ_SECTIONS },
              { href: "/propiedades", label: "Ver todas las propiedades" },
              { href: "/mapa", label: "Propiedades en mapa" },
              { href: "/alertas", label: "Recibir alertas" },
              { href: "#hablemos-hoy", label: "Contacto" },
            ].map((link) => {
              if ("children" in link && link.children) {
                return (
                  <div key={link.href} className="flex flex-col gap-1.5">
                    <span className="px-4 pt-1 text-xs font-semibold uppercase tracking-wider text-white/50">
                      {link.label}
                    </span>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "ml-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                          pathname.startsWith(child.href)
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-white hover:bg-white/20",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : !link.href.startsWith("#") &&
                    pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 border-t border-white/20 pt-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Contacto
            </h3>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              {address && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="size-5 shrink-0 text-white/50" />
                  <span>{address}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="size-5 shrink-0 text-white/50" />
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3">
                  <MailIcon className="size-5 shrink-0 text-white/50" />
                  <span>{email}</span>
                </div>
              )}
            </div>

            {(whatsapp || instagram || facebook || youtube) && (
              <div className="flex items-center gap-3 mt-2">
                {whatsapp && (
                  <a
                    href={toWhatsAppLink(whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  >
                    <WhatsAppIcon className="size-5" />
                  </a>
                )}
                {instagram && (
                  <a
                    href={toInstagramLink(instagram)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  >
                    <InstagramIcon className="size-5" />
                  </a>
                )}
                {facebook && (
                  <a
                    href={toFacebookLink(facebook)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  >
                    <FacebookIcon className="size-5" />
                  </a>
                )}
                {youtube && (
                  <a
                    href={toYoutubeLink(youtube)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  >
                    <YoutubeIcon className="size-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useStoreSettings } from "@/lib/store-settings-context";
import { toInstagramLink, toFacebookLink, toYoutubeLink } from "@/lib/social-links";
import { InstagramIcon, FacebookIcon, YoutubeIcon } from "./social-icons";

// Franja fina arriba de todo, antes del header con el logo — solo redes
// (Instagram/Facebook/YouTube), no WhatsApp (ese ya tiene su propio botón
// flotante). La red que quede vacía en Identidad no imprime su ícono, y si
// no hay ninguna cargada la franja entera no se muestra.
export function StoreTopBar() {
  const { instagram, facebook, youtube } = useStoreSettings();

  const links = [
    instagram && { href: toInstagramLink(instagram), label: "Instagram", Icon: InstagramIcon },
    facebook && { href: toFacebookLink(facebook), label: "Facebook", Icon: FacebookIcon },
    youtube && { href: toYoutubeLink(youtube), label: "YouTube", Icon: YoutubeIcon },
  ].filter((x): x is { href: string; label: string; Icon: typeof InstagramIcon } => Boolean(x));

  if (!links.length) return null;

  return (
    <div className="border-b border-border/70 px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] justify-end gap-3 py-1.5">
        {links.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

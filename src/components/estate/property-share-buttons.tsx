"use client";
import { useState } from "react";
import { CheckIcon, LinkIcon, MailIcon } from "lucide-react";
import { WhatsAppIcon, FacebookIcon, XIcon } from "@/components/catalog/social-icons";

export function PropertyShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Mirá esta propiedad: ${title}`;

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      Icon: WhatsAppIcon,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      Icon: FacebookIcon,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      Icon: XIcon,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      Icon: MailIcon,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles (poco común) — no rompe nada, el resto
      // de los botones de compartir siguen funcionando igual.
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">Compartir</span>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Compartir por ${label}`}
          className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
        >
          <Icon className="size-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copiar link"
        className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        {copied ? <CheckIcon className="size-4 text-emerald-600" /> : <LinkIcon className="size-4" />}
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";

import { contrastText } from "@/lib/contrast-color";
import { useStoreSettings } from "@/lib/store-settings-context";

// Foto de sección sin oscurecer, con el texto en una raya de color abajo
// (el color del menú, configurable en Página web → Identidad).
export function PhotoBanner({
  image,
  eyebrow,
  title,
  subtitle,
}: {
  image: string | null;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const { menuBgColor } = useStoreSettings();
  return (
    <section>
      <div className="relative h-[clamp(12rem,26vw,20rem)] overflow-hidden bg-muted">
        {image ? (
          <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-foreground" />
        )}
      </div>
      <div style={{ backgroundColor: menuBgColor, color: contrastText(menuBgColor) }}>
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {eyebrow && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[.3em] opacity-75">{eyebrow}</p>}
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm opacity-85 sm:text-base">{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

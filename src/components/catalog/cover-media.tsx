"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// Portada del Inicio: video si hay uno cargado (la foto queda de imagen de
// espera), si no la foto. Va sin sonido y en loop: los navegadores solo
// reproducen solos los videos silenciados.
export function CoverMedia({
  videoUrl,
  imageUrl,
  sizes = "100vw",
  className = "object-cover",
}: {
  videoUrl: string | null;
  imageUrl: string | null;
  sizes?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = true;
    // Con «reducir movimiento» activado o si el celular bloquea la
    // reproducción automática, se queda quieto mostrando la foto.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {});
  }, [videoUrl]);

  if (videoUrl) {
    return (
      <video
        ref={ref}
        src={videoUrl}
        poster={imageUrl ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className={`absolute inset-0 size-full ${className}`}
      />
    );
  }
  if (!imageUrl) return null;
  return <Image src={imageUrl} alt="" fill priority sizes={sizes} className={className} />;
}

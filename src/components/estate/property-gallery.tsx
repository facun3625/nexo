"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronLeftIcon,
  ChevronRightIcon,
  Expand,
  XIcon,
} from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string };

// Galería de la ficha: foto grande con flechas (sin autoplay) y, abajo, una
// tira de miniaturas que se desplaza por su cuenta — moverse en la tira no
// cambia la foto de arriba; tocar una miniatura sí.
export function PropertyGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
  const count = images.length;

  function go(direction: -1 | 1) {
    setIndex((i) => (i + direction + count) % count);
  }

  function updateStripArrows() {
    const strip = stripRef.current;
    if (!strip) return;
    setCanScroll({
      left: strip.scrollLeft > 4,
      right: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4,
    });
  }

  useEffect(() => {
    updateStripArrows();
    window.addEventListener("resize", updateStripArrows);
    return () => window.removeEventListener("resize", updateStripArrows);
  }, []);

  useEffect(() => {
    if (!zoomOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen, count]);

  function scrollStrip(direction: -1 | 1) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * strip.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  if (!count) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-[16/10]">
        <Building2 className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-background";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-[16/10]"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* Solo la foto actual y sus vecinas: así la siguiente ya está
            cargada al tocar la flecha, sin bajar las 30 fotos de entrada. */}
        {images.map((image, i) => {
          const near =
            i === index ||
            i === (index + 1) % count ||
            i === (index - 1 + count) % count;
          return near ? (
            <Image
              key={image.id}
              src={image.url}
              alt={`${title}, foto ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width:1024px) 100vw, 900px"
              className={cn(
                "object-cover transition-opacity duration-300",
                i === index ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            />
          ) : null;
        })}
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label="Ver foto en pantalla completa"
          className="absolute inset-0 z-[5] cursor-zoom-in"
        />
        <span className="pointer-events-none absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
          <Expand className="size-4" />
        </span>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className={cn(arrow, "left-3 size-10")}
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className={cn(arrow, "right-3 size-10")}
            >
              <ChevronRightIcon className="size-5" />
            </button>
            <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="relative">
          <div
            ref={stripRef}
            onScroll={updateStripArrows}
            className="flex gap-2 overflow-x-auto scroll-smooth p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, i) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-muted outline-none transition sm:w-24",
                  i === index
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="96px"
                  loading="lazy"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          {canScroll.left && (
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Ver miniaturas anteriores"
              className={cn(arrow, "-left-2 size-8")}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          )}
          {canScroll.right && (
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Ver más miniaturas"
              className={cn(arrow, "-right-2 size-8")}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          )}
        </div>
      )}

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          className="h-[min(86dvh,850px)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden bg-black p-0 duration-200 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-5xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Fotos de {title}</DialogTitle>
          <div className="relative size-full">
            <Image
              src={images[index].url}
              alt={`${title}, foto ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-3 top-3 z-10 rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white hover:text-zinc-900"
                />
              }
            >
              <XIcon />
              <span className="sr-only">Cerrar</span>
            </DialogClose>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"
                >
                  <ChevronLeftIcon className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"
                >
                  <ChevronRightIcon className="size-6" />
                </button>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {index + 1} / {count}
                </span>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

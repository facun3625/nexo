"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, XIcon } from "lucide-react";

import type { AboutMediaItem } from "@/lib/about";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Cards todas del mismo tamaño (4:3) con la foto cubriéndolas (object-cover).
// Click → lightbox (foto entera) con la misma estética que la galería de
// propiedades (estate/media-carousel.tsx).
export function AboutGallery({ media }: { media: AboutMediaItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  function updateScrollState() {
    const track = trackRef.current;
    if (!track) return;
    setCanScroll({
      left: track.scrollLeft > 4,
      right: track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
    });
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [media.length]);

  function scrollByAmount(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  }

  function moveModal(direction: 1 | -1) {
    setSelectedIndex((current) =>
      current === null ? 0 : (current + direction + media.length) % media.length,
    );
  }

  useEffect(() => {
    if (selectedIndex === null || media.length < 2) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") moveModal(1);
      if (event.key === "ArrowLeft") moveModal(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // moveModal solo depende de media.length, que ya está en las deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, media.length]);

  if (!media.length) return null;
  const selected = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateScrollState}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((m, index) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setSelectedIndex(index)}
            className="group relative aspect-[4/3] w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-sm outline-none ring-primary transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 sm:w-[40%] lg:w-[calc((100%_-_2.25rem)/4)]"
          >
            {m.type === "IMAGE" ? (
              <Image
                src={m.url}
                alt={`Foto ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 78vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <>
                <video
                  src={m.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="pointer-events-none absolute inset-0 size-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                    <PlayIcon className="size-5 translate-x-px fill-current" />
                  </span>
                </span>
              </>
            )}
            <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.06]" />
            <span className="sr-only">Ampliar {m.type === "IMAGE" ? "foto" : "video"} {index + 1}</span>
          </button>
        ))}
      </div>

      {canScroll.left && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Anterior"
          className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
      )}
      {canScroll.right && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Siguiente"
          className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      )}

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent
          className="h-[min(86dvh,850px)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden bg-black p-0 duration-200 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-5xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Galería</DialogTitle>
          {selected && selectedIndex !== null && (
            <div className="relative size-full">
              {selected.type === "IMAGE" ? (
                <Image
                  src={selected.url}
                  alt={`Foto ampliada ${selectedIndex + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : (
                <video
                  key={selected.id}
                  src={selected.url}
                  controls
                  autoPlay
                  playsInline
                  className="size-full object-contain"
                />
              )}
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-3 right-3 z-10 rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white hover:text-zinc-900"
                  />
                }
              >
                <XIcon />
                <span className="sr-only">Cerrar</span>
              </DialogClose>
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => moveModal(-1)}
                    aria-label="Anterior"
                    className="absolute top-1/2 left-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"
                  >
                    <ChevronLeftIcon className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveModal(1)}
                    aria-label="Siguiente"
                    className="absolute top-1/2 right-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"
                  >
                    <ChevronRightIcon className="size-6" />
                  </button>
                  <span className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {selectedIndex + 1} / {media.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

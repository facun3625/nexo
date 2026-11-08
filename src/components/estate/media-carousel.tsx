"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string };

export function MediaCarousel({ images, title, desktopItems = 4 }: { images: GalleryImage[]; title: string; desktopItems?: 4 | 5 }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  if (!images.length) return null;

  function moveTrack(direction: -1 | 1) {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;
    if (!track || !firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    track.scrollBy({ left: direction * (firstCard.offsetWidth + gap), behavior: "smooth" });
  }

  function moveModal(direction: -1 | 1) {
    setSelectedIndex((current) => current === null ? 0 : (current + direction + images.length) % images.length);
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Galería</h2>
      <div className="relative">
        <div ref={trackRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((item, index) => (
            <button type="button" key={item.id} onClick={() => setSelectedIndex(index)} className={cn("group relative aspect-[4/3] w-[86%] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted text-left shadow-sm outline-none ring-primary transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 sm:w-[47%]", desktopItems === 5 ? "lg:w-[calc((100%_-_3rem)/5)]" : "lg:w-[calc((100%_-_2.25rem)/4)]")}>
              <Image src={item.url} alt={`${title}, imagen ${index + 1}`} fill loading={index < 4 ? "eager" : "lazy"} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 47vw, 78vw" className="object-cover" />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.03]" />
              <span className="sr-only">Ampliar imagen {index + 1}</span>
            </button>
          ))}
        </div>
        {images.length > 1 && <><button type="button" onClick={() => moveTrack(-1)} aria-label="Imagen anterior" className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background"><ChevronLeftIcon className="size-5" /></button><button type="button" onClick={() => moveTrack(1)} aria-label="Imagen siguiente" className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur hover:bg-background"><ChevronRightIcon className="size-5" /></button></>}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="h-[min(86dvh,850px)] max-w-[calc(100%-1rem)] gap-0 overflow-hidden bg-black p-0 duration-200 data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-5xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Galería de {title}</DialogTitle>
          {selectedIndex !== null && <div className="relative size-full"><Image src={images[selectedIndex].url} alt={`${title}, imagen ampliada ${selectedIndex + 1}`} fill sizes="100vw" className="object-contain" /><DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 z-10 rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white hover:text-zinc-900" />}><XIcon /><span className="sr-only">Cerrar</span></DialogClose>{images.length > 1 && <><button type="button" onClick={() => moveModal(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"><ChevronLeftIcon className="size-6" /></button><button type="button" onClick={() => moveModal(1)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg hover:bg-white"><ChevronRightIcon className="size-6" /></button></>}<span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">{selectedIndex + 1} / {images.length}</span></div>}
        </DialogContent>
      </Dialog>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CameraIcon, XIcon } from "lucide-react";

// Selector de fotos genérico para reclamos — junta los File en estado y los
// sincroniza a un <input type="file" multiple> vía DataTransfer, mismo
// truco que PropertyImagesManager, para que un <form action={...}> los
// mande como parte del FormData sin manejar el upload acá (eso lo hace la
// server action con saveUploadedFile).
export function PostSalePhotoPicker({ name = "photos" }: { name?: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function syncInput(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files, ...Array.from(list)];
    setFiles(next);
    syncInput(next);
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(next);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm">Fotos (opcional)</span>
      <div className="flex flex-wrap gap-2">
        {previews.map((src, i) => (
          <div key={src} className="group relative size-16 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-muted-foreground hover:text-destructive"
              aria-label="Quitar foto"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => document.getElementById(`${name}-picker`)?.click()}
          className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:bg-muted"
        >
          <CameraIcon className="size-4" />
          <span className="text-[10px]">Agregar</span>
        </button>
      </div>
      <input
        id={`${name}-picker`}
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}

"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ImageField({
  label,
  name,
  shape,
  preview,
  onPreviewChange,
  onRemove,
  heightPx = 64,
}: {
  label: string;
  name: string;
  shape: "circle" | "wide" | "logo";
  preview: string | null;
  onPreviewChange: (url: string) => void;
  onRemove?: () => void;
  heightPx?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [removePending, startRemoveTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onPreviewChange(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className={shape === "wide" ? "flex flex-col gap-2" : "flex items-center gap-3"}>
        <div
          className={
            shape === "circle"
              ? "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
              : shape === "logo"
                ? // Alto configurable (heightPx), ancho libre hasta un
                  // máximo proporcional — así un logo rectangular no queda
                  // forzado a un círculo ni recortado, se ve con la
                  // proporción real que subió el tenant.
                  "flex w-auto shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted p-1.5"
                : "flex aspect-[16/7] h-[200px] w-auto max-w-full items-center justify-center overflow-hidden rounded-xl bg-muted"
          }
          style={shape === "logo" ? { height: heightPx, maxWidth: heightPx * 3.5 } : undefined}
        >
          {preview && (
            <Image
              src={preview}
              alt={label}
              width={shape === "circle" ? 64 : shape === "logo" ? Math.round(heightPx * 3.5) : 400}
              height={shape === "circle" ? 64 : shape === "logo" ? heightPx : 175}
              className={shape === "wide" ? "size-full object-cover" : "size-full object-contain"}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {preview ? "Cambiar" : "Subir"}
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removePending}
              onClick={() => startRemoveTransition(onRemove)}
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        // macOS (Safari y Chrome) no considera el SVG dentro de "image/*" y
        // lo deja gris en el selector. El servidor ya lo acepta y lo
        // sanitiza (saveUploadedFile), así que se lo nombra explícitamente.
        accept="image/*,.svg,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

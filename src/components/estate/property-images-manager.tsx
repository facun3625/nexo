"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import {
  deleteEstatePropertyImage,
  reorderEstatePropertyImages,
} from "@/app/admin/gestion/actions";

type ExistingImage = { id: string; url: string };

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function syncFileInput(input: HTMLInputElement | null, files: File[]) {
  if (!input) return;
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  input.files = dt.files;
}

export function PropertyImagesManager({
  propertyId,
  images,
  onDirty,
}: {
  propertyId?: string;
  images: ExistingImage[];
  onDirty: () => void;
}) {
  const [items, setItems] = useState(images);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => pendingFiles.map((f) => URL.createObjectURL(f)),
    [pendingFiles],
  );
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  async function handleMove(index: number, direction: -1 | 1) {
    if (!propertyId) return;
    const reordered = move(items, index, index + direction);
    if (reordered === items) return;
    setItems(reordered);
    const result = await reorderEstatePropertyImages(
      propertyId,
      reordered.map((i) => i.id),
    );
    if ("error" in result) {
      toast.error(result.error);
      setItems(items);
    }
  }

  async function handleDelete(id: string) {
    if (!propertyId) return;
    setBusyId(id);
    const previous = items;
    setItems(items.filter((i) => i.id !== id));
    const result = await deleteEstatePropertyImage(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      setItems(previous);
    }
  }

  function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? []);
    if (!added.length) return;
    const merged = [...pendingFiles, ...added].slice(0, 10);
    setPendingFiles(merged);
    syncFileInput(inputRef.current, merged);
    onDirty();
  }

  function removePending(index: number) {
    const merged = pendingFiles.filter((_, i) => i !== index);
    setPendingFiles(merged);
    syncFileInput(inputRef.current, merged);
    onDirty();
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {items.map((img, i) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1">
                <div className="flex">
                  <button
                    type="button"
                    disabled={i === 0 || busyId === img.id}
                    onClick={() => handleMove(i, -1)}
                    aria-label="Mover antes"
                    className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronUpIcon className="size-4 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    disabled={i === items.length - 1 || busyId === img.id}
                    onClick={() => handleMove(i, 1)}
                    aria-label="Mover después"
                    className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                  >
                    <ChevronDownIcon className="size-4 -rotate-90" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busyId === img.id}
                  onClick={() => handleDelete(img.id)}
                  aria-label="Eliminar foto"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-30"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Portada
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((src, i) => (
            <div key={src} className="group relative overflow-hidden rounded-xl border border-dashed">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover opacity-80" />
              <button
                type="button"
                onClick={() => removePending(i)}
                aria-label="Quitar foto"
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary">
        <ImagePlusIcon className="size-4" />
        Agregar fotografías
        <input
          ref={inputRef}
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleAddFiles}
          className="hidden"
        />
      </label>
    </div>
  );
}

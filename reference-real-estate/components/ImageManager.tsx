"use client";

import { useRef, useState } from "react";
import { Plus, X, Star, Upload, Loader2, Link, GripVertical } from "lucide-react";

interface Props {
  images: string[];
  featuredIndex: number;
  onChange: (imgs: string[]) => void;
  onFeaturedChange: (idx: number) => void;
}

export default function ImageManager({ images, featuredIndex, onChange, onFeaturedChange }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    onChange([...images, url]);
    setUrlInput("");
  };

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) newUrls.push(data.url);
    }
    onChange([...images, ...newUrls]);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const remove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
    if (featuredIndex === idx) onFeaturedChange(0);
    else if (featuredIndex > idx) onFeaturedChange(featuredIndex - 1);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDropReorder = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    // Adjust featuredIndex to follow the starred image
    let newFeatured = featuredIndex;
    if (featuredIndex === dragIdx) {
      newFeatured = toIdx;
    } else if (dragIdx < featuredIndex && toIdx >= featuredIndex) {
      newFeatured = featuredIndex - 1;
    } else if (dragIdx > featuredIndex && toIdx <= featuredIndex) {
      newFeatured = featuredIndex + 1;
    }
    onChange(next);
    onFeaturedChange(newFeatured);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button type="button" onClick={() => setTab("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${tab === "upload" ? "bg-white text-[#111] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Upload size={11} /> Subir archivo
        </button>
        <button type="button" onClick={() => setTab("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${tab === "url" ? "bg-white text-[#111] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Link size={11} /> URL externa
        </button>
      </div>

      {tab === "upload" ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-brand-orange hover:bg-orange-50/30 transition-all"
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin text-brand-orange" />
              <p className="text-[12px] text-gray-400">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={20} className="text-gray-300" />
              <p className="text-[12px] text-gray-500">Arrastrá imágenes o <span className="text-brand-orange font-medium">hacé click para seleccionar</span></p>
              <p className="text-[11px] text-gray-400">JPG, PNG, WEBP — múltiples archivos</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange bg-white" />
          <button type="button" onClick={addUrl}
            className="flex items-center gap-1 px-3 py-2 bg-[#f4f4f5] hover:bg-gray-200 text-gray-600 text-[12px] font-medium rounded-lg transition-colors">
            <Plus size={12} /> Agregar
          </button>
        </div>
      )}

      {/* Gallery grid */}
      {images.length > 0 && (
        <>
          <p className="text-[11px] text-gray-400">Arrastrá las imágenes para reordenarlas</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, idx) => (
              <div
                key={url + idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDropReorder(e, idx)}
                onDragEnd={handleDragEnd}
                className="relative group rounded-lg overflow-hidden border-2 transition-all aspect-square cursor-grab active:cursor-grabbing"
                style={{
                  borderColor: dragOverIdx === idx && dragIdx !== idx
                    ? "#df691a"
                    : idx === featuredIndex
                    ? "#df691a"
                    : "transparent",
                  opacity: dragIdx === idx ? 0.4 : 1,
                }}
              >
                <img src={url} alt="" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/f4f4f5/999?text=Error"; }} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button type="button" onClick={() => onFeaturedChange(idx)} title="Imagen principal"
                    className={`p-1.5 rounded-full transition-colors ${idx === featuredIndex ? "bg-brand-orange text-white" : "bg-white/90 text-gray-600 hover:bg-brand-orange hover:text-white"}`}>
                    <Star size={11} fill={idx === featuredIndex ? "currentColor" : "none"} />
                  </button>
                  <button type="button" onClick={() => remove(idx)}
                    className="p-1.5 rounded-full bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white transition-colors">
                    <X size={11} />
                  </button>
                </div>
                {idx === featuredIndex && (
                  <div className="absolute top-1 left-1 bg-brand-orange text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star size={7} fill="currentColor" /> Principal
                  </div>
                )}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/70">
                  <GripVertical size={12} />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">{idx + 1}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

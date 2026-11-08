"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface Props {
  propertyId: string;
}

export default function FavoriteButton({ propertyId }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const favs: string[] = JSON.parse(localStorage.getItem("penalva_favs") || "[]");
    setSaved(favs.includes(propertyId));
  }, [propertyId]);

  const toggle = () => {
    const favs: string[] = JSON.parse(localStorage.getItem("penalva_favs") || "[]");
    const next = saved
      ? favs.filter((id) => id !== propertyId)
      : [...favs, propertyId];
    localStorage.setItem("penalva_favs", JSON.stringify(next));
    setSaved(!saved);
  };

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-[13px] font-medium transition-all ${
        saved
          ? "bg-red-50 border-red-200 text-red-500"
          : "bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"
      }`}
    >
      <Heart size={15} className={saved ? "fill-red-500 text-red-500" : ""} />
      {saved ? "Guardado en favoritos" : "Agregar a favoritos"}
    </button>
  );
}

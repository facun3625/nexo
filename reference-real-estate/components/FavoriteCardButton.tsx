"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function FavoriteCardButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const favs: string[] = JSON.parse(localStorage.getItem("penalva_favs") || "[]");
    setSaved(favs.includes(propertyId));
  }, [propertyId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs: string[] = JSON.parse(localStorage.getItem("penalva_favs") || "[]");
    const next = saved ? favs.filter((i) => i !== propertyId) : [...favs, propertyId];
    localStorage.setItem("penalva_favs", JSON.stringify(next));
    setSaved(!saved);
    window.dispatchEvent(new Event("favs-update"));
  };

  return (
    <button
      onClick={toggle}
      className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow transition-all opacity-0 group-hover:opacity-100 ${
        saved ? "bg-white" : "bg-white/90 hover:bg-white"
      }`}
    >
      <Heart size={13} className={saved ? "fill-red-500 text-red-500" : "text-gray-500"} />
    </button>
  );
}

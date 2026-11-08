"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function FavoritosNavButton({ mobile = false, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const [count, setCount] = useState(0);

  const load = () => {
    const ids: string[] = JSON.parse(localStorage.getItem("penalva_favs") || "[]");
    setCount(ids.length);
  };

  useEffect(() => {
    load();
    window.addEventListener("favs-update", load);
    return () => window.removeEventListener("favs-update", load);
  }, []);

  if (mobile) {
    return (
      <a
        href="/favoritos"
        onClick={onClick}
        className="px-6 py-4 text-[14px] font-medium text-white/80 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"
      >
        <Heart size={14} />
        Mis favoritos
        {count > 0 && (
          <span className="ml-auto bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {count}
          </span>
        )}
      </a>
    );
  }

  return (
    <a
      href="/favoritos"
      className="relative flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white transition-colors text-[13px] font-medium"
      title="Mis favoritos"
    >
      <Heart size={14} />
      Favoritos
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-white text-brand-orange text-[9px] font-bold px-1 py-px rounded-full min-w-[16px] text-center leading-tight">
          {count}
        </span>
      )}
    </a>
  );
}

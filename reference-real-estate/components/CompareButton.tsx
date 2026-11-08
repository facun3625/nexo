"use client";

import { useEffect, useState } from "react";
import { GitCompare } from "lucide-react";

const MAX = 3;
const KEY = "penalva_compare";

export default function CompareButton({ propertyId, compact }: { propertyId: string; compact?: boolean }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    setAdded(ids.includes(propertyId));
  }, [propertyId]);

  const toggle = () => {
    const ids: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (added) {
      const next = ids.filter((i) => i !== propertyId);
      localStorage.setItem(KEY, JSON.stringify(next));
      setAdded(false);
      window.dispatchEvent(new Event("compare-update"));
    } else {
      if (ids.length >= MAX) return;
      const next = [...ids, propertyId];
      localStorage.setItem(KEY, JSON.stringify(next));
      setAdded(true);
      window.dispatchEvent(new Event("compare-update"));
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={added ? "Quitar de comparación" : "Agregar a comparar"}
        className={`p-2 rounded-full shadow transition-all ${
          added
            ? "bg-[#262522] text-white"
            : "bg-white/90 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        }`}
      >
        <GitCompare size={13} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-[13px] font-medium transition-all ${
        added
          ? "bg-[#262522] border-[#262522] text-white"
          : "bg-white border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
      }`}
    >
      <GitCompare size={15} />
      {added ? "En comparación" : "Agregar a comparar"}
    </button>
  );
}

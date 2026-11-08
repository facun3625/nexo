"use client";

import { useEffect, useState } from "react";
import { X, GitCompare, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CompareBar({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<Record<string, { title: string; imageUrl?: string | null }>>({});
  const [open, setOpen] = useState(false);

  const load = () => {
    const stored: string[] = JSON.parse(localStorage.getItem("penalva_compare") || "[]");
    setIds(stored);
    if (stored.length > 0) {
      fetch(`/api/properties?ids=${stored.join(",")}`)
        .then((r) => r.json())
        .then((data: any[]) => {
          const map: Record<string, any> = {};
          data.forEach((p) => { map[p.id] = p; });
          setProperties(map);
        });
    } else {
      setProperties({});
      setOpen(false);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener("compare-update", load);
    return () => window.removeEventListener("compare-update", load);
  }, []);

  const remove = (id: string) => {
    const next = ids.filter((i) => i !== id);
    localStorage.setItem("penalva_compare", JSON.stringify(next));
    window.dispatchEvent(new Event("compare-update"));
  };

  const clear = () => {
    localStorage.setItem("penalva_compare", "[]");
    window.dispatchEvent(new Event("compare-update"));
  };

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">

      {/* Panel expandido */}
      {open && (
        <div
          className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ width: 260, background: "#1a1816", border: "1px solid #2e2c2a" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #2e2c2a" }}>
            <div className="flex items-center gap-2">
              <GitCompare size={14} className="text-brand-orange" />
              <span className="text-white text-[12px] font-bold uppercase tracking-wider">Comparar</span>
              <span className="text-white/30 text-[11px]">{ids.length}/3</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Items */}
          <div className="px-3 py-3 flex flex-col gap-2">
            {ids.map((id) => {
              const p = properties[id];
              return (
                <div key={id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: "#2e2c2a" }}>
                  {p?.imageUrl
                    ? <img src={p.imageUrl} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" />
                    : <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: "#3a3836" }} />
                  }
                  <span className="text-white/80 text-[12px] flex-1 truncate leading-tight">{p?.title ?? "Cargando..."}</span>
                  <button onClick={() => remove(id)} className="text-white/25 hover:text-white/60 transition-colors shrink-0">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            {ids.length < 3 && (
              <div className="flex items-center justify-center rounded-xl py-2 text-white/20 text-[12px] border border-dashed"
                style={{ borderColor: "#3a3836" }}>
                + Agregar otra
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-3 pb-3 flex flex-col gap-2">
            {ids.length >= 2 && (
              <button
                onClick={() => router.push(`/comparar?ids=${ids.join(",")}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-[12px] font-bold uppercase tracking-wider transition-colors hover:bg-orange-700"
                style={{ background: "#df691a" }}
              >
                Comparar ahora <ArrowRight size={13} />
              </button>
            )}
            <button onClick={clear} className="text-white/25 hover:text-white/50 text-[11px] text-center transition-colors">
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full shadow-lg transition-all hover:scale-105 pl-3 pr-4"
        style={{ background: "#262522", border: "1px solid #3a3836", height: 48 }}
      >
        <div className="relative">
          <GitCompare size={16} className="text-brand-orange" />
          <span
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: "#df691a" }}
          >
            {ids.length}
          </span>
        </div>
        <span className="text-white text-[12px] font-semibold">Comparar</span>
      </button>

    </div>
  );
}

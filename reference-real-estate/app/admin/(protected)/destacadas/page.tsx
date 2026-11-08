"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, ArrowUp, ArrowDown, X, Plus, Loader2, Search } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

interface Property {
  id: string;
  title: string;
  imageUrl?: string | null;
  type: string;
  propertyType: string;
  city: string;
  price: number;
  currency?: string;
  pricePerMonth?: boolean;
  featured: boolean;
  featuredOrder?: number | null;
  published: boolean;
}

const MAX = 6;

export default function DestacadasPage() {
  const [all, setAll] = useState<Property[]>([]);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/featured")
      .then((r) => r.json())
      .then((data: Property[]) => {
        const feat = data
          .filter((p) => p.featured)
          .sort((a, b) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99));
        setFeatured(feat);
        setAll(data);
        setLoading(false);
      });
  }, []);

  const nonFeatured = all
    .filter((p) => !featured.find((f) => f.id === p.id))
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()));

  const move = useCallback((index: number, dir: -1 | 1) => {
    setFeatured((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
    setDirty(true);
  }, []);

  const add = useCallback((p: Property) => {
    if (featured.length >= MAX) return;
    setFeatured((prev) => [...prev, p]);
    setDirty(true);
  }, [featured.length]);

  const remove = useCallback((id: string) => {
    setFeatured((prev) => prev.filter((p) => p.id !== id));
    setDirty(true);
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch("/api/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: featured.map((p) => p.id) }),
    });
    setSaving(false);
    setDirty(false);
    // Sync all state
    setAll((prev) =>
      prev.map((p) => {
        const idx = featured.findIndex((f) => f.id === p.id);
        return { ...p, featured: idx !== -1, featuredOrder: idx !== -1 ? idx : null };
      })
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Propiedades destacadas</h1>
          <p className="text-gray-400 text-[13px] mt-0.5">
            Máximo {MAX} destacadas — se muestran en este orden en el home
          </p>
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-[13px] px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          {saving ? "Guardando..." : "Guardar orden"}
        </button>
      </div>

      {/* Featured list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
            Destacadas en el home
          </h2>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${featured.length >= MAX ? "bg-red-50 text-red-400" : "bg-orange-50 text-brand-orange"}`}>
            {featured.length} / {MAX}
          </span>
        </div>

        {featured.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-300 text-[13px]">
            No hay propiedades destacadas aún
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {featured.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Orden */}
                <span className="w-5 text-center text-[11px] font-bold text-gray-300 shrink-0">{i + 1}</span>

                {/* Imagen */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase text-brand-orange">{p.type}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{p.city}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] font-semibold text-brand-orange">
                      {formatPrice(p.price, p.currency, p.pricePerMonth)}
                    </span>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors" title="Subir">
                    <ArrowUp size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === featured.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors" title="Bajar">
                    <ArrowDown size={14} className="text-gray-400" />
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors ml-1" title="Quitar">
                    <X size={14} className="text-gray-300 hover:text-red-400" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Non-featured list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-300 shrink-0">
            Otras propiedades
          </h2>
          <div className="relative max-w-xs w-full">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>
        </div>
        {nonFeatured.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-300 text-[13px]">
            Todas las propiedades están destacadas
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {nonFeatured.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase text-brand-orange">{p.type}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{p.city}</span>
                  </div>
                </div>
                <button
                  onClick={() => add(p)}
                  disabled={featured.length >= MAX}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-500 hover:border-brand-orange hover:text-brand-orange disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Plus size={12} />
                  Destacar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

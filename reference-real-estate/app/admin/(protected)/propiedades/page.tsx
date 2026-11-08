"use client";

import { useEffect, useState } from "react";
import { Building2, Eye, EyeOff, Pencil, Trash2, MapPin, Loader2, Plus, Search, Star, X } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterPropertyType, setFilterPropertyType] = useState("");
  const [filterPublished, setFilterPublished] = useState("");

  const load = () => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => { setProperties(data); setLoading(false); });
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/operations").then((r) => r.json()),
      fetch("/api/cities").then((r) => r.json()),
      fetch("/api/property-types").then((r) => r.json()),
    ]).then(([ops, cits, pts]) => { setOperations(ops); setCities(cits); setPropertyTypes(pts); });
    load();
  }, []);

  const togglePublished = async (id: string, current: boolean) => {
    await fetch(`/api/properties/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !current }),
    });
    load();
  };

  const deleteProperty = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = properties.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.address?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && p.type !== filterType) return false;
    if (filterCity && p.city !== filterCity) return false;
    if (filterPropertyType && p.propertyType !== filterPropertyType) return false;
    if (filterPublished === "published" && !p.published) return false;
    if (filterPublished === "unpublished" && p.published) return false;
    return true;
  });

  const hasFilters = search || filterType || filterCity || filterPropertyType || filterPublished;
  const clearFilters = () => { setSearch(""); setFilterType(""); setFilterCity(""); setFilterPropertyType(""); setFilterPublished(""); };

  const sel = "px-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange bg-white text-gray-600 appearance-none cursor-pointer";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Propiedades</h1>
          <p className="text-gray-400 text-[13px] mt-0.5">
            {filtered.length} {filtered.length !== properties.length ? `de ${properties.length}` : ""} inmuebles
          </p>
        </div>
        <a href="/admin/nueva" className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 text-white font-semibold text-[13px] px-5 py-2.5 rounded-lg transition-colors">
          <Plus size={14} /> Nueva propiedad
        </a>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o dirección..."
              className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange bg-white" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={sel}>
            <option value="">Operación</option>
            {operations.map((op) => <option key={op.id} value={op.name}>{op.name}</option>)}
          </select>
          <select value={filterPropertyType} onChange={(e) => setFilterPropertyType(e.target.value)} className={sel}>
            <option value="">Tipo</option>
            {propertyTypes.map((pt) => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
          </select>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className={sel}>
            <option value="">Ciudad</option>
            {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={filterPublished} onChange={(e) => setFilterPublished(e.target.value)} className={sel}>
            <option value="">Estado</option>
            <option value="published">Publicadas</option>
            <option value="unpublished">No publicadas</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-2 py-2">
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-300 text-[13px]">Sin resultados</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">Propiedad</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 py-3">Operación</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 py-3 hidden lg:table-cell">Tipo</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 py-3">Precio</th>
                <th className="text-center text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 py-3">Estado</th>
                <th className="text-right text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-5 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#f4f4f5]">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <Building2 size={14} className="text-gray-400 m-auto mt-2.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-medium text-[#111] line-clamp-1">{p.title}</p>
                          {p.featured && <Star size={10} className="text-brand-orange shrink-0" fill="currentColor" />}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPin size={9} /><span>{p.city}</span>
                          {p.propertyType && <><span>·</span><span>{p.propertyType}</span></>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-1 rounded ${p.type === "Venta" ? "bg-blue-50 text-blue-500" : p.type === "Alquiler" ? "bg-emerald-50 text-emerald-500" : "bg-gray-100 text-gray-500"}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <span className="text-[12px] text-gray-500">{p.propertyType || "—"}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="text-[13px] font-semibold text-brand-orange">{formatPrice(p.price, p.currency, p.pricePerMonth)}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <button onClick={() => togglePublished(p.id, p.published ?? true)}
                      title={p.published ?? true ? "Click para ocultar" : "Click para publicar"}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide border transition-all cursor-pointer shadow-sm ${(p.published ?? true) ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
                      {(p.published ?? true) ? <Eye size={12} /> : <EyeOff size={12} />}
                      {(p.published ?? true) ? "Publicada" : "Oculta"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/propiedad/${p.id}`} target="_blank" className="p-1.5 text-gray-400 hover:text-brand-orange transition-colors rounded-lg hover:bg-gray-100" title="Ver en sitio">
                        <Eye size={14} />
                      </a>
                      <a href={`/admin/propiedades/${p.id}`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100" title="Editar">
                        <Pencil size={14} />
                      </a>
                      <button onClick={() => deleteProperty(p.id, p.title)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

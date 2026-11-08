"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, MapPin, Loader2, Star } from "lucide-react";
import ImageManager from "@/components/ImageManager";
import VideoInput from "@/components/VideoInput";

function PillSelector({ label, options, value, onChange }: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt.id} type="button" onClick={() => onChange(opt.name)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer ${
              value === opt.name
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-white text-gray-500 border-gray-200 hover:border-brand-orange hover:text-brand-orange"
            }`}>
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumSelect({ label, value, onChange, max = 8 }: {
  label: string; value: string; onChange: (v: string) => void; max?: number;
}) {
  const opts = [
    { v: "", l: "—" },
    ...Array.from({ length: max }, (_, i) => ({ v: String(i + 1), l: String(i + 1) })),
    { v: String(max + 1), l: `${max + 1}+` },
  ];
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((opt) => (
          <button key={opt.v} type="button" onClick={() => onChange(opt.v)}
            className={`w-10 py-1.5 rounded-lg text-[12px] font-medium border transition-all cursor-pointer text-center ${
              value === opt.v
                ? "bg-brand-orange text-white border-brand-orange"
                : "bg-white text-gray-500 border-gray-200 hover:border-brand-orange hover:text-brand-orange"
            }`}>
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}


export default function NuevaPropiedadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [operations, setOperations] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "", description: "", price: "",
    address: "", city: "", lat: "" as string | number, lng: "" as string | number,
    type: "", propertyType: "",
    bedrooms: "", bathrooms: "",
    hasGarage: false, garages: "",
    coveredArea: "", totalArea: "",
    videoUrl: "", featured: false,
    currency: "USD", pricePerMonth: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/operations").then((r) => r.json()),
      fetch("/api/cities").then((r) => r.json()),
      fetch("/api/property-types").then((r) => r.json()),
    ]).then(([ops, cits, pts]) => {
      setOperations(ops); setCities(cits); setPropertyTypes(pts);
      setFormData((p) => ({
        ...p,
        type: p.type || (ops[0]?.name ?? ""),
        city: p.city || (cits[0]?.name ?? ""),
        propertyType: p.propertyType || (pts[0]?.name ?? ""),
      }));
    });
  }, []);

  const searchAddress = async (query: string) => {
    if (query.length < 3) { setSuggestions([]); return; }
    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${query}, Santa Fe, Argentina`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=8&addressdetails=1&countrycodes=ar`, { headers: { "User-Agent": "PenalvaInmobiliaria/1.0" } });
      setSuggestions(await res.json()); setShowSuggestions(true);
    } catch { } finally { setIsSearching(false); }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((p) => ({ ...p, address: value }));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchAddress(value), 600);
  };

  const selectSuggestion = (sug: any) => {
    const addr = sug.address;
    const street = addr.road || addr.pedestrian || addr.suburb || sug.display_name.split(",")[0];
    setFormData((p) => ({ ...p, address: `${street} ${addr.house_number || ""}`.trim(), city: addr.city || addr.town || addr.village || p.city, lat: sug.lat, lng: sug.lon }));
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) { alert("Seleccioná una ubicación del autocomplete."); return; }
    const imageUrl = images[featuredIndex] || images[0] || "";
    const extraImages = images.filter((_, i) => i !== featuredIndex);
    setLoading(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl, images: extraImages.length ? JSON.stringify(extraImages) : null }),
      });
      if (res.ok) { router.push("/admin/propiedades"); router.refresh(); }
      else alert("Error al crear la propiedad");
    } catch { alert("Error de conexión"); } finally { setLoading(false); }
  };

  const f = "w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors bg-white";
  const card = "bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4";
  const sectionTitle = "text-[10px] font-bold uppercase tracking-widest text-gray-300";

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Nueva propiedad</h1>
          <p className="text-gray-400 text-[13px] mt-0.5">Completá los datos para publicar un nuevo inmueble</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/propiedades" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-500 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </a>
          <button type="submit" form="property-form" disabled={loading}
            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold text-[13px] px-5 py-2.5 rounded-lg transition-colors">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {loading ? "Publicando..." : "Publicar propiedad"}
          </button>
        </div>
      </div>

      <form id="property-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[1fr_320px] gap-5 items-start">

          {/* ── Columna izquierda ── */}
          <div className="space-y-5">

            {/* Info básica */}
            <div className={card}>
              <h2 className={sectionTitle}>Información básica</h2>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Título</label>
                <input required name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Casa con jardín en Santa Fe" className={f} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Descripción</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Describe las características principales..." className={`${f} resize-none`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Precio</label>
                <div className="flex gap-2">
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[12px] font-semibold shrink-0">
                    {(["USD", "ARS", "CONSULTAR"] as const).map((cur) => (
                      <button key={cur} type="button" onClick={() => setFormData((p) => ({ ...p, currency: cur }))}
                        className={`px-3 py-2 transition-colors ${formData.currency === cur ? "bg-brand-orange text-white" : "bg-white text-gray-400 hover:text-brand-orange"}`}>
                        {cur === "CONSULTAR" ? "Consultar" : cur}
                      </button>
                    ))}
                  </div>
                  {formData.currency !== "CONSULTAR" && (
                    <input required type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Ej: 150000" className={f} />
                  )}
                </div>
                {formData.currency !== "CONSULTAR" && (
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, pricePerMonth: !p.pricePerMonth }))}
                    className={`flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all ${formData.pricePerMonth ? "border-brand-orange bg-orange-50 text-brand-orange" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"}`}>
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${formData.pricePerMonth ? "bg-brand-orange border-brand-orange" : "border-gray-300"}`}>
                      {formData.pricePerMonth && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
                    </div>
                    Precio por mes
                  </button>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={sectionTitle}>Ubicación</h2>
                <button 
                  type="button" 
                  onClick={() => setShowManualCoords(!showManualCoords)}
                  className="text-[10px] text-brand-orange hover:underline uppercase tracking-widest font-bold"
                >
                  {showManualCoords ? "Usar buscador" : "Ingresar coordenadas manual"}
                </button>
              </div>

              {!showManualCoords ? (
                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dirección</label>
                    {isSearching && <Loader2 size={11} className="animate-spin text-brand-orange" />}
                  </div>
                  <div className="relative">
                    <input required name="address" value={formData.address} onChange={handleAddressChange} placeholder="Ej: San Martín 2500" className={f} autoComplete="off" />
                    <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-xl rounded-lg mt-1 max-h-48 overflow-y-auto">
                      {suggestions.map((sug, idx) => (
                        <div key={idx} onMouseDown={(e) => { e.preventDefault(); selectSuggestion(sug); }} className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 text-[12px]">
                          <p className="font-medium text-[#111]">{sug.address.road || sug.display_name.split(",")[0]} {sug.address.house_number || ""}</p>
                          <p className="text-[11px] text-gray-400 truncate">{sug.display_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.lat && formData.lng && (
                    <p className="text-[11px] text-green-500 flex items-center gap-1 mt-2">
                      <MapPin size={10} /> Ubicación confirmada: {Number(formData.lat).toFixed(5)}, {Number(formData.lng).toFixed(5)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dirección / Referencia</label>
                    <input required name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Ruta 1 Km 15" className={f} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Latitud</label>
                      <input required type="number" step="any" name="lat" value={formData.lat} onChange={handleChange} placeholder="-31.6333" className={f} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Longitud</label>
                      <input required type="number" step="any" name="lng" value={formData.lng} onChange={handleChange} placeholder="-60.7000" className={f} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    Podés obtener estas coordenadas desde Google Maps (click derecho en el mapa).
                  </p>
                </div>
              )}
            </div>

            {/* Imágenes */}
            <div className={card}>
              <h2 className={sectionTitle}>Galería de imágenes</h2>
              <p className="text-[11px] text-gray-400">La imagen ⭐ será la principal.</p>
              <ImageManager images={images} featuredIndex={featuredIndex} onChange={setImages} onFeaturedChange={setFeaturedIndex} />
            </div>

            {/* Video */}
            <div className={card}>
              <h2 className={sectionTitle}>Video (opcional)</h2>
              <VideoInput value={formData.videoUrl} onChange={(v) => setFormData((p) => ({ ...p, videoUrl: v }))} />
            </div>

          </div>

          {/* ── Columna derecha ── */}
          <div className="space-y-5 sticky top-6">

            {/* Destacada */}
            <button type="button" onClick={() => setFormData((p) => ({ ...p, featured: !p.featured }))}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${formData.featured ? "border-brand-orange bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <Star size={15} className={formData.featured ? "text-brand-orange" : "text-gray-300"} fill={formData.featured ? "currentColor" : "none"} />
              <div className="text-left">
                <p className={`text-[13px] font-semibold ${formData.featured ? "text-brand-orange" : "text-gray-500"}`}>
                  {formData.featured ? "Propiedad destacada" : "Marcar como destacada"}
                </p>
                <p className="text-[11px] text-gray-400">Aparece primero en el listado</p>
              </div>
            </button>

            {/* Categorías */}
            <div className={card}>
              <h2 className={sectionTitle}>Categorías</h2>
              <PillSelector label="Operación" options={operations} value={formData.type} onChange={(v) => setFormData((p) => ({ ...p, type: v }))} />
              <PillSelector label="Tipo" options={propertyTypes} value={formData.propertyType} onChange={(v) => setFormData((p) => ({ ...p, propertyType: v }))} />
              <PillSelector label="Ciudad" options={cities} value={formData.city} onChange={(v) => setFormData((p) => ({ ...p, city: v }))} />
            </div>

            {/* Características */}
            <div className={card}>
              <h2 className={sectionTitle}>Características</h2>
              <NumSelect label="Dormitorios" value={formData.bedrooms} onChange={(v) => setFormData((p) => ({ ...p, bedrooms: v }))} max={6} />
              <NumSelect label="Baños" value={formData.bathrooms} onChange={(v) => setFormData((p) => ({ ...p, bathrooms: v }))} max={4} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sup. cubierta</label>
                  <div className="relative">
                    <input type="number" name="coveredArea" value={formData.coveredArea} onChange={handleChange} placeholder="0" className={f + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">m²</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Sup. total</label>
                  <div className="relative">
                    <input type="number" name="totalArea" value={formData.totalArea} onChange={handleChange} placeholder="0" className={f + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">m²</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setFormData((p) => ({ ...p, hasGarage: !p.hasGarage, garages: p.hasGarage ? "" : p.garages }))}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition-all text-[13px] ${formData.hasGarage ? "border-brand-orange bg-orange-50 text-brand-orange" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${formData.hasGarage ? "bg-brand-orange border-brand-orange" : "border-gray-300"}`}>
                  {formData.hasGarage && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                </div>
                <span className="font-medium">Cochera</span>
                {formData.hasGarage && (
                  <input type="number" name="garages" value={formData.garages} onChange={handleChange}
                    onClick={(e) => e.stopPropagation()} placeholder="Cant." className="ml-auto w-16 px-2 py-1 text-[12px] border border-gray-200 rounded focus:outline-none focus:border-brand-orange bg-white text-gray-600" />
                )}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}

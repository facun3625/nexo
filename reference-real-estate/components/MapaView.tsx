"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";

const MapLoader = dynamic(() => import("@/components/MapLoader"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Cargando mapa...
    </div>
  ),
});

interface Props {
  properties: any[];
  operations: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  propertyTypes: { id: string; name: string }[];
  initial?: {
    ciudad?: string;
    tipo?: string;
    operacion?: string;
    dormitorios?: string;
  };
}

export default function MapaView({ properties, operations, cities, propertyTypes, initial = {} }: Props) {
  const router = useRouter();
  const [ciudad, setCiudad] = useState(initial.ciudad ?? "");
  const [tipo, setTipo] = useState(initial.tipo ?? "");
  const [operacion, setOperacion] = useState(initial.operacion ?? "");
  const [dormitorios, setDormitorios] = useState(initial.dormitorios ?? "");

  const sel = "w-full h-full px-3 py-3 text-[13px] text-gray-600 appearance-none bg-transparent focus:outline-none cursor-pointer";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ciudad) params.set("ciudad", ciudad);
    if (tipo) params.set("tipo", tipo);
    if (operacion) params.set("operacion", operacion);
    if (dormitorios) params.set("dormitorios", dormitorios);
    router.push(`/mapa?${params.toString()}`);
  }

  const withCoords = properties.filter((p) => p.lat && p.lng);
  const hasFilters = !!(ciudad || tipo || operacion || dormitorios);

  return (
    <div className="flex flex-col flex-1">

      {/* Barra buscador */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-5">
        <form onSubmit={handleSubmit} className="flex items-stretch gap-0 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-4xl mx-auto">
          <div className="relative flex-1 border-r border-gray-200">
            <select className={sel} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
              <option value="">Ubicación</option>
              {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 border-r border-gray-200">
            <select className={sel} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Propiedad</option>
              {propertyTypes.map((pt) => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 border-r border-gray-200">
            <select className={sel} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
              <option value="">Operación</option>
              {operations.map((op) => <option key={op.id} value={op.name}>{op.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative flex-1 border-r border-gray-200">
            <select className={sel} value={dormitorios} onChange={(e) => setDormitorios(e.target.value)}>
              <option value="">Dormitorios</option>
              <option value="1">1 dormitorio</option>
              <option value="2">2 dormitorios</option>
              <option value="3">3 dormitorios</option>
              <option value="4">4 dormitorios</option>
              <option value="5">5+ dormitorios</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button type="submit" className="bg-brand-orange text-white px-6 text-[13px] font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 shrink-0">
            <Search size={14} />
            Buscar
          </button>
        </form>

        {/* Contador + limpiar */}
        <div className="flex items-center gap-3 mt-3 max-w-4xl mx-auto">
          <SlidersHorizontal size={13} className="text-brand-orange" />
          <span className="text-[12px] text-gray-500">
            {withCoords.length === 0
              ? "Sin propiedades con ubicación"
              : `${withCoords.length} propiedad${withCoords.length !== 1 ? "es" : ""} en el mapa`}
            {properties.length !== withCoords.length && properties.length > 0 && (
              <span className="text-gray-400"> · {properties.length - withCoords.length} sin coordenadas</span>
            )}
          </span>
          {hasFilters && (
            <a href="/mapa" className="text-[12px] text-brand-orange hover:underline">Limpiar filtros</a>
          )}
        </div>
      </div>

      {/* Mapa full */}
      <div className="h-[70vh] min-h-[500px] isolate">
        <MapLoader properties={properties} fullHeight />
      </div>
    </div>
  );
}

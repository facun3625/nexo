"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
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

export default function SearchForm({ operations, cities, propertyTypes, initial = {} }: Props) {
  const router = useRouter();
  const [ciudad, setCiudad] = useState(initial.ciudad ?? "");
  const [tipo, setTipo] = useState(initial.tipo ?? "");
  const [operacion, setOperacion] = useState(initial.operacion ?? "");
  const [dormitorios, setDormitorios] = useState(initial.dormitorios ?? "");

  const sel = "w-full h-full px-3 py-3.5 text-[13px] text-gray-600 appearance-none bg-transparent focus:outline-none cursor-pointer";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (ciudad) params.set("ciudad", ciudad);
    if (tipo) params.set("tipo", tipo);
    if (operacion) params.set("operacion", operacion);
    if (dormitorios) params.set("dormitorios", dormitorios);
    router.push(`/propiedades?${params.toString()}`);
  }

  const selMobile = "w-full px-3 py-3 text-[13px] text-gray-600 appearance-none bg-white focus:outline-none cursor-pointer border border-gray-200 rounded-lg";

  return (
    <>
      {/* Mobile: stacked */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <select className={selMobile} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            <option value="">Ubicación</option>
            {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className={selMobile} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Propiedad</option>
            {propertyTypes.map((pt) => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className={selMobile} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
            <option value="">Operación</option>
            {operations.map((op) => <option key={op.id} value={op.name}>{op.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select className={selMobile} value={dormitorios} onChange={(e) => setDormitorios(e.target.value)}>
            <option value="">Dormitorios</option>
            <option value="1">1 dormitorio</option>
            <option value="2">2 dormitorios</option>
            <option value="3">3 dormitorios</option>
            <option value="4">4 dormitorios</option>
            <option value="5">5+ dormitorios</option>
          </select>
          <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button type="submit" className="bg-brand-orange text-white py-3 text-[13px] font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 rounded-lg">
          <Search size={14} />Buscar
        </button>
      </form>

      {/* Desktop: horizontal */}
      <form onSubmit={handleSubmit} className="hidden md:flex items-stretch bg-white shadow-md overflow-hidden border border-gray-200">
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
        <button type="submit" className="bg-brand-orange text-white px-6 text-[13px] font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 cursor-pointer shrink-0">
          <Search size={14} />Buscar
        </button>
      </form>
    </>
  );
}

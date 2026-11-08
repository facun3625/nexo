"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

interface Props {
  operations: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  propertyTypes: { id: string; name: string }[];
}

export default function PropertySearchSidebar({ operations, cities, propertyTypes }: Props) {
  const router = useRouter();
  const [operacion, setOperacion] = useState("");
  const [tipo, setTipo] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [dormitorios, setDormitorios] = useState("");

  const sel = "w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange appearance-none bg-white text-gray-500";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (operacion) params.set("operacion", operacion);
    if (tipo) params.set("tipo", tipo);
    if (ciudad) params.set("ciudad", ciudad);
    if (dormitorios) params.set("dormitorios", dormitorios);
    router.push(`/propiedades?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select className={sel} value={operacion} onChange={(e) => setOperacion(e.target.value)}>
        <option value="">Operación</option>
        {operations.map((op) => <option key={op.id} value={op.name}>{op.name}</option>)}
      </select>
      <select className={sel} value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="">Tipo de propiedad</option>
        {propertyTypes.map((pt) => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
      </select>
      <select className={sel} value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
        <option value="">Ciudad</option>
        {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <select className={sel} value={dormitorios} onChange={(e) => setDormitorios(e.target.value)}>
        <option value="">Dormitorios</option>
        <option value="1">1 dormitorio</option>
        <option value="2">2 dormitorios</option>
        <option value="3">3 dormitorios</option>
        <option value="4">4 dormitorios</option>
        <option value="5">5+ dormitorios</option>
      </select>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 w-full bg-brand-orange hover:bg-orange-700 text-white text-[12px] font-semibold uppercase tracking-wider py-2.5 rounded-lg transition-colors"
      >
        <Search size={13} />
        Buscar
      </button>
    </form>
  );
}

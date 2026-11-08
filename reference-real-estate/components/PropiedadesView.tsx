"use client";

import { useState, useEffect } from "react";
import { MapPin, LayoutGrid, Map, Bed, Bath, Car, SlidersHorizontal, GitCompare, Heart } from "lucide-react";
import MapLoader from "@/components/MapLoader";
import CompareBar from "@/components/CompareBar";
import FavoriteCardButton from "@/components/FavoriteCardButton";
import AlertSubscribeForm from "@/components/AlertSubscribeForm";
import { formatPrice } from "@/lib/formatPrice";

interface Property {
  id: string;
  title: string;
  price: number;
  currency?: string;
  pricePerMonth?: boolean;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  imageUrl?: string | null;
  type: string;
  typeColor?: string;
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  hasGarage?: boolean;
  garages?: number | null;
}

interface Props {
  properties: Property[];
  hasFilters: boolean;
  filters?: { ciudad?: string; tipo?: string; operacion?: string; dormitorios?: string };
}

export default function PropiedadesView({ properties, hasFilters, filters }: Props) {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <>
      {/* Header resultados */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={15} className="text-brand-orange" />
          <span className="text-[13px] text-gray-500">
            {properties.length === 0
              ? "Sin resultados"
              : `${properties.length} propiedad${properties.length !== 1 ? "es" : ""} encontrada${properties.length !== 1 ? "s" : ""}`}
          </span>
          {hasFilters && (
            <a href="/propiedades" className="text-[12px] text-brand-orange hover:underline ml-2">
              Limpiar filtros
            </a>
          )}
        </div>

        {/* Toggle vista */}
        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold transition-colors ${
              view === "grid"
                ? "bg-brand-orange text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid size={13} />
            Lista
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold transition-colors ${
              view === "map"
                ? "bg-brand-orange text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Map size={13} />
            Mapa
          </button>
        </div>
      </div>

      {/* Vista mapa */}
      {view === "map" && (
        <div className="relative isolate rounded-xl overflow-hidden shadow-sm border border-gray-200">
          {properties.filter((p) => p.lat && p.lng).length === 0 ? (
            <div className="h-[500px] bg-white flex flex-col items-center justify-center gap-3 text-gray-400">
              <MapPin size={32} className="opacity-30" />
              <p className="text-sm">Ninguna propiedad del filtro tiene coordenadas cargadas.</p>
            </div>
          ) : (
            <MapLoader properties={properties} />
          )}
        </div>
      )}

      {/* Vista grilla */}
      {view === "grid" && (
        <>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <a
                    href={`/propiedad/${property.id}`}
                    className="group block"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={property.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-white text-[#111] text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm">
                          Ver propiedad
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded" style={{ background: property.typeColor ?? "#df691a" }}>
                          {property.type}
                        </span>
                      </div>
                      <FavoriteCardButton propertyId={property.id} />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="text-brand-orange font-bold text-xl">
                          {formatPrice(property.price, property.currency, property.pricePerMonth)}
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {property.propertyType}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#111] text-[15px] mb-1.5 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <MapPin size={11} />
                        <span className="truncate">{property.city}, {property.address}</span>
                      </div>
                      {(property.bedrooms != null || property.bathrooms != null || property.hasGarage) && (
                        <div className="flex items-center gap-3 text-gray-400 text-xs mt-3 pt-3 border-t border-gray-100">
                          {property.bedrooms != null && (
                            <span className="flex items-center gap-1"><Bed size={12} />{property.bedrooms} dorm.</span>
                          )}
                          {property.bathrooms != null && (
                            <span className="flex items-center gap-1"><Bath size={12} />{property.bathrooms} baño{property.bathrooms !== 1 ? "s" : ""}</span>
                          )}
                          {property.hasGarage && (
                            <span className="flex items-center gap-1"><Car size={12} />Cochera{property.garages && property.garages > 1 ? ` x${property.garages}` : ""}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </a>
                  <div className="px-5 pb-4">
                    <CompareCardButton propertyId={property.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl bg-white">
              <p className="text-gray-400 text-sm mb-2">No se encontraron propiedades con esos filtros.</p>
              <a href="/propiedades" className="text-brand-orange text-sm hover:underline">Ver todas las propiedades</a>
            </div>
          )}
        </>
      )}
      {hasFilters && (
        <AlertSubscribeForm
          ciudad={filters?.ciudad}
          tipo={filters?.tipo}
          operacion={filters?.operacion}
          dormitorios={filters?.dormitorios}
        />
      )}
      <CompareBar />
    </>
  );
}

// Inline compare button to avoid extra import complexity
function CompareCardButton({ propertyId }: { propertyId: string }) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("penalva_compare") || "[]");
    setAdded(ids.includes(propertyId));
  }, [propertyId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const ids: string[] = JSON.parse(localStorage.getItem("penalva_compare") || "[]");
    if (added) {
      const next = ids.filter((i) => i !== propertyId);
      localStorage.setItem("penalva_compare", JSON.stringify(next));
      setAdded(false);
    } else {
      if (ids.length >= 3) return;
      localStorage.setItem("penalva_compare", JSON.stringify([...ids, propertyId]));
      setAdded(true);
    }
    window.dispatchEvent(new Event("compare-update"));
  };

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[11px] font-medium transition-all ${
        added
          ? "bg-[#262522] border-[#262522] text-white"
          : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
      }`}
    >
      <GitCompare size={12} />
      {added ? "En comparación" : "Comparar"}
    </button>
  );
}

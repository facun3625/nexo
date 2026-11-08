import React from "react";
import { Check, X } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { formatPrice } from "@/lib/formatPrice";

interface Props {
  searchParams: Promise<{ ids?: string }>;
}

function Val({ value }: { value: any }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-300">—</span>;
  }
  if (typeof value === "boolean") {
    return value
      ? <Check size={16} className="text-green-500 mx-auto" />
      : <X size={16} className="text-gray-300 mx-auto" />;
  }
  return <span>{value}</span>;
}

export default async function CompararPage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const [session, siteConfig] = await Promise.all([getSession(), getSiteConfig()]);

  const idList = ids ? ids.split(",").slice(0, 3) : [];
  const properties = idList.length > 0
    ? await prisma.property.findMany({ where: { id: { in: idList } } })
    : [];

  const rows = [
    { label: "Precio", key: "price", format: (v: any, prop: any) => v ? formatPrice(Number(v), prop?.currency, prop?.pricePerMonth) : null },
    { label: "Operación", key: "type" },
    { label: "Tipo de propiedad", key: "propertyType" },
    { label: "Ciudad", key: "city" },
    { label: "Dirección", key: "address" },
    { label: "Dormitorios", key: "bedrooms" },
    { label: "Baños", key: "bathrooms" },
    { label: "Cochera", key: "hasGarage" },
    { label: "Lugares de cochera", key: "garages" },
    { label: "Sup. cubierta", key: "coveredArea", format: (v: any) => v ? `${v} m²` : null },
    { label: "Sup. total", key: "totalArea", format: (v: any) => v ? `${v} m²` : null },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      <section className="flex-1 py-12 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#111]">Comparar propiedades</h1>
            <p className="text-gray-400 text-[13px] mt-1">
              {properties.length < 2
                ? "Seleccioná al menos 2 propiedades desde el listado para comparar."
                : `Comparando ${properties.length} propiedades`}
            </p>
          </div>

          {properties.length < 2 ? (
            <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl bg-white">
              <p className="text-gray-400 text-sm mb-3">No hay suficientes propiedades para comparar.</p>
              <a href="/propiedades" className="text-brand-orange text-sm hover:underline">Ir al listado</a>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100"><div className="overflow-x-auto">

              {/* Cabecera con fotos */}
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
                <div className="p-5 bg-gray-50 border-r border-gray-100" />
                {properties.map((p) => (
                  <div key={p.id} className="p-5 border-r border-gray-100 last:border-r-0">
                    <a href={`/propiedad/${p.id}`} className="block group">
                      <div className="h-36 rounded-lg overflow-hidden mb-3">
                        <img
                          src={p.imageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80"}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-semibold text-[#111] text-[14px] line-clamp-2 group-hover:text-brand-orange transition-colors leading-snug">
                        {p.title}
                      </h3>
                    </a>
                  </div>
                ))}
              </div>

              {/* Filas de comparación */}
              {rows.map((row, i) => (
                <div
                  key={row.key}
                  className={`grid border-b border-gray-50 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}
                >
                  <div className="px-5 py-3.5 text-[12px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-100 flex items-center">
                    {row.label}
                  </div>
                  {properties.map((p) => {
                    const raw = (p as any)[row.key];
                    const display = row.format ? row.format(raw, p) : raw;
                    return (
                      <div key={p.id} className="px-5 py-3.5 text-[14px] text-[#111] border-r border-gray-100 last:border-r-0 text-center flex items-center justify-center">
                        <Val value={display ?? raw} />
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Botones ver propiedad */}
              <div className="grid border-t border-gray-100" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
                <div className="p-4 bg-gray-50 border-r border-gray-100" />
                {properties.map((p) => (
                  <div key={p.id} className="p-4 border-r border-gray-100 last:border-r-0">
                    <a
                      href={`/propiedad/${p.id}`}
                      className="block text-center bg-brand-orange hover:bg-orange-700 text-white text-[12px] font-bold uppercase tracking-wider py-2.5 rounded-lg transition-colors"
                    >
                      Ver propiedad
                    </a>
                  </div>
                ))}
              </div>
            </div></div>
          )}
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}

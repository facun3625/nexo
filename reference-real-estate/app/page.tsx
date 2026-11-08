import React from "react";
import {
  Phone,
  MapPin,
  ArrowRight,
  Bed,
  Bath,
  Car,
  Bell,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import FavoriteCardButton from "@/components/FavoriteCardButton";
import AnimateIn from "@/components/AnimateIn";
import { getSiteConfig } from "@/lib/config";
import { getContent } from "@/lib/content";
import { formatPrice } from "@/lib/formatPrice";

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  pricePerMonth?: boolean;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  imageUrl?: string | null;
  type: string;
  propertyType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  hasGarage?: boolean;
  garages?: number | null;
}

async function getProperties(): Promise<Property[]> {
  try {
    return await (prisma.property as any).findMany({
      where: { featured: true, published: true },
      orderBy: { featuredOrder: "asc" },
      take: 6,
    }) as Property[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [rawProperties, operations, cities, propertyTypes, session, siteConfig, heroTitulo, heroSubtitulo, heroImg] = await Promise.all([
    getProperties(),
    prisma.operationType.findMany({ orderBy: { order: "asc" } }),
    prisma.city.findMany({ orderBy: { order: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { order: "asc" } }),
    getSession(),
    getSiteConfig(),
    getContent("home_titulo"),
    getContent("home_subtitulo"),
    getContent("home_hero_img"),
  ]);

  const colorMap: Record<string, string> = {};
  operations.forEach((o: any) => { colorMap[o.name] = o.color; });
  const properties = rawProperties.map((p) => ({ ...p, typeColor: colorMap[p.type] ?? "#df691a" }));

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── HERO — split: buscador izq / imagen der ── */}
      <section className="flex md:h-[340px]">

        {/* Izquierda — buscador 65% */}
        <div className="w-full md:w-[65%] bg-[#f0efed] flex flex-col justify-center py-6 md:py-0">
          <div className="w-full px-8 md:px-12 lg:px-16">
            <AnimateIn from="left">
              <h1 className="text-2xl md:text-[24px] font-bold text-[#111] mb-1 leading-tight">
                {heroTitulo}
              </h1>
              <p className="text-gray-500 text-[13px] mb-5">
                {heroSubtitulo}
              </p>
              <SearchForm operations={operations} cities={cities} propertyTypes={propertyTypes} />
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <MapPin size={12} className="text-brand-orange shrink-0" />
                  <span>{siteConfig.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                  <Phone size={12} className="text-brand-orange shrink-0" />
                  <span>{siteConfig.phone}</span>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>

        {/* Derecha — imagen 35% */}
        <div className="hidden md:block w-[35%] overflow-hidden">
          <img
            src={heroImg}
            alt="Propiedad"
            className="w-full h-full object-cover"
          />
        </div>
      </section>


      {/* ── FEATURED PROPERTIES ── */}
      <section id="propiedades" className="pt-8 pb-16 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <AnimateIn from="left" className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">Portafolio</p>
              <h2 className="text-3xl md:text-[32px] text-[#111] font-bold">
                Propiedades Destacadas
              </h2>
            </div>
            <a
              href="/propiedades"
              className="text-sm font-semibold text-[#333] hover:text-brand-orange transition-colors flex items-center gap-1.5 group"
            >
              Ver todas
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </AnimateIn>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map((property: Property, i: number) => (
                <AnimateIn key={property.id} delay={i * 80}>
                <a
                  key={property.id}
                  href={`/propiedad/${property.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer block"
                >
                  {/* Imagen */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={
                        property.imageUrl ||
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Overlay + botón ver propiedad */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-white text-[#111] text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm">
                        Ver propiedad
                      </span>
                    </div>

                    {/* Badge tipo operación */}
                    <div className="absolute top-3 left-3">
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded" style={{ background: (property as any).typeColor ?? "#df691a" }}>
                        {property.type}
                      </span>
                    </div>

                    <FavoriteCardButton propertyId={property.id} />
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="text-brand-orange font-bold text-xl">
                        {formatPrice(property.price, property.currency, property.pricePerMonth)}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {property.propertyType}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#111] text-[15px] mb-1.5 line-clamp-1">
                      {property.title}
                    </h3>
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
                </AnimateIn>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-300 text-sm">No hay propiedades disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── ALERTS CTA ── */}
      <section className="py-20 bg-[#262522] text-white">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl">
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-4">No pierdas tiempo</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">¿No encontraste lo que buscabas?</h2>
              <p className="text-white/40 text-[15px] leading-relaxed">
                El mercado inmobiliario se mueve rápido. Suscribite a nuestro sistema de alertas personalizadas y recibí un aviso en tu email apenas ingrese una propiedad que coincida con tus necesidades.
              </p>
            </div>
            <a 
              href="/alertas" 
              className="px-10 py-5 bg-brand-orange text-white font-bold text-[14px] uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-orange/20 hover:bg-orange-700 hover:shadow-orange-700/30 transition-all shrink-0 flex items-center gap-3"
            >
              <Bell size={18} />
              Configurar mi alerta
            </a>
          </div>
        </div>
      </section>


      {/* ── FOOTER ── */}
      <Footer siteConfig={siteConfig} />
    </div>
  );
}

import React from "react";
import { notFound } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Bed,
  Bath,
  Car,
  Maximize2,
  Share2,
  ChevronLeft,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PropertyGallery from "@/components/PropertyGallery";
import PropertyMap from "@/components/PropertyDetailMap";
import FavoriteButton from "@/components/FavoriteButton";
import CompareButton from "@/components/CompareButton";
import CompareBar from "@/components/CompareBar";
import CopyLinkButton from "@/components/CopyLinkButton";
import PropertySearchSidebar from "@/components/PropertySearchSidebar";
import { formatPrice } from "@/lib/formatPrice";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return { title: "Propiedad no encontrada" };
  return {
    title: `${property.title} — Penalva Inmobiliaria`,
    description: property.description,
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  const [property, operations, cities, propertyTypes, session, siteConfig] = await Promise.all([
    prisma.property.findUnique({ where: { id } }),
    prisma.operationType.findMany({ orderBy: { order: "asc" } }),
    prisma.city.findMany({ orderBy: { order: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { order: "asc" } }),
    getSession(),
    getSiteConfig(),
  ]);
  if (!property) notFound();

  const allImages: string[] = [];
  if (property.imageUrl) allImages.push(property.imageUrl);
  if (property.images) {
    try {
      const extra = JSON.parse(property.images);
      if (Array.isArray(extra)) allImages.push(...extra);
    } catch {}
  }
  if (allImages.length === 0) {
    allImages.push("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://penalva.com.ar";
  const whatsappMsg = encodeURIComponent(`Hola, me interesa la propiedad "${property.title}" en ${property.address}. ¿Pueden darme más información?`);
  // Usar el WhatsApp del tipo de operación si existe, sino el global
  const operationType = operations.find((op: any) => op.name === property.type);
  const waRaw = (operationType as any)?.whatsapp || siteConfig.whatsapp || "";
  const waNumber = waRaw.replace(/[^0-9]/g, "");

  const specs = [
    property.bedrooms != null && { icon: Bed, label: "Dormitorios", value: property.bedrooms },
    property.bathrooms != null && { icon: Bath, label: "Baños", value: property.bathrooms },
    property.hasGarage && { icon: Car, label: "Cochera", value: property.garages ? `${property.garages} lugar${property.garages > 1 ? "es" : ""}` : "Sí" },
    property.coveredArea != null && { icon: Maximize2, label: "Sup. cubierta", value: `${property.coveredArea} m²` },
    property.totalArea != null && { icon: Maximize2, label: "Sup. total", value: `${property.totalArea} m²` },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string | number }[];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── BREADCRUMB ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-3 flex items-center gap-2 text-[12px] text-gray-400">
          <a href="/" className="hover:text-brand-orange transition-colors flex items-center gap-1">
            <ChevronLeft size={13} />
            Propiedades
          </a>
          <span>/</span>
          <span className="text-[#111] truncate">{property.title}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-10 w-full bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Galería */}
            <PropertyGallery images={allImages} title={property.title} />

            {/* Título + badge */}
            <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <span className="bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded">
                  {property.type}
                </span>
                <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded">
                  {property.propertyType}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-[#111] mb-2 leading-tight">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-gray-400 text-[13px]">
                <MapPin size={13} className="text-brand-orange shrink-0" />
                <span>{property.city}, {property.address}</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-4">Descripción</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Specs */}
            {specs.length > 0 && (
              <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-6">Información técnica</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {specs.map((spec) => {
                    const Icon = spec.icon;
                    return (
                      <div key={spec.label} className="flex items-center gap-3 border border-gray-100 rounded-lg px-4 py-3">
                        <div className="w-9 h-9 bg-brand-orange/10 rounded-lg flex items-center justify-center shrink-0">
                          <Icon size={16} className="text-brand-orange" />
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{spec.label}</div>
                          <div className="text-[14px] font-medium text-[#111]">{spec.value}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mapa */}
            {property.lat && property.lng && (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-7 pt-7 pb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-1">Ubicación</h2>
                  <p className="text-[13px] text-gray-400">{property.city}, {property.address}</p>
                </div>
                <div className="isolate">
                  <PropertyMap lat={Number(property.lat)} lng={Number(property.lng)} title={property.title} />
                </div>
              </div>
            )}

            {/* Video */}
            {property.videoUrl && (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-7 pt-7 pb-4">
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Video</h2>
                </div>
                <div className="relative w-full aspect-video">
                  <iframe
                    src={property.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN — sticky sidebar ── */}
          <div className="space-y-5">
            <div className="sticky top-[156px] space-y-5">

              {/* Buscador rápido */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-4">Buscar otra propiedad</p>
                <PropertySearchSidebar operations={operations} cities={cities} propertyTypes={propertyTypes} />
              </div>

              {/* Precio + CTA */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Precio</p>
                <div className="text-xl font-semibold text-brand-orange mb-5">
                  {formatPrice(property.price, property.currency ?? "USD", property.pricePerMonth ?? false)}
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://wa.me/${waNumber}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-[13px] uppercase tracking-wider py-3 rounded-lg transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Consultar por WhatsApp
                  </a>
                  <a
                    href={`tel:${(siteConfig.phone ?? "").replace(/[^0-9+]/g, "")}`}
                    className="flex items-center justify-center gap-2.5 w-full bg-[#262522] hover:bg-[#1a1917] text-white font-semibold text-[13px] uppercase tracking-wider py-3 rounded-lg transition-colors"
                  >
                    <Phone size={14} />
                    {siteConfig.phone}
                  </a>
                  <FavoriteButton propertyId={property.id} />
                  <CompareButton propertyId={property.id} />
                </div>
              </div>

              {/* Compartir */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
                  <Share2 size={11} />
                  Compartir propiedad
                </p>
                <div className="flex gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${siteUrl}/propiedad/${property.id}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    title="Compartir en Facebook"
                    className="w-10 h-10 flex items-center justify-center bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-lg transition-colors shrink-0"
                  >
                    <Facebook size={16} />
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Mirá esta propiedad: ${siteUrl}/propiedad/${property.id}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    title="Compartir por WhatsApp"
                    className="w-10 h-10 flex items-center justify-center bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg transition-colors shrink-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                  <CopyLinkButton url={`${siteUrl}/propiedad/${property.id}`} />
                </div>
              </div>

              {/* Info oficina */}
              <div className="bg-[#262522] rounded-xl p-6">
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-4">Penalva Inmobiliaria</p>
                <div className="space-y-3 text-[13px] text-white/50">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={13} className="text-brand-orange mt-0.5 shrink-0" />
                    <span>{siteConfig.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={13} className="text-brand-orange shrink-0" />
                    <span>{siteConfig.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail size={13} className="text-brand-orange shrink-0" />
                    <span className="break-all">{siteConfig.email}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <Footer siteConfig={siteConfig} />
      <CompareBar />
    </div>
  );
}

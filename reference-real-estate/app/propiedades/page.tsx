import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SearchForm from "@/components/SearchForm";
import PropiedadesView from "@/components/PropiedadesView";

interface Props {
  searchParams: Promise<{
    ciudad?: string;
    tipo?: string;
    operacion?: string;
    dormitorios?: string;
  }>;
}

export default async function PropiedadesPage({ searchParams }: Props) {
  const { ciudad, tipo, operacion, dormitorios } = await searchParams;

  const where: any = { published: true };
  if (ciudad) where.city = ciudad;
  if (tipo) where.propertyType = tipo;
  if (operacion) where.type = operacion;
  if (dormitorios) {
    const n = parseInt(dormitorios);
    if (!isNaN(n)) {
      where.bedrooms = n === 5 ? { gte: 5 } : n;
    }
  }

  const [rawProperties, operations, cities, propertyTypes, session, siteConfig] = await Promise.all([
    prisma.property.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.operationType.findMany({ orderBy: { order: "asc" } }),
    prisma.city.findMany({ orderBy: { order: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { order: "asc" } }),
    getSession(),
    getSiteConfig(),
  ]);

  const colorMap: Record<string, string> = {};
  operations.forEach((o) => { colorMap[o.name] = o.color; });
  const properties = rawProperties.map((p) => ({ ...p, typeColor: colorMap[p.type] ?? "#df691a" }));

  const hasFilters = !!(ciudad || tipo || operacion || dormitorios);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/propiedades" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── SEARCH BAR ── */}
      <div className="bg-[#f0efed] border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <SearchForm
            operations={operations}
            cities={cities}
            propertyTypes={propertyTypes}
            initial={{ ciudad, tipo, operacion, dormitorios }}
          />
        </div>
      </div>

      {/* ── RESULTS ── */}
      <section className="flex-1 py-12 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <PropiedadesView properties={properties as any} hasFilters={hasFilters} filters={{ ciudad, tipo, operacion, dormitorios }} />
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}

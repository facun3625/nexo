import React from "react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapaView from "@/components/MapaView";

interface Props {
  searchParams: Promise<{
    ciudad?: string;
    tipo?: string;
    operacion?: string;
    dormitorios?: string;
  }>;
}

export default async function MapaPage({ searchParams }: Props) {
  const { ciudad, tipo, operacion, dormitorios } = await searchParams;

  const where: any = { published: true };
  if (ciudad) where.city = ciudad;
  if (tipo) where.propertyType = tipo;
  if (operacion) where.type = operacion;
  if (dormitorios) {
    const n = parseInt(dormitorios);
    if (!isNaN(n)) where.bedrooms = n === 5 ? { gte: 5 } : n;
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

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/mapa" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      <MapaView
        properties={properties as any}
        operations={operations}
        cities={cities}
        propertyTypes={propertyTypes}
        initial={{ ciudad, tipo, operacion, dormitorios }}
      />

      <Footer siteConfig={siteConfig} />
    </div>
  );
}

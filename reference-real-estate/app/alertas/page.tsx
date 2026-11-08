import React from "react";
import prisma from "@/lib/prisma";
import { getSiteConfig } from "@/lib/config";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertasClient from "./AlertasClient";

export default async function AlertasPage() {
  const [operations, cities, propertyTypes, session, siteConfig] = await Promise.all([
    prisma.operationType.findMany({ orderBy: { order: "asc" } }),
    prisma.city.findMany({ orderBy: { order: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { order: "asc" } }),
    getSession(),
    getSiteConfig(),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">
      <Header isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />
      
      <AlertasClient 
        operations={operations}
        cities={cities}
        propertyTypes={propertyTypes}
      />

      <Footer siteConfig={siteConfig} />
    </div>
  );
}

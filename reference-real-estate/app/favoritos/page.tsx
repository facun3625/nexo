import React from "react";
import { Heart } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FavoritosContent from "@/components/FavoritosContent";
import CompareBar from "@/components/CompareBar";

export default async function FavoritosPage() {
  const [session, siteConfig] = await Promise.all([getSession(), getSiteConfig()]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/favoritos" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* HERO */}
      <div className="bg-[#f8f6f2] border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Heart size={22} className="text-red-400 fill-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Mis Favoritos</h1>
            <p className="text-gray-400 text-[13px] mt-0.5">Propiedades que guardaste para revisar después</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <section className="flex-1 py-12 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <FavoritosContent />
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
      <CompareBar />
    </div>
  );
}

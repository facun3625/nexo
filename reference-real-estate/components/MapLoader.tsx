"use client";

import dynamic from "next/dynamic";
import React from "react";

const Map = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => (
        <div className="h-[500px] w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
            Cargando mapa...
        </div>
    ),
});

interface MapLoaderProps {
    properties: any[];
    fullHeight?: boolean;
}

export default function MapLoader({ properties, fullHeight }: MapLoaderProps) {
    return <Map properties={properties} fullHeight={fullHeight} />;
}

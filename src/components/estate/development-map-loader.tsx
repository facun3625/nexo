"use client";

import dynamic from "next/dynamic";

const DevelopmentLocationMap = dynamic(
  () => import("./development-location-map").then((module) => module.DevelopmentLocationMap),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Cargando mapa…</div> },
);

export function DevelopmentMapLoader(props: { latitude: number; longitude: number; name: string; address: string }) {
  return <DevelopmentLocationMap {...props} />;
}

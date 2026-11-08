"use client";
import dynamic from "next/dynamic";
import type { MapProperty } from "./estate-map";

const EstateMap = dynamic(
  () => import("./estate-map").then((m) => m.EstateMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

export function MapLoader({ properties }: { properties: MapProperty[] }) {
  return <EstateMap properties={properties} />;
}

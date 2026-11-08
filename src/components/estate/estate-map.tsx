"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PIN_ICON } from "./map-pin";

import { money, labels } from "@/lib/estate/modules";

export type MapProperty = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  neighborhood: string;
  city: string;
  media: { url: string }[];
  listings: {
    id: string;
    operation: string;
    price: { toString(): string } | number | null;
    currency: string;
    showPrice: boolean;
  }[];
};

const OPERATION_COLOR: Record<string, string> = {
  SALE: "#1e658c",
  RENT: "#208ab1",
};

function FitToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export function EstateMap({ properties }: { properties: MapProperty[] }) {
  const points: [number, number][] = properties.map((p) => [
    p.latitude,
    p.longitude,
  ]);
  const center: [number, number] = points[0] ?? [-31.4201, -64.1888];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToMarkers points={points} />
      {properties.map((p) => {
        const listing = p.listings[0];
        const color = listing
          ? (OPERATION_COLOR[listing.operation] ?? "#1e658c")
          : "#1e658c";
        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={MAP_PIN_ICON}
          >
            <Popup minWidth={200} maxWidth={220}>
              <a
                href={`/propiedades/${p.id}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    height: 120,
                    overflow: "hidden",
                    borderRadius: 8,
                    background: "#efefef",
                  }}
                >
                  {p.media[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.media[0].url}
                      alt={p.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {listing && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        background: color,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: ".04em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {labels[listing.operation]}
                    </span>
                  )}
                </div>
                <div style={{ padding: "8px 2px 2px" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                    {listing?.price && listing.showPrice
                      ? money(listing.price, listing.currency)
                      : "Consultar precio"}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.title}
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: "#757575",
                    }}
                  >
                    {[p.neighborhood, p.city].filter(Boolean).join(", ")}
                  </p>
                </div>
              </a>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

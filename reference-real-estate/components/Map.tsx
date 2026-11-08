"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/formatPrice";

function makeIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
    className: "",
  });
}

interface Property {
  id: string;
  title: string;
  lat: number | null;
  lng: number | null;
  price: number;
  currency?: string;
  pricePerMonth?: boolean;
  address: string;
  city?: string;
  imageUrl?: string | null;
  type?: string;
  typeColor?: string;
  propertyType?: string;
  bedrooms?: number | null;
}

interface MapProps {
  properties: Property[];
  fullHeight?: boolean;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function PropertyMap({ properties, fullHeight }: MapProps) {
  const validProperties = properties.filter((p) => p.lat !== null && p.lng !== null);
  const center: [number, number] =
    validProperties.length > 0
      ? [Number(validProperties[0].lat), Number(validProperties[0].lng)]
      : [-31.6333, -60.7];

  return (
    <div className={fullHeight ? "h-full w-full" : "h-[500px] w-full"}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={center} />

          {validProperties.map((prop) => (
            <Marker
              key={prop.id}
              position={[Number(prop.lat), Number(prop.lng)]}
              icon={makeIcon(prop.typeColor ?? "#df691a")}
            >
              <Popup>
                <div style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
                  {/* Imagen */}
                  <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
                    <img
                      src={
                        prop.imageUrl ||
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=480&q=80"
                      }
                      alt={prop.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {prop.type && (
                      <span style={{
                        position: "absolute", bottom: 8, left: 8,
                        background: prop.typeColor ?? "#df691a", color: "white",
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", padding: "3px 8px", borderRadius: 4,
                      }}>
                        {prop.type}
                      </span>
                    )}
                    {prop.propertyType && (
                      <span style={{
                        position: "absolute", bottom: 8, right: 8,
                        background: "rgba(0,0,0,0.55)", color: "white",
                        fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
                        textTransform: "uppercase", padding: "3px 8px", borderRadius: 4,
                      }}>
                        {prop.propertyType}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ color: "#df691a", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                      {formatPrice(prop.price, prop.currency, prop.pricePerMonth)}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111", marginBottom: 4, lineHeight: 1.3 }}>
                      {prop.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                      📍 {prop.city ? `${prop.city}, ` : ""}{prop.address}
                    </div>
                    <a
                      href={`/propiedad/${prop.id}`}
                      style={{
                        display: "block", textAlign: "center",
                        background: "#262522", color: "white",
                        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                        textTransform: "uppercase", padding: "9px 0",
                        borderRadius: 6, textDecoration: "none",
                      }}
                    >
                      Ver propiedad →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
    </div>
  );
}

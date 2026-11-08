"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  html: `<div style="width:32px;height:32px;background:#df691a;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
  className: "",
});

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyDetailMapInner({ lat, lng, title }: Props) {
  return (
    <div className="h-[300px] w-full relative isolate">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

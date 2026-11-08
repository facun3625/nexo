"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PIN_ICON } from "./map-pin";


export function DevelopmentLocationMap({ latitude, longitude, name, address }: { latitude: number; longitude: number; name: string; address: string }) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]} icon={MAP_PIN_ICON}>
        <Popup><strong>{name}</strong><br />{address}</Popup>
      </Marker>
    </MapContainer>
  );
}

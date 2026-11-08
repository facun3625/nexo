"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_PIN_ICON } from "./map-pin";
import { SearchIcon } from "lucide-react";
import { inputClass } from "@/components/estate/form-field-class";

const DEFAULT_CENTER: [number, number] = [-31.4201, -64.1888]; // Córdoba


type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
  };
};

// Nominatim devuelve display_name con barrio, departamento, provincia y
// código postal — con eso es difícil encontrar la dirección correcta en la
// lista. Nos quedamos solo con calle, altura y ciudad.
function shortLabel(s: Suggestion): string {
  const a = s.address;
  if (!a) return s.display_name;
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const city = a.city || a.town || a.village || a.municipality || "";
  return [street, city, a.state].filter((value, index, values) => value && values.indexOf(value) === index).join(", ") || s.display_name;
}

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function rankSuggestions(items: Suggestion[], query: string) {
  const locationParts = query.split(",").map((part) => normalized(part)).filter(Boolean);
  const rawLocation = locationParts.at(-1)?.replace(/\s+/g, " ") ?? "";
  const words = rawLocation.split(" ");
  const half = words.length / 2;
  const requestedCity = Number.isInteger(half) && words.slice(0, half).join(" ") === words.slice(half).join(" ")
    ? words.slice(0, half).join(" ")
    : rawLocation;
  return [...items].sort((left, right) => {
    const score = (item: Suggestion) => {
      const address = item.address;
      const city = normalized(address?.city || address?.town || address?.village || address?.municipality || "");
      const state = normalized(address?.state || "");
      if (!requestedCity) return 0;
      if (city === requestedCity) return 4;
      if (`${city} ${state}`.includes(requestedCity)) return 3;
      if (city.includes(requestedCity)) return 2;
      if (normalized(item.display_name).includes(requestedCity)) return 1;
      return 0;
    };
    return score(right) - score(left);
  });
}

function ClickToPick({
  onPick,
  onFirstClick,
}: {
  onPick: (lat: number, lng: number) => void;
  onFirstClick: () => void;
}) {
  useMapEvents({
    click(e) {
      onFirstClick();
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ point }: { point: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(point, map.getZoom() < 13 ? 15 : map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point[0], point[1]]);
  return null;
}

export function PropertyLocationPicker({
  initialLat,
  initialLng,
  initialAddress,
  onDirty,
}: {
  initialLat?: string;
  initialLng?: string;
  initialAddress?: string;
  onDirty: () => void;
}) {
  const initial: [number, number] | null =
    initialLat && initialLng ? [Number(initialLat), Number(initialLng)] : null;
  const [point, setPoint] = useState<[number, number] | null>(initial);
  const [query, setQuery] = useState(initialAddress ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Propiedades migradas que tienen coordenadas pero todavía no una
  // dirección guardada (de antes de agregar este campo): completamos el
  // buscador con una geocodificación inversa como mejor esfuerzo, para que
  // al guardar quede ya el texto. Si la propiedad ya tiene mapAddress
  // guardado, usamos ese texto directamente y no pisamos lo que el usuario
  // ya dejó cargado.
  useEffect(() => {
    if (!initial || initialAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${initial[0]}&lon=${initial[1]}`,
        );
        const data = (await res.json()) as Suggestion;
        if (!cancelled && data && !("error" in data)) {
          setQuery(shortLabel(data));
        }
      } catch {
        // Sin conexión o rate-limit: el pin ya está puesto en el mapa, solo
        // queda vacío el texto del buscador.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(lat: number, lng: number) {
    setPoint([lat, lng]);
    onDirty();
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(value)}&limit=6&countrycodes=ar`,
        );
        const data = (await res.json()) as Suggestion[];
        setSuggestions(Array.isArray(data) ? rankSuggestions(data, value) : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function selectSuggestion(s: Suggestion) {
    pick(Number(s.lat), Number(s.lon));
    setQuery(shortLabel(s));
    setSuggestions([]);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscá una dirección para ubicar el pin…"
          className={`${inputClass} pl-9`}
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-xl border bg-card text-sm shadow-lg">
            {suggestions.map((s) => (
              <li key={`${s.lat}-${s.lon}`}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="block w-full px-3 py-2 text-left hover:bg-muted"
                >
                  {shortLabel(s)}
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && (
          <p className="mt-1 text-xs text-muted-foreground">Buscando…</p>
        )}
      </div>

      <div className="relative h-72 overflow-hidden rounded-xl border">
        <MapContainer
          center={point ?? DEFAULT_CENTER}
          zoom={point ? 15 : 12}
          scrollWheelZoom={scrollZoomEnabled}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPick onPick={pick} onFirstClick={() => setScrollZoomEnabled(true)} />
          {point && <Recenter point={point} />}
          {point && (
            <Marker
              position={point}
              icon={MAP_PIN_ICON}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  pick(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
        {!scrollZoomEnabled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
              Hacé clic en el mapa para activar el zoom con scroll
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Buscá la dirección, hacé clic en el mapa o arrastrá el pin para ajustar la ubicación exacta.
        {point && ` Coordenadas: ${point[0].toFixed(6)}, ${point[1].toFixed(6)}.`}
      </p>

      <input type="hidden" name="latitude" value={point ? point[0].toFixed(7) : ""} readOnly />
      <input type="hidden" name="longitude" value={point ? point[1].toFixed(7) : ""} readOnly />
      <input type="hidden" name="mapAddress" value={point ? query : ""} readOnly />

      <details
        open={showManual}
        onToggle={(e) => setShowManual((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xs text-muted-foreground underline">
          Ingresar coordenadas manualmente
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input
            type="number"
            step="0.0000001"
            placeholder="Latitud"
            value={point ? point[0] : ""}
            onChange={(e) => {
              const lat = Number(e.target.value);
              if (Number.isFinite(lat)) pick(lat, point?.[1] ?? DEFAULT_CENTER[1]);
            }}
            className={inputClass}
          />
          <input
            type="number"
            step="0.0000001"
            placeholder="Longitud"
            value={point ? point[1] : ""}
            onChange={(e) => {
              const lng = Number(e.target.value);
              if (Number.isFinite(lng)) pick(point?.[0] ?? DEFAULT_CENTER[0], lng);
            }}
            className={inputClass}
          />
        </div>
      </details>
    </div>
  );
}

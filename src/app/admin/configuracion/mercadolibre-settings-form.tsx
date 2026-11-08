"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/admin/confirm-provider";
import { SearchableSelect } from "@/components/estate/searchable-select";
import {
  updateMercadoLibreCredentials,
  disconnectMercadoLibre,
  fetchMlStates,
  fetchMlCities,
  fetchMlNeighborhoods,
  saveMlLocationMapping,
  deleteMlLocationMapping,
} from "./mercadolibre-actions";

type MlLocationRef = { id: string; name: string };

type LocationRow = {
  city: string;
  neighborhood: string;
  mapping: {
    id: string;
    mlStateId: string;
    mlStateName: string;
    mlCityId: string;
    mlCityName: string;
    mlNeighborhoodId: string | null;
  } | null;
};

export function MercadoLibreSettingsForm({
  clientId,
  configured,
  connected,
  userId,
  redirectUri,
  mlError,
  locationRows,
}: {
  clientId: string | null;
  configured: boolean;
  connected: boolean;
  userId: string | null;
  redirectUri: string;
  mlError: string | null;
  locationRows: LocationRow[];
}) {
  const [clientIdValue, setClientIdValue] = useState(clientId ?? "");
  const [clientSecretValue, setClientSecretValue] = useState("");
  const [credsPending, startCredsTransition] = useTransition();
  const [disconnectPending, startDisconnectTransition] = useTransition();
  const confirm = useConfirm();

  function saveCredentials() {
    startCredsTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("clientId", clientIdValue.trim());
        formData.set("clientSecret", clientSecretValue.trim());
        const result = await updateMercadoLibreCredentials(formData);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        setClientSecretValue("");
        toast.success("Credenciales guardadas");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  async function disconnect() {
    const ok = await confirm({
      title: "¿Desconectar Mercado Libre?",
      description: "Vas a tener que volver a autorizar la app para publicar propiedades.",
      confirmLabel: "Desconectar",
      destructive: true,
    });
    if (!ok) return;
    startDisconnectTransition(async () => {
      const result = await disconnectMercadoLibre();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Desconectado");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">App de Mercado Libre</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá una app en{" "}
            <a href="https://developers.mercadolibre.com.ar" target="_blank" rel="noopener noreferrer" className="underline">
              developers.mercadolibre.com.ar
            </a>{" "}
            con la cuenta de la inmobiliaria, y registrá esta URL de redirect exactamente así:
          </p>
          <code className="mt-2 block rounded-md bg-muted px-2.5 py-1.5 text-xs">{redirectUri}</code>
        </div>

        {mlError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Mercado Libre devolvió un error: {mlError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ml-client-id">Client ID</Label>
            <Input id="ml-client-id" value={clientIdValue} onChange={(e) => setClientIdValue(e.target.value)} placeholder="1234567890123456" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ml-client-secret">Client Secret</Label>
            <Input
              id="ml-client-secret"
              type="password"
              value={clientSecretValue}
              onChange={(e) => setClientSecretValue(e.target.value)}
              placeholder={configured ? "•••••••• (guardado — dejalo vacío para no cambiarlo)" : "Pegá el Client Secret"}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" onClick={saveCredentials} disabled={credsPending}>
            {credsPending ? "Guardando..." : "Guardar credenciales"}
          </Button>

          {configured && !connected && (
            <Button type="button" size="sm" variant="outline" render={<a href="/api/mercadolibre/oauth/start" />}>
              Conectar con Mercado Libre
            </Button>
          )}
          {connected && (
            <>
              <span className="text-sm text-muted-foreground">
                Conectado {userId ? `(cuenta ${userId})` : ""}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={disconnect}
                disabled={disconnectPending}
                className="text-destructive hover:text-destructive"
              >
                Desconectar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Ubicaciones</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mercado Libre tiene su propia lista de ciudades y barrios. Acá le decís a qué lugar de esa lista
            corresponde cada zona de tus propiedades — se hace una sola vez por zona.
          </p>
        </div>
        {locationRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay propiedades cargadas.</p>
        ) : null}
        {locationRows.length > 0 && (
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>En cada zona, la provincia y la ciudad se completan solas cuando las encontramos. Si no, buscalas escribiendo.</li>
            <li>
              El barrio es opcional. Mercado Libre tiene pocos barrios cargados: si el tuyo no aparece, dejalo vacío (el
              aviso igual muestra el punto exacto del mapa).
            </li>
            <li>Tocá Guardar. La zona queda lista para todas las propiedades que estén ahí.</li>
          </ol>
        )}
        {locationRows.length > 0 && (
          <div className="flex flex-col gap-3">
            {locationRows.map((row) => (
              <LocationMappingRow key={`${row.city}__${row.neighborhood}`} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const norm = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function LocationMappingRow({ row }: { row: LocationRow }) {
  const [editing, setEditing] = useState(!row.mapping);
  const [states, setStates] = useState<MlLocationRef[] | null>(null);
  const [cities, setCities] = useState<MlLocationRef[] | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<MlLocationRef[] | null>(null);
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  useEffect(() => {
    if (editing) void loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Sugerencia automática: busca en las listas de ML algo con el mismo
  // nombre que la ciudad/barrio de la propiedad ("Santa Fe" → provincia
  // Santa Fe → "Santa Fe capital"). Si no encuentra, deja el campo para
  // elegir a mano.
  async function loadStates() {
    if (states) return;
    setLoadingStates(true);
    try {
      const list = await fetchMlStates();
      const suggested = list.find((s) => norm(s.name) === norm(row.city));
      setStates(list);
      if (suggested && !stateId) void onStateChange(suggested.id, true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las provincias");
    } finally {
      setLoadingStates(false);
    }
  }

  async function onStateChange(id: string, auto = false) {
    setStateId(id);
    setCityId("");
    setNeighborhoodId("");
    setCities(null);
    setNeighborhoods(null);
    if (!id) return;
    setLoadingCities(true);
    try {
      const list = await fetchMlCities(id);
      const city = norm(row.city);
      const suggested = auto
        ? (list.find((c) => norm(c.name) === city) ?? list.find((c) => norm(c.name).startsWith(city)))
        : undefined;
      if (suggested) setCityId(suggested.id);
      setCities(list);
      if (suggested) void onCityChange(suggested.id, true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las ciudades");
    } finally {
      setLoadingCities(false);
    }
  }

  async function onCityChange(id: string, auto = false) {
    setCityId(id);
    setNeighborhoodId("");
    setNeighborhoods(null);
    if (!id) return;
    setLoadingNeighborhoods(true);
    try {
      const list = await fetchMlNeighborhoods(id);
      const hood = norm(row.neighborhood);
      const suggested = auto && hood ? list.find((n) => norm(n.name) === hood) : undefined;
      if (suggested) setNeighborhoodId(suggested.id);
      setNeighborhoods(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los barrios");
    } finally {
      setLoadingNeighborhoods(false);
    }
  }

  function save() {
    const state = states?.find((s) => s.id === stateId);
    const city = cities?.find((c) => c.id === cityId);
    if (!state || !city) {
      toast.error("Elegí provincia y ciudad");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("city", row.city);
      formData.set("neighborhood", row.neighborhood);
      formData.set("mlStateId", state.id);
      formData.set("mlStateName", state.name);
      formData.set("mlCityId", city.id);
      formData.set("mlCityName", city.name);
      if (neighborhoodId) formData.set("mlNeighborhoodId", neighborhoodId);
      const result = await saveMlLocationMapping(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Ubicación mapeada");
      setEditing(false);
    });
  }

  async function remove() {
    if (!row.mapping) return;
    const ok = await confirm({ title: "¿Borrar este mapeo?", description: "Las propiedades de esta zona no van a poder publicarse hasta volver a mapearla.", confirmLabel: "Borrar", destructive: true });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteMlLocationMapping(row.mapping!.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Mapeo borrado");
    });
  }

  const label = row.neighborhood ? `${row.city} / ${row.neighborhood}` : row.city;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {row.mapping && !editing && (
            <p className="text-xs text-muted-foreground">
              → {row.mapping.mlCityName}, {row.mapping.mlStateName} (ML)
            </p>
          )}
        </div>
        {row.mapping && !editing ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              Cambiar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={remove} disabled={pending} className="text-destructive hover:text-destructive">
              Borrar
            </Button>
          </div>
        ) : (
          !editing && (
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(true); void loadStates(); }}>
              Mapear
            </Button>
          )
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Provincia
              <SearchableSelect
                key={`state-${states ? "ok" : "loading"}`}
                name="mlStateId"
                placeholder={loadingStates ? "Cargando…" : "Buscar provincia…"}
                disabled={!states}
                defaultValue={stateId}
                options={(states ?? []).map((s) => ({ id: s.id, label: s.name }))}
                onChange={(id) => void onStateChange(id)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Ciudad
              <SearchableSelect
                key={`city-${stateId}-${cities ? "ok" : "loading"}`}
                name="mlCityId"
                placeholder={loadingCities ? "Cargando…" : stateId ? "Buscar ciudad…" : "Elegí la provincia"}
                disabled={!cities}
                defaultValue={cityId}
                options={(cities ?? []).map((c) => ({ id: c.id, label: c.name }))}
                onChange={(id) => void onCityChange(id)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Barrio (opcional)
              <SearchableSelect
                key={`hood-${cityId}-${neighborhoods ? "ok" : "loading"}`}
                name="mlNeighborhoodId"
                placeholder={
                  loadingNeighborhoods
                    ? "Cargando…"
                    : !cityId
                      ? "Elegí la ciudad"
                      : neighborhoods?.length
                        ? "Buscar barrio…"
                        : "Sin barrios en ML"
                }
                disabled={!neighborhoods?.length}
                defaultValue={neighborhoodId}
                options={(neighborhoods ?? []).map((n) => ({ id: n.id, label: n.name }))}
                onChange={setNeighborhoodId}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={pending || !stateId || !cityId}>
              Guardar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

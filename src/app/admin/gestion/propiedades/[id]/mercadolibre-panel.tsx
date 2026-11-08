"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyledSelect } from "@/components/estate/styled-select";
import { inputClass } from "@/components/estate/form-field-class";
import type { MercadoLibreRequirements } from "@/lib/mercadolibre/publish";
import {
  publishToMercadoLibre,
  pauseMercadoLibreListing,
  reactivateMercadoLibreListing,
  closeMercadoLibreListing,
  getMercadoLibreRequirements,
  saveMercadoLibreOptions,
} from "./mercadolibre-actions";

export type MlListingSummary = {
  id: string;
  operation: string;
  mlItemId: string | null;
  mlPermalink: string | null;
  mlStatus: string | null;
  mlLastError: string | null;
  mlLastSyncedAt: string | null;
};

const OPERATION_LABELS: Record<string, string> = { SALE: "Venta", RENT: "Alquiler" };
const ML_STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  paused: "Pausada",
  closed: "Cerrada",
  under_review: "En revisión",
  inactive: "Inactiva",
};

export function MercadoLibrePanel({
  propertyId,
  connected,
  listings,
}: {
  propertyId: string;
  connected: boolean;
  listings: MlListingSummary[];
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-7">
      <h2 className="font-semibold">Mercado Libre</h2>
      {!connected ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Todavía no hay una cuenta de Mercado Libre conectada — configurala en{" "}
          <a href="/admin/configuracion?tab=mercadolibre" className="underline">
            Configuración → Mercado Libre
          </a>
          .
        </p>
      ) : listings.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Cargá un precio de venta o alquiler para esta propiedad antes de poder publicarla.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {listings.map((listing) => (
            <ListingRow key={listing.id} propertyId={propertyId} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}

function ListingRow({ propertyId, listing }: { propertyId: string; listing: MlListingSummary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [req, setReq] = useState<MercadoLibreRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [listingTypeId, setListingTypeId] = useState<string | null>(null);

  const apply = useCallback((result: Awaited<ReturnType<typeof getMercadoLibreRequirements>>) => {
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setReq(result.requirements);
    setValues(result.requirements.values);
    setListingTypeId(result.requirements.listingTypeId);
  }, []);

  const load = useCallback(() => getMercadoLibreRequirements(listing.id).then(apply), [listing.id, apply]);

  useEffect(() => {
    let cancelled = false;
    getMercadoLibreRequirements(listing.id).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [listing.id, apply]);

  const missingValues = (req?.missing ?? []).filter((a) => !values[a.id]?.trim());
  const blocked = !req || req.issues.length > 0 || missingValues.length > 0;

  function run(action: (propertyId: string, listingId: string) => Promise<{ ok: true } | { error: string }>, success: string, saveFirst = false) {
    startTransition(async () => {
      if (saveFirst) {
        const saved = await saveMercadoLibreOptions(propertyId, listing.id, { attributes: values, listingTypeId });
        if ("error" in saved) {
          toast.error(saved.error);
          return;
        }
      }
      const result = await action(propertyId, listing.id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(success);
      }
      router.refresh();
      setLoading(true);
      void load();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{OPERATION_LABELS[listing.operation] ?? listing.operation}</span>
            {listing.mlStatus && (
              <Badge variant={listing.mlStatus === "active" ? "default" : "secondary"}>
                {ML_STATUS_LABELS[listing.mlStatus] ?? listing.mlStatus}
              </Badge>
            )}
          </div>
          {req?.categoryPath && (
            <p className="text-xs text-muted-foreground">Categoría: {req.categoryPath}</p>
          )}
          {listing.mlPermalink && (
            <a
              href={listing.mlPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver en Mercado Libre <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!listing.mlItemId ? (
            <Button type="button" size="sm" disabled={pending || loading || blocked} onClick={() => run(publishToMercadoLibre, "Publicada en Mercado Libre", true)}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Publicar
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" disabled={pending || loading || blocked} onClick={() => run(publishToMercadoLibre, "Publicación actualizada", true)}>
                Actualizar
              </Button>
              {listing.mlStatus === "paused" ? (
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(reactivateMercadoLibreListing, "Reactivada")}>
                  Reactivar
                </Button>
              ) : (
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(pauseMercadoLibreListing, "Pausada")}>
                  Pausar
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(closeMercadoLibreListing, "Publicación finalizada")}
                className="text-destructive hover:text-destructive"
              >
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Revisando requisitos de Mercado Libre…
        </p>
      ) : req && (
        <>
          {req.issues.length > 0 && (
            <ul className="flex flex-col gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              {req.issues.map((issue) => (
                <li key={issue} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          )}

          {(req.missing.length > 0 || req.listingTypes.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {req.missing.map((attr) => (
                <label key={attr.id} className="flex flex-col gap-1.5 text-xs font-medium">
                  {attr.name}
                  {attr.options.length > 0 ? (
                    <StyledSelect value={values[attr.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [attr.id]: e.target.value }))}>
                      <option value="">Elegí una opción</option>
                      {attr.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : (
                    <input
                      className={inputClass}
                      inputMode={attr.valueType.startsWith("number") ? "decimal" : undefined}
                      value={values[attr.id] ?? ""}
                      placeholder={attr.valueType === "number_unit" ? "Ej: 120 m²" : ""}
                      onChange={(e) => setValues((v) => ({ ...v, [attr.id]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
              {req.listingTypes.length > 0 && !listing.mlItemId && (
                <label className="flex flex-col gap-1.5 text-xs font-medium">
                  Tipo de publicación
                  <StyledSelect value={listingTypeId ?? ""} onChange={(e) => setListingTypeId(e.target.value)}>
                    {req.listingTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </StyledSelect>
                </label>
              )}
            </div>
          )}

          {!blocked && !listing.mlLastError && !listing.mlItemId && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Lista para publicar.
            </p>
          )}
        </>
      )}

      {listing.mlLastError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          Último error de Mercado Libre: {listing.mlLastError}
        </p>
      )}
    </div>
  );
}

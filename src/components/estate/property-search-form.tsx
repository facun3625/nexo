import { ORIENTATIONS, PET_POLICIES } from "@/lib/estate/property-features";
import { Search, SlidersHorizontal } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SuggestInput } from "@/components/search/suggest-input";
import { CATALOG_FILTER_LABELS, type CatalogFilterKey } from "@/lib/estate/catalog-filters";

// Búsqueda exacta, no "mínimo" — quien busca 1 dormitorio quiere 1, no
// "1 o más" (ver buildPublishedPropertyWhere en catalog-filters.ts).
const EXACT_OPTIONS = [1, 2, 3, 4];

// Con más de esta cantidad de filtros habilitados, el pill de búsqueda
// hace overflow y se rompe la forma redondeada (ver captura del reporte).
// Los que sobran van detrás de "Más filtros" en vez de forzar un wrap.
const MAX_INLINE_FILTERS = 4;

// Popover.Popup va en un Portal (Base UI lo exige), así que sus campos
// quedan fuera del <form> en el DOM — el atributo form="…" en cada
// input/select de ahí adentro es lo que los sigue mandando en el submit.
const SEARCH_FORM_ID = "property-search-filters";

function SelectField({
  name,
  label,
  ariaLabel,
  value,
  options,
  formId,
}: {
  name: string;
  label: string;
  ariaLabel: string;
  value: string;
  options: { value: string; label: string }[];
  formId: string;
}) {
  return (
    <Select name={name} form={formId} defaultValue={value} items={[{ value: "", label }, ...options]}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-12 w-full min-w-0 flex-1 justify-between rounded-xl border-0 bg-transparent px-4 text-sm font-medium shadow-none outline-none focus-visible:ring-0 data-[size=default]:h-12 lg:rounded-none lg:px-5 lg:text-base"
      >
        <SelectValue className="truncate" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PropertySearchForm({
  enabledKeys,
  values,
  propertyTypes,
  cities,
  neighborhoods,
  action,
  labels = CATALOG_FILTER_LABELS,
}: {
  enabledKeys: readonly CatalogFilterKey[];
  labels?: Record<CatalogFilterKey, string>;
  values: {
    q: string;
    operation: string;
    propertyType: string;
    city: string;
    neighborhood: string;
    bedrooms: string;
    bathrooms: string;
    garages: string;
    orientation: string;
    petsPolicy: string;
    creditEligible: string;
  };
  propertyTypes: readonly string[];
  cities: readonly string[];
  neighborhoods: readonly string[];
  // Sin esto, el form se manda a sí mismo (comportamiento de siempre en
  // /propiedades y /mapa) — home lo usa para mandar la búsqueda a
  // /propiedades, que es donde ahora viven los resultados.
  action?: string;
}) {
  if (enabledKeys.length === 0) return null;

  const fieldByKey: Record<CatalogFilterKey, React.ReactNode> = {
    q: (
      <div className="flex min-w-0 flex-1 items-center gap-2.5 px-5 py-2">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <SuggestInput
          endpoint="/api/search/suggest"
          name="q"
          form={SEARCH_FORM_ID}
          ariaLabel="Ciudad, barrio o propiedad"
          placeholder="Ciudad, barrio o propiedad"
          defaultValue={values.q}
          portal
          className="min-w-0 flex-1 bg-transparent pr-6 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
    ),
    operation: (
      <SelectField
        name="operation"
        formId={SEARCH_FORM_ID}
        label={labels.operation}
        ariaLabel={labels.operation}
        value={values.operation}
        options={[
          { value: "SALE", label: "Venta" },
          { value: "RENT", label: "Alquiler" },
        ]}
      />
    ),
    propertyType: (
      <SelectField
        name="propertyType"
        formId={SEARCH_FORM_ID}
        label={labels.propertyType}
        ariaLabel={labels.propertyType}
        value={values.propertyType}
        options={propertyTypes.map((t) => ({ value: t, label: t }))}
      />
    ),
    city: (
      <SelectField
        name="city"
        formId={SEARCH_FORM_ID}
        label={labels.city}
        ariaLabel={labels.city}
        value={values.city}
        options={cities.map((c) => ({ value: c, label: c }))}
      />
    ),
    neighborhood: (
      <SelectField
        name="neighborhood"
        formId={SEARCH_FORM_ID}
        label={labels.neighborhood}
        ariaLabel={labels.neighborhood}
        value={values.neighborhood}
        options={neighborhoods.map((n) => ({ value: n, label: n }))}
      />
    ),
    bedrooms: (
      <SelectField
        name="bedrooms"
        formId={SEARCH_FORM_ID}
        label={labels.bedrooms}
        ariaLabel={labels.bedrooms}
        value={values.bedrooms}
        options={EXACT_OPTIONS.map((n) => ({
          value: String(n),
          label: `${n} dormitorio${n === 1 ? "" : "s"}`,
        }))}
      />
    ),
    bathrooms: (
      <SelectField
        name="bathrooms"
        formId={SEARCH_FORM_ID}
        label={labels.bathrooms}
        ariaLabel={labels.bathrooms}
        value={values.bathrooms}
        options={EXACT_OPTIONS.map((n) => ({
          value: String(n),
          label: `${n} baño${n === 1 ? "" : "s"}`,
        }))}
      />
    ),
    orientation: <SelectField name="orientation" formId={SEARCH_FORM_ID} label={labels.orientation} ariaLabel={labels.orientation} value={values.orientation} options={ORIENTATIONS.map((value) => ({ value, label: value }))} />,
    petsPolicy: <SelectField name="petsPolicy" formId={SEARCH_FORM_ID} label={labels.petsPolicy} ariaLabel={labels.petsPolicy} value={values.petsPolicy} options={PET_POLICIES.map((value) => ({ value, label: value }))} />,
    creditEligible: <SelectField name="creditEligible" formId={SEARCH_FORM_ID} label={labels.creditEligible} ariaLabel={labels.creditEligible} value={values.creditEligible} options={[{ value: "true", label: "Apto crédito" }, { value: "false", label: "No apto crédito" }]} />,
    garages: (
      <SelectField
        name="garages"
        formId={SEARCH_FORM_ID}
        label={labels.garages}
        ariaLabel={labels.garages}
        value={values.garages}
        options={EXACT_OPTIONS.map((n) => ({
          value: String(n),
          label: `${n} cochera${n === 1 ? "" : "s"}`,
        }))}
      />
    ),
  };

  const inlineKeys = enabledKeys.slice(0, MAX_INLINE_FILTERS);
  const overflowKeys = enabledKeys.slice(MAX_INLINE_FILTERS);
  const overflowActiveCount = overflowKeys.filter((key) => values[key]).length;

  return (
    <form
      id={SEARCH_FORM_ID}
      action={action}
      className="estate-search-form grid w-full min-w-0 gap-2 rounded-2xl border bg-card p-2 shadow-sm lg:flex lg:items-stretch lg:rounded-full"
    >
      <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2 lg:flex lg:items-stretch lg:gap-0 lg:divide-x lg:divide-border">
        {inlineKeys.map((key) => (
          <div key={key} className={`flex min-w-0 flex-1 rounded-xl bg-muted/35 lg:rounded-none lg:bg-transparent ${key === "q" ? "lg:flex-[2.4]" : ""}`}>
            {fieldByKey[key]}
          </div>
        ))}
        {overflowKeys.length > 0 && (
          <Popover.Root>
            <Popover.Trigger className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted/35 px-4 text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground data-popup-open:text-foreground lg:min-w-[150px] lg:rounded-none lg:bg-transparent lg:px-5 lg:text-base">
              <SlidersHorizontal className="size-4 shrink-0" />
              <span className="truncate">
                Más filtros{overflowActiveCount > 0 ? ` (${overflowActiveCount})` : ""}
              </span>
            </Popover.Trigger>
            <Popover.Portal keepMounted>
              <Popover.Positioner sideOffset={8} align="start" className="z-50">
                <Popover.Popup className="w-[min(92vw,22rem)] rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {overflowKeys.map((key) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="px-1 text-xs font-medium text-muted-foreground">{labels[key]}</span>
                        <div className="rounded-lg border">{fieldByKey[key]}</div>
                      </div>
                    ))}
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
      <button className="min-h-12 shrink-0 rounded-xl bg-primary px-8 py-2.5 text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 lg:rounded-full">
        Buscar
      </button>
    </form>
  );
}

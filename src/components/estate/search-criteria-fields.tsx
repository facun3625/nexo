import { StyledSelect } from "./styled-select";
import { inputClass } from "./form-field-class";
import { ORIENTATIONS, PET_POLICIES } from "@/lib/estate/property-features";
import type { SearchCriteria } from "@/lib/estate/search-criteria";

type Option = { value: string; label: string };
export type SearchOptions = { cities: string[]; propertyTypes: string[] };
const choices = (values: readonly string[]): Option[] => values.map((value) => ({ value, label: value }));
const roomChoices = Array.from({ length: 11 }, (_, n) => ({ value: String(n), label: String(n) }));

export function SearchCriteriaFields({ options, values }: { options: SearchOptions; values?: SearchCriteria }) {
  function select(name: keyof SearchCriteria, label: string, items: Option[], empty = "Indistinto") {
    const current = String(values?.[name] ?? "");
    // Keep a saved selection visible if its catalog entry was later removed.
    const allItems = current && !items.some((item) => item.value === current)
      ? [{ value: current, label: `${current} (guardado)` }, ...items] : items;
    return <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <StyledSelect name={name} defaultValue={current}>
        <option value="">{empty}</option>
        {allItems.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </StyledSelect>
    </label>;
  }
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {select("operation", "Operación", [{ value: "SALE", label: "Venta" }, { value: "RENT", label: "Alquiler mensual" }, { value: "RENT_TEMP", label: "Alquiler temporario" }], "Venta o alquiler mensual")}
      {select("propertyType", "Tipo de propiedad", choices(options.propertyTypes), "Todos los tipos")}
      {select("city", "Ciudad", choices(options.cities), "Todas las ciudades")}
      {select("bedrooms", "Dormitorios (cantidad exacta)", roomChoices, "Cualquier cantidad")}
      {select("bathrooms", "Baños (cantidad exacta)", roomChoices, "Cualquier cantidad")}
      {select("petsPolicy", "Mascotas", choices(PET_POLICIES))}
      {select("orientation", "Orientación", choices(ORIENTATIONS))}
      {select("creditEligible", "Apto crédito", [{ value: "true", label: "Sí" }, { value: "false", label: "No" }])}
    </div>
    <div className="rounded-xl bg-muted/40 p-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <label className="block space-y-1.5 text-sm font-medium"><span>Moneda</span><StyledSelect name="currency" defaultValue={values?.currency ?? "USD"}><option value="USD">Dólares (USD)</option><option value="ARS">Pesos (ARS)</option></StyledSelect></label>
        <label className="block space-y-1.5 text-sm font-medium"><span>Presupuesto máximo</span><input name="maxBudget" type="number" inputMode="decimal" min="0.01" max="999999999999.99" step="0.01" defaultValue={values?.maxBudget ?? ""} placeholder="Sin límite" className={inputClass} /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Importe sin separadores de miles. En alquiler mensual se compara por mes; en temporario, por día. Solo se comparan precios en la moneda elegida.</p>
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Se deben cumplir todos los criterios que elijas. Dejá en “Indistinto” lo que no sea un requisito. Podés guardar una búsqueda aunque todavía no haya propiedades en esa ciudad.</p>
  </div>;
}

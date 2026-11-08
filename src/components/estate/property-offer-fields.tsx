"use client";
import { inputClass } from "@/components/estate/form-field-class";
import { StyledSelect } from "@/components/estate/styled-select";
import { ToggleField } from "@/components/estate/toggle-field";
import { SearchableSelect } from "@/components/estate/searchable-select";

export const OFFER_TYPES = [
  { value: "SALE", label: "Venta" },
  { value: "RENT", label: "Alquiler" },
  { value: "RENT_TEMP", label: "Alquiler temporario" },
  { value: "BOTH", label: "Venta o alquiler" },
] as const;

export type OfferType = (typeof OFFER_TYPES)[number]["value"] | "";

export function offerTypeFromValues(
  saleEnabled: boolean,
  rentEnabled: boolean,
  rentTemporary: boolean,
): OfferType {
  if (saleEnabled && rentEnabled) return "BOTH";
  if (rentEnabled) return rentTemporary ? "RENT_TEMP" : "RENT";
  if (saleEnabled) return "SALE";
  return "";
}

export function PropertyOfferTypeSelect({
  offerType,
  required,
  onChange,
}: {
  offerType: OfferType;
  required?: boolean;
  onChange: (value: OfferType) => void;
}) {
  return (
    <StyledSelect
      id="offerType"
      name="offerType"
      required={required}
      value={offerType}
      onChange={(e) => onChange(e.target.value as OfferType)}
    >
      <option value="">Seleccione una opción</option>
      {OFFER_TYPES.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </StyledSelect>
  );
}

export function PropertyOfferPriceFields({
  offerType,
  agents,
  defaultSalePrice,
  defaultSaleCurrency,
  defaultSaleWhatsapp,
  defaultSaleShowPrice,
  defaultRentPrice,
  defaultRentCurrency,
  defaultRentWhatsapp,
  defaultRentShowPrice,
  onDirty,
}: {
  offerType: OfferType;
  agents: { id: string; label: string }[];
  defaultSalePrice: string;
  defaultSaleCurrency: string;
  defaultSaleWhatsapp: string;
  defaultSaleShowPrice: boolean;
  defaultRentPrice: string;
  defaultRentCurrency: string;
  defaultRentWhatsapp: string;
  defaultRentShowPrice: boolean;
  onDirty: () => void;
}) {
  const showSale = offerType === "SALE" || offerType === "BOTH";
  const showRent = offerType === "RENT" || offerType === "RENT_TEMP" || offerType === "BOTH";
  const isTemp = offerType === "RENT_TEMP";

  return (
    <div className={`grid gap-4 ${showSale && showRent ? "sm:grid-cols-2" : ""}`}>
      <div className={showSale ? "space-y-4 rounded-xl border p-4" : "hidden"}>
        <p className="text-sm font-semibold">Oferta de venta</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="salePrice" className="mb-1.5 block text-sm font-medium">
              Precio de venta
            </label>
            <input
              id="salePrice"
              name="salePrice"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaultSalePrice}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Vacío: consultar precio.</p>
          </div>
          <div>
            <label htmlFor="saleCurrency" className="mb-1.5 block text-sm font-medium">
              Moneda de venta
            </label>
            <StyledSelect id="saleCurrency" name="saleCurrency" defaultValue={defaultSaleCurrency}>
              <option value="">Seleccione una opción</option>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </StyledSelect>
          </div>
          <div>
            <label htmlFor="saleWhatsapp" className="mb-1.5 block text-sm font-medium">
              Agente (WhatsApp de venta)
            </label>
            <SearchableSelect
              name="saleWhatsapp"
              options={agents}
              defaultValue={defaultSaleWhatsapp}
              placeholder="Buscar agente…"
              onDirty={onDirty}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sin elegir: sin botón de WhatsApp. Se cargan en Gestión → Agentes.
            </p>
          </div>
        </div>
        <ToggleField
          name="saleShowPrice"
          label="Mostrar precio en el sitio"
          defaultChecked={defaultSaleShowPrice}
        />
        <p className="text-xs text-muted-foreground">
          Si lo apagás, el precio se sigue guardando (para tus estadísticas) pero el sitio muestra
          &quot;Consultar precio&quot;.
        </p>
      </div>
      <div className={showRent ? "space-y-4 rounded-xl border p-4" : "hidden"}>
        <p className="text-sm font-semibold">Oferta de alquiler</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rentPrice" className="mb-1.5 block text-sm font-medium">
              {isTemp ? "Precio por día" : "Alquiler mensual"}
            </label>
            <input
              id="rentPrice"
              name="rentPrice"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaultRentPrice}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Vacío: consultar precio.</p>
          </div>
          <div>
            <label htmlFor="rentCurrency" className="mb-1.5 block text-sm font-medium">
              Moneda de alquiler
            </label>
            <StyledSelect id="rentCurrency" name="rentCurrency" defaultValue={defaultRentCurrency}>
              <option value="">Seleccione una opción</option>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </StyledSelect>
          </div>
          <div>
            <label htmlFor="rentWhatsapp" className="mb-1.5 block text-sm font-medium">
              Agente (WhatsApp de alquiler)
            </label>
            <SearchableSelect
              name="rentWhatsapp"
              options={agents}
              defaultValue={defaultRentWhatsapp}
              placeholder="Buscar agente…"
              onDirty={onDirty}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sin elegir: sin botón de WhatsApp. Se cargan en Gestión → Agentes.
            </p>
          </div>
        </div>
        <ToggleField
          name="rentShowPrice"
          label="Mostrar precio en el sitio"
          defaultChecked={defaultRentShowPrice}
        />
        <p className="text-xs text-muted-foreground">
          Si lo apagás, el precio se sigue guardando (útil para tus estadísticas de facturación
          mensual) pero el sitio muestra &quot;Consultar precio&quot;.
        </p>
      </div>
    </div>
  );
}

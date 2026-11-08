"use client";
import { useId, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Loader2, Lock, UserRoundPlusIcon } from "lucide-react";
import { modules, labels } from "@/lib/estate/modules";
import { saveEstateRecord } from "@/app/admin/gestion/actions";
import { SECTION_NAV_ACTIONS_ID } from "@/components/estate/section-nav";
import { inputClass } from "@/components/estate/form-field-class";
import { PropertyImagesManager } from "@/components/estate/property-images-manager";
import { ToggleField } from "@/components/estate/toggle-field";
import { PropertyVideoField } from "@/components/estate/property-video-field";
import { SearchableSelect } from "@/components/estate/searchable-select";
import { StyledSelect } from "@/components/estate/styled-select";
import { ContactQuickCreateModal } from "@/components/estate/contact-quick-create-modal";
import {
  PropertyOfferPriceFields,
  PropertyOfferTypeSelect,
  type OfferType,
} from "@/components/estate/property-offer-fields";
import { ContractLateFeeFields, ContractDepositFields } from "@/components/estate/contract-payment-fields";
import { AgentInitialAccessFields } from "@/components/estate/agent-initial-access-fields";

export { inputClass };

const PropertyLocationPicker = dynamic(
  () =>
    import("@/components/estate/property-location-picker").then(
      (m) => m.PropertyLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

const noopSubscribe = () => () => {};

export function RecordForm({
  module,
  id,
  values = {},
  options,
  media,
}: {
  module: string;
  id?: string;
  values?: Record<string, string | boolean | string[]>;
  options: Record<string, { id: string; label: string }[] | string[]>;
  media?: { id: string; url: string }[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [offerType, setOfferType] = useState<OfferType>(
    (values.offerType as OfferType | undefined) ?? "",
  );
  const [lateFeeEnabled, setLateFeeEnabled] = useState(values.lateFeeEnabled === true);
  const [hasDeposit, setHasDeposit] = useState(values.hasDeposit === true);
  const [updateType, setUpdateType] = useState(String(values.updateType ?? "NONE"));
  const [tenantContactId, setTenantContactId] = useState(
    values.contactId ? String(values.contactId) : "",
  );
  const [extraContacts, setExtraContacts] = useState<{ id: string; label: string }[]>([]);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const markDirty = () => setDirty(true);
  const formId = useId();
  // El hueco del SectionNav ya está en el DOM cuando hidrata el form (se
  // renderizan en el mismo server component); en el server no hay DOM.
  const navSlot = useSyncExternalStore(
    noopSubscribe,
    () => document.getElementById(SECTION_NAV_ACTIONS_ID),
    () => null,
  );
  const submitLabel = pending
    ? "Guardando…"
    : id
      ? "Guardar cambios"
      : `Crear ${modules[module].singular}`;
  return (
    <form
      id={formId}
      ref={ref}
      onChange={markDirty}
      action={(form) =>
        start(async () => {
          setError("");
          setSaved(false);
          try {
            const result = await saveEstateRecord(module, id ?? null, form);
            if ("error" in result) {
              setError(result.error);
              return;
            }
            setSaved(true);
            setDirty(false);
            if (!id) {
              if (module === "propiedades") {
                router.push(`/admin/gestion/propiedades/${result.id}`);
              } else if (module === "contratos") {
                // replace (no push) y sin scroll: Next igual va a buscar los
                // datos de la ficha nueva, pero sin sumar una entrada al
                // historial ni resetear el scroll — se siente como quedarse
                // en la misma pantalla en vez de "cambiar de página".
                router.replace(`/admin/gestion/contratos/${result.id}`, { scroll: false });
              } else if (module === "clientes") {
                router.replace(`/admin/gestion/clientes/${result.id}`, { scroll: false });
              } else if (module === "agentes") {
                router.replace(`/admin/gestion/agentes?edit=${result.id}`, { scroll: false });
              } else {
                ref.current?.reset();
              }
            }
            router.refresh();
          } catch {
            setError("No se pudo conectar. Intentá nuevamente.");
          }
        })
      }
      className="space-y-5"
    >
      <fieldset
        disabled={pending}
        className="grid gap-4 sm:grid-cols-2 disabled:opacity-60"
      >
        {modules[module].fields
          .filter(
            (field) =>
              !(
                module === "propiedades" &&
                ["longitude", "saleCurrency", "rentPrice", "rentCurrency"].includes(field.name)
              ) &&
              !(
                module === "contratos" &&
                [
                  "lateFeeValue",
                  "lateFeeFromDay",
                  "lateFeeFrequency",
                  "lateFeeCap",
                  "depositCurrency",
                  "depositInstallments",
                  "depositStatus",
                  "depositHeldBy",
                ].includes(field.name)
              ),
          )
          .map((field) => {
          if (field.type === "section") {
            return (
              <div
                key={field.name}
                id={field.name}
                className="mt-2 scroll-mt-6 border-t pt-5 first:mt-0 first:border-t-0 first:pt-0 sm:col-span-2"
              >
                <p className="text-sm font-semibold">{field.label}</p>
              </div>
            );
          }
          const value = values[field.name];
          const type = field.type ?? "text";
          const isLocationField = module === "propiedades" && field.name === "latitude";
          const isOfferTypeField = module === "propiedades" && field.name === "offerType";
          const isOfferPriceField = module === "propiedades" && field.name === "salePrice";
          const isVideoField = module === "propiedades" && field.name === "videoUrl";
          const isLateFeeToggle = module === "contratos" && field.name === "lateFeeEnabled";
          const isLateFeeCluster = module === "contratos" && field.name === "lateFeeType";
          const isDepositToggle = module === "contratos" && field.name === "hasDeposit";
          const isDepositCluster = module === "contratos" && field.name === "depositAmount";
          const isUpdateTypeField = module === "contratos" && field.name === "updateType";
          const isUpdatePercentField = module === "contratos" && field.name === "updatePercent";
          const isTenantContactField = module === "contratos" && field.name === "contactId";
          const catalogKey =
            module === "propiedades" && field.name === "propertyType"
              ? "propertyTypes"
              : module === "propiedades" && field.name === "city"
                ? "cities"
                : module === "propiedades" && field.name === "neighborhood"
                  ? "neighborhoods"
                  : module === "contratos" && field.name === "contractType"
                    ? "contractTypes"
                    : module === "contratos" && field.name === "propertyDestination"
                      ? "propertyDestinations"
                      : undefined;
          return (
            <div
              key={field.name}
              className={[
                type === "textarea" ||
                field.name === "seoTitle" ||
                type === "roles" ||
                type === "file" ||
                type === "floor-plan" ||
                isLocationField ||
                isOfferPriceField ||
                isVideoField ||
                isLateFeeCluster ||
                isDepositCluster
                  ? "sm:col-span-2"
                  : "",
                field.private ? "rounded-xl border border-amber-200 bg-amber-50/60 p-3" : "",
                isUpdatePercentField && updateType !== "FIXED_PERCENT" ? "hidden" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {type === "checkbox" ? (
                isLateFeeToggle ? (
                  <ToggleField
                    name="lateFeeEnabled"
                    label={field.label}
                    checked={lateFeeEnabled}
                    onChange={(v) => {
                      setLateFeeEnabled(v);
                      markDirty();
                    }}
                  />
                ) : isDepositToggle ? (
                  <ToggleField
                    name="hasDeposit"
                    label={field.label}
                    checked={hasDeposit}
                    onChange={(v) => {
                      setHasDeposit(v);
                      markDirty();
                    }}
                  />
                ) : (
                  <ToggleField
                    name={field.name}
                    label={field.label}
                    defaultChecked={
                      !id && field.name === "published" ? true : value === true
                    }
                  />
                )
              ) : isOfferPriceField ? (
                <PropertyOfferPriceFields
                  offerType={offerType}
                  agents={(options.agents as { id: string; label: string }[] | undefined) ?? []}
                  defaultSalePrice={values.salePrice ? String(values.salePrice) : ""}
                  defaultSaleCurrency={values.saleCurrency ? String(values.saleCurrency) : "USD"}
                  defaultSaleWhatsapp={values.saleWhatsapp ? String(values.saleWhatsapp) : ""}
                  defaultSaleShowPrice={values.saleShowPrice !== false}
                  defaultRentPrice={values.rentPrice ? String(values.rentPrice) : ""}
                  defaultRentCurrency={values.rentCurrency ? String(values.rentCurrency) : "ARS"}
                  defaultRentWhatsapp={values.rentWhatsapp ? String(values.rentWhatsapp) : ""}
                  defaultRentShowPrice={values.rentShowPrice !== false}
                  onDirty={markDirty}
                />
              ) : isLateFeeCluster ? (
                <ContractLateFeeFields
                  enabled={lateFeeEnabled}
                  defaults={{
                    lateFeeType: values.lateFeeType ? String(values.lateFeeType) : "",
                    lateFeeValue: values.lateFeeValue ? String(values.lateFeeValue) : "",
                    lateFeeFromDay: values.lateFeeFromDay ? String(values.lateFeeFromDay) : "",
                    lateFeeFrequency: values.lateFeeFrequency ? String(values.lateFeeFrequency) : "",
                    lateFeeCap: values.lateFeeCap ? String(values.lateFeeCap) : "",
                  }}
                  onDirty={markDirty}
                />
              ) : isDepositCluster ? (
                <ContractDepositFields
                  enabled={hasDeposit}
                  defaults={{
                    depositAmount: values.depositAmount ? String(values.depositAmount) : "",
                    depositCurrency: values.depositCurrency ? String(values.depositCurrency) : "",
                    depositInstallments: values.depositInstallments
                      ? String(values.depositInstallments)
                      : "",
                    depositStatus: values.depositStatus ? String(values.depositStatus) : "",
                    depositHeldBy: values.depositHeldBy ? String(values.depositHeldBy) : "",
                  }}
                  onDirty={markDirty}
                />
              ) : (
                <>
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  >
                    {field.label}
                    {field.required ? " *" : ""}
                    {field.private && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Lock className="size-3" />
                        No se publica
                      </span>
                    )}
                  </label>
                  {isOfferTypeField ? (
                    <PropertyOfferTypeSelect
                      offerType={offerType}
                      required
                      onChange={(v) => {
                        setOfferType(v);
                        markDirty();
                      }}
                    />
                  ) : isUpdateTypeField ? (
                    <StyledSelect
                      id="updateType"
                      name="updateType"
                      required
                      value={updateType}
                      onChange={(e) => {
                        setUpdateType(e.target.value);
                        markDirty();
                      }}
                    >
                      <option value="">Seleccione una opción</option>
                      {field.options?.map((o) => (
                        <option key={o} value={o}>
                          {labels[o] ?? o}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : catalogKey ? (
                    <StyledSelect
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      defaultValue={String(value ?? "")}
                    >
                      <option value="">Seleccione una opción</option>
                      {((options[catalogKey] as string[] | undefined) ?? []).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : isLocationField ? (
                    <PropertyLocationPicker
                      initialLat={values.latitude ? String(values.latitude) : undefined}
                      initialLng={values.longitude ? String(values.longitude) : undefined}
                      initialAddress={values.mapAddress ? String(values.mapAddress) : undefined}
                      onDirty={markDirty}
                    />
                  ) : type === "floor-plan" ? (
                    <div className="space-y-3">
                      {value && (
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <a href={String(value)} target="_blank" rel="noreferrer" className="text-primary underline">Ver plano actual</a>
                          <label className="flex items-center gap-2"><input type="checkbox" name="removeFloorPlan" /> Quitar plano</label>
                        </div>
                      )}
                      <input id={field.name} name="floorPlan" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={inputClass} />
                    </div>
                  ) : isVideoField ? (
                    <PropertyVideoField
                      defaultValue={value ? String(value) : ""}
                      onDirty={markDirty}
                    />
                  ) : type === "roles" ? (
                    <div className="flex flex-wrap gap-3">
                      {field.options?.map((option) => (
                        <label
                          key={option}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name={field.name}
                            value={option}
                            defaultChecked={
                              Array.isArray(value)
                                ? value.includes(option)
                                : option === "PROSPECT"
                            }
                          />
                          {labels[option] ?? option}
                        </label>
                      ))}
                    </div>
                  ) : isTenantContactField ? (
                    <div className="flex items-start gap-2">
                      <div className="flex-1" key={tenantContactId}>
                        <SearchableSelect
                          name="contactId"
                          required={field.required}
                          defaultValue={tenantContactId}
                          options={[
                            ...((options.contacts as { id: string; label: string }[] | undefined) ??
                              []),
                            ...extraContacts,
                          ]}
                          onDirty={markDirty}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setTenantModalOpen(true)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium"
                      >
                        <UserRoundPlusIcon className="size-4" />
                        Nuevo
                      </button>
                      <ContactQuickCreateModal
                        open={tenantModalOpen}
                        role="TENANT"
                        title="Nuevo inquilino"
                        onClose={() => setTenantModalOpen(false)}
                        onCreated={(contact) => {
                          setExtraContacts((prev) => [...prev, contact]);
                          setTenantContactId(contact.id);
                          setTenantModalOpen(false);
                          markDirty();
                        }}
                      />
                    </div>
                  ) : field.relation ? (
                    <SearchableSelect
                      name={field.name}
                      required={field.required}
                      defaultValue={value ? String(value) : ""}
                      options={
                        (options[field.relation] as { id: string; label: string }[] | undefined) ??
                        []
                      }
                      onDirty={markDirty}
                    />
                  ) : field.options ? (
                    <StyledSelect
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      defaultValue={String(value ?? "")}
                    >
                      <option value="">{module === "propiedades" && ["orientation", "petsPolicy", "creditEligible"].includes(field.name) ? "Sin especificar" : "Seleccione una opción"}</option>
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {labels[o] ?? o}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      defaultValue={String(value ?? "")}
                      rows={4}
                      maxLength={15000}
                      className={inputClass}
                    />
                  ) : type === "file" && module === "propiedades" ? (
                    <PropertyImagesManager
                      propertyId={id}
                      images={media ?? []}
                      onDirty={markDirty}
                    />
                  ) : type === "file" ? (
                    <input
                      id={field.name}
                      name={field.name}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className={inputClass}
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={
                        type === "decimal" || type === "coordinate"
                          ? "number"
                          : type
                      }
                      min={
                        type === "number" || type === "decimal" ? 0 : undefined
                      }
                      step={
                        type === "decimal"
                          ? "0.01"
                          : type === "coordinate"
                            ? "0.0000001"
                            : undefined
                      }
                      required={field.required}
                      defaultValue={String(
                        value ?? (type === "number" && module === "propiedades" ? 0 : ""),
                      ).slice(0, type === "date" ? 10 : undefined)}
                      className={inputClass}
                    />
                  )}
                </>
              )}
              {field.hint && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {field.hint}
                </p>
              )}
            </div>
          );
        })}
        {module === "agentes" && !id && <AgentInitialAccessFields />}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-emerald-600"
        >
          <CheckCircle2 className="size-4" />
          Guardado correctamente
        </p>
      )}
      <button
        disabled={pending || !dirty}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </button>
      {navSlot &&
        createPortal(
          <div className="space-y-2">
            <button
              type="submit"
              form={formId}
              disabled={pending || !dirty}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </button>
            {saved && !dirty && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Guardado
              </p>
            )}
          </div>,
          navSlot,
        )}
    </form>
  );
}

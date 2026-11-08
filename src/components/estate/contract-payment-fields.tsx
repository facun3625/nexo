"use client";
import { inputClass } from "@/components/estate/form-field-class";
import { StyledSelect } from "@/components/estate/styled-select";
import { labels } from "@/lib/estate/modules";

// Punitorios (Etapa 2) — calcado de PropertyOfferPriceFields: nunca se
// desmonta, se oculta con className para que los inputs sigan viajando en
// el único submit del formulario aunque estén tapados.
export function ContractLateFeeFields({
  enabled,
  defaults,
  onDirty,
}: {
  enabled: boolean;
  defaults: {
    lateFeeType: string;
    lateFeeValue: string;
    lateFeeFromDay: string;
    lateFeeFrequency: string;
    lateFeeCap: string;
  };
  onDirty: () => void;
}) {
  const LATE_FEE_TYPES = ["PERCENTAGE", "FIXED"] as const;
  const LATE_FEE_FREQUENCIES = ["DAILY", "MONTHLY", "ONCE"] as const;
  return (
    <div
      className={
        enabled ? "grid gap-4 rounded-xl border p-4 sm:grid-cols-2" : "hidden"
      }
    >
      <div>
        <label htmlFor="lateFeeType" className="mb-1.5 block text-sm font-medium">
          Tipo de punitorio
        </label>
        <StyledSelect
          id="lateFeeType"
          name="lateFeeType"
          defaultValue={defaults.lateFeeType}
          onChange={onDirty}
        >
          <option value="">Seleccione una opción</option>
          {LATE_FEE_TYPES.map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </StyledSelect>
      </div>
      <div>
        <label htmlFor="lateFeeValue" className="mb-1.5 block text-sm font-medium">
          Valor del punitorio
        </label>
        <input
          id="lateFeeValue"
          name="lateFeeValue"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaults.lateFeeValue}
          className={inputClass}
          onChange={onDirty}
        />
      </div>
      <div>
        <label htmlFor="lateFeeFromDay" className="mb-1.5 block text-sm font-medium">
          Desde qué día
        </label>
        <input
          id="lateFeeFromDay"
          name="lateFeeFromDay"
          type="number"
          min={0}
          defaultValue={defaults.lateFeeFromDay}
          className={inputClass}
          onChange={onDirty}
        />
      </div>
      <div>
        <label htmlFor="lateFeeFrequency" className="mb-1.5 block text-sm font-medium">
          Frecuencia
        </label>
        <StyledSelect
          id="lateFeeFrequency"
          name="lateFeeFrequency"
          defaultValue={defaults.lateFeeFrequency}
          onChange={onDirty}
        >
          <option value="">Seleccione una opción</option>
          {LATE_FEE_FREQUENCIES.map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </StyledSelect>
      </div>
      <div>
        <label htmlFor="lateFeeCap" className="mb-1.5 block text-sm font-medium">
          Tope opcional
        </label>
        <input
          id="lateFeeCap"
          name="lateFeeCap"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaults.lateFeeCap}
          className={inputClass}
          onChange={onDirty}
        />
      </div>
    </div>
  );
}

// Depósito (Etapa 4) — mismo esqueleto que ContractLateFeeFields.
export function ContractDepositFields({
  enabled,
  defaults,
  onDirty,
}: {
  enabled: boolean;
  defaults: {
    depositAmount: string;
    depositCurrency: string;
    depositInstallments: string;
    depositStatus: string;
    depositHeldBy: string;
  };
  onDirty: () => void;
}) {
  const DEPOSIT_STATUSES = ["PENDING", "PARTIAL", "PAID"] as const;
  const HELD_BY = ["AGENCY", "OWNER"] as const;
  return (
    <div
      className={
        enabled ? "grid gap-4 rounded-xl border p-4 sm:grid-cols-2" : "hidden"
      }
    >
      <div>
        <label htmlFor="depositAmount" className="mb-1.5 block text-sm font-medium">
          Importe del depósito
        </label>
        <input
          id="depositAmount"
          name="depositAmount"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaults.depositAmount}
          className={inputClass}
          onChange={onDirty}
        />
      </div>
      <div>
        <label htmlFor="depositCurrency" className="mb-1.5 block text-sm font-medium">
          Moneda
        </label>
        <StyledSelect
          id="depositCurrency"
          name="depositCurrency"
          defaultValue={defaults.depositCurrency}
          onChange={onDirty}
        >
          <option value="">Seleccione una opción</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </StyledSelect>
      </div>
      <div>
        <label htmlFor="depositInstallments" className="mb-1.5 block text-sm font-medium">
          Cantidad de cuotas
        </label>
        <input
          id="depositInstallments"
          name="depositInstallments"
          type="number"
          min={1}
          defaultValue={defaults.depositInstallments}
          className={inputClass}
          onChange={onDirty}
        />
      </div>
      <div>
        <label htmlFor="depositStatus" className="mb-1.5 block text-sm font-medium">
          Estado
        </label>
        <StyledSelect
          id="depositStatus"
          name="depositStatus"
          defaultValue={defaults.depositStatus}
          onChange={onDirty}
        >
          <option value="">Seleccione una opción</option>
          {DEPOSIT_STATUSES.map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </StyledSelect>
      </div>
      <div>
        <label htmlFor="depositHeldBy" className="mb-1.5 block text-sm font-medium">
          Quién conserva el depósito
        </label>
        <StyledSelect
          id="depositHeldBy"
          name="depositHeldBy"
          defaultValue={defaults.depositHeldBy}
          onChange={onDirty}
        >
          <option value="">Seleccione una opción</option>
          {HELD_BY.map((o) => (
            <option key={o} value={o}>
              {labels[o] ?? o}
            </option>
          ))}
        </StyledSelect>
      </div>
    </div>
  );
}

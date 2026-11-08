export function ToggleField({
  name,
  label,
  defaultChecked,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  // Modo controlado (checked+onChange) — para cuando otro campo depende en
  // vivo de este toggle (ver ContractLateFeeFields/ContractDepositFields).
  // Sin estos dos props se comporta como siempre, no controlado.
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  const controlled = checked !== undefined;
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          className="peer sr-only"
          {...(controlled
            ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) }
            : { defaultChecked })}
        />
        <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
        <span className="pointer-events-none relative left-1 inline-block size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "lucide-react";
import { inputClass } from "@/components/estate/form-field-class";

export function StyledSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClass} appearance-none pr-9 ${className ?? ""}`}
      />
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

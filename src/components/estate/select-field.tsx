import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "lucide-react";

import { inputClass } from "./form-field-class";

// El <select> nativo trae su propia flechita, que en Chrome/Safari/Firefox
// se ve distinta y no combina con el resto de los inputs — se la oculta
// (appearance-none) y se dibuja una propia siempre igual.
export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${inputClass} appearance-none pr-8 ${className ?? ""}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  },
);

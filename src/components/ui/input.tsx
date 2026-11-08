"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const PICKER_TYPES = new Set(["date", "datetime-local", "time", "month", "week"])

function Input({ className, type, onClick, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onClick={(e) => {
        onClick?.(e)
        // En los inputs de fecha/hora nativos, un click en cualquier parte
        // del campo (no solo en el ícono) abre el selector — si no, parece
        // que no hace nada al tocarlo.
        if (type && PICKER_TYPES.has(type)) {
          try {
            ;(e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()
          } catch {
            // showPicker() puede tirar si el navegador no lo soporta bien
            // (o el input está disabled/readonly) — no hace falta más.
          }
        }
      }}
      {...props}
    />
  )
}

export { Input }

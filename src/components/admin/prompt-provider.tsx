"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminTheme } from "./admin-theme-root";

type PromptOptions = {
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "text" | "number";
};

type PromptFn = (options: PromptOptions | string) => Promise<string | null>;

const PromptContext = createContext<PromptFn>(async () => null);

export function usePrompt() {
  return useContext(PromptContext);
}

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const { containerRef } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({});
  const [value, setValue] = useState("");
  const resolveRef = useRef<(value: string | null) => void>(() => {});

  const prompt = useCallback<PromptFn>((opts) => {
    const resolved = typeof opts === "string" ? { label: opts } : opts;
    setOptions(resolved);
    setValue(resolved.defaultValue ?? "");
    setOpen(true);
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(result: string | null) {
    setOpen(false);
    resolveRef.current(result);
  }

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && settle(null)}>
        <DialogContent container={containerRef} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{options.title ?? "Ingresá un valor"}</DialogTitle>
            {options.description && <DialogDescription>{options.description}</DialogDescription>}
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              settle(value);
            }}
            className="flex flex-col gap-2"
          >
            {options.label && <label className="text-sm font-medium">{options.label}</label>}
            <Input
              autoFocus
              type={options.type ?? "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={options.placeholder}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => settle(null)}>
                {options.cancelLabel ?? "Cancelar"}
              </Button>
              <Button type="submit">{options.confirmLabel ?? "Aplicar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PromptContext.Provider>
  );
}

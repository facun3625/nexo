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
import { useAdminTheme } from "./admin-theme-root";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { containerRef } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ description: "" });
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(typeof opts === "string" ? { description: opts } : opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function settle(result: boolean) {
    setOpen(false);
    resolveRef.current(result);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && settle(false)}>
        <DialogContent container={containerRef} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{options.title ?? "¿Estás seguro?"}</DialogTitle>
            <DialogDescription>{options.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {options.cancelLabel ?? "Cancelar"}
            </Button>
            <Button variant={options.destructive ? "destructive" : "default"} onClick={() => settle(true)}>
              {options.confirmLabel ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

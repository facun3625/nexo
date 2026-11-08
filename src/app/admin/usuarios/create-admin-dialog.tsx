"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, UserPlusIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminTheme } from "@/components/admin/admin-theme-root";
import { createAdmin } from "./actions";

export function CreateAdminDialog() {
  const { containerRef } = useAdminTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError("");
      setShowPassword(false);
    }
  }

  // onSubmit y no action={}: React vacía el formulario al terminar una action,
  // y ante un error se perdería lo que ya se escribió.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    start(async () => {
      const result = await createAdmin(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success("Usuario creado");
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <UserPlusIcon className="size-4" />
        Crear usuario
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent container={containerRef}>
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
            <div className="space-y-1.5">
              <Label htmlFor="new-user-name">Nombre *</Label>
              <Input id="new-user-name" name="name" required maxLength={200} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-user-email">Email (es su usuario para entrar) *</Label>
              <Input id="new-user-email" name="email" type="email" required autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-user-password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="new-user-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres. Va a tener acceso de administrador.</p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creando…" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

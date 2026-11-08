"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activatePortalAccount } from "./actions";

export function ActivateForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError("");
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    startTransition(async () => {
      const result = await activatePortalAccount(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-sm">
          Listo, ya podés entrar con tu email y la contraseña que elegiste.
        </p>
        <Link href="/login" className="text-sm text-primary hover:opacity-80">
          Ir a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="activate-email">Email</Label>
        <Input id="activate-email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activate-taxid">DNI</Label>
        <Input id="activate-taxid" name="taxId" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activate-password">Elegí una contraseña</Label>
        <Input id="activate-password" name="password" type="password" required minLength={6} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activate-confirm">Repetila</Label>
        <Input id="activate-confirm" name="confirmPassword" type="password" required minLength={6} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Activando..." : "Activar mi cuenta"}
      </Button>
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">
        Ya tengo cuenta, ir a ingresar
      </Link>
    </form>
  );
}

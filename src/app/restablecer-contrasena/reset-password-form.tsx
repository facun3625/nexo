"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "./actions";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  if (!email || !token) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Este link no es válido. Pedí uno nuevo desde el login.
        </p>
        <Link href="/recuperar-contrasena" className="text-sm text-primary hover:opacity-80">
          Pedir un link nuevo
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await resetPassword(email, token, password);
        toast.success("Contraseña actualizada — iniciá sesión de nuevo");
        router.push("/login");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar la contraseña");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}

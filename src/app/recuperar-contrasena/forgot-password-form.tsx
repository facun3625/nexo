"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await requestPasswordReset(email);
        setSent(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo procesar la solicitud");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-sm">
          Si <strong>{email}</strong> tiene una cuenta con nosotros, te va a llegar un mail con el
          link para elegir una nueva contraseña.
        </p>
        <Link href="/login" className="text-sm text-primary hover:opacity-80">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Mandar link"}
      </Button>
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">
        Volver al login
      </Link>
    </form>
  );
}

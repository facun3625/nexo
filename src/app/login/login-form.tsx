"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Input con label flotante dentro del campo */
function FloatingInput({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
  suffix,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const lifted = focused || hasValue;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 transition-all duration-150 select-none",
          lifted
            ? "top-2 text-[10px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
        )}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "peer w-full rounded-xl border bg-background px-4 pb-2.5 pt-6 text-sm text-foreground outline-none transition-colors",
          "border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
          suffix && "pr-10",
        )}
        autoComplete={type === "password" ? "current-password" : undefined}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

export function LoginForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      tenantId,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Email o contraseña incorrectos");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="flex w-full flex-col gap-3">
      <FloatingInput
        id="login-email"
        label="Email"
        type="email"
        required
        value={loginEmail}
        onChange={setLoginEmail}
      />
      <div className="flex flex-col gap-1.5">
        <FloatingInput
          id="login-password"
          label="Contraseña"
          type="password"
          required
          value={loginPassword}
          onChange={setLoginPassword}
        />
        <Link
          href="/recuperar-contrasena"
          className="self-end text-xs text-muted-foreground"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="mt-1 w-full rounded-full"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}

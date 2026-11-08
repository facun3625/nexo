import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string; agentDisabled?: string }>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const { onboarded, agentDisabled } = await searchParams;
  const { storeName, logoUrl } = await getStoreSettings(tenant.id);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-0 overflow-hidden rounded-2xl bg-background shadow-2xl ring-1 ring-border">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 bg-muted/40 px-6 py-7 text-center">
          {logoUrl && (
            <div className="rounded-xl bg-white px-3 py-2">
              <Image src={logoUrl} alt={storeName} width={220} height={64} className="h-16 w-auto max-w-[220px] object-contain" />
            </div>
          )}
          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-xl font-semibold">{onboarded ? "¡Tu tienda ya está lista!" : "Bienvenido"}</h1>
            <p className="text-sm text-muted-foreground">
              {onboarded ? "Iniciá sesión con la misma cuenta para entrar a tu panel de administración" : "Ingresá a tu cuenta"}
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="px-6 py-6">
          {agentDisabled === "1" && <p role="alert" className="mb-4 text-sm text-destructive">Tu acceso de agente está deshabilitado. Contactá al administrador de la inmobiliaria.</p>}
          <Suspense>
            <LoginForm tenantId={tenant.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

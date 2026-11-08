import { NextRequest, NextResponse } from "next/server";

import { secretMatches } from "@/lib/cron-auth";
import { runEstateBillingCycle } from "@/lib/estate/billing-cron";

// Corre diario sobre todas las tiendas, un contrato a la vez — el volumen
// esperado no justifica una transacción masiva ni un job en cola. La lógica
// en sí vive en runEstateBillingCycle (ver ese archivo), compartida con el
// botón "Generar cargos de este mes" del panel (mismo cálculo, acotado a un
// solo tenantId en vez de todas las tiendas).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !secretMatches(req.headers.get("authorization"), cronSecret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await runEstateBillingCycle({ status: "ACTIVE" });
  return NextResponse.json(result);
}

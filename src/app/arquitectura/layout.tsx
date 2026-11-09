import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// La sección Arquitectura se prende desde Página web → Arquitectura. Oculta,
// el público ve un 404; el admin del sitio la sigue viendo (con un aviso)
// para poder armar el contenido antes de publicarla.
export default async function ArquitecturaLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const { showArquitectura } = await getStoreSettings(tenant.id);
  if (showArquitectura) return children;

  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN" && session.user.tenantId === tenant.id;
  if (!isAdmin) notFound();

  return (
    <>
      <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Vista previa: la sección Arquitectura está oculta al público. Se activa desde Página web → Arquitectura.
      </div>
      {children}
    </>
  );
}

"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { ActionError, toUserError } from "@/lib/action-error";
import { searchCriteriaSchema, describeSearch } from "@/lib/estate/search-criteria";
import { getSearchOptions } from "@/lib/estate/search-options";

export async function updateInquirySearch(id: string, form: FormData) {
  try {
    const { tenant } = await requireTenantAdmin();
    const inquiry = await prisma.estateInquiry.findFirst({ where: { id, tenantId: tenant.id }, select: { searchCriteria: true } });
    if (!inquiry?.searchCriteria) throw new ActionError("Búsqueda no encontrada");
    const criteria = searchCriteriaSchema.parse(Object.fromEntries(form));
    const previous = searchCriteriaSchema.parse(inquiry.searchCriteria);
    const options = await getSearchOptions(tenant.id);
    if (criteria.city && criteria.city !== previous.city && !options.cities.includes(criteria.city)) throw new ActionError("Elegí una ciudad del listado");
    if (criteria.propertyType && criteria.propertyType !== previous.propertyType && !options.propertyTypes.includes(criteria.propertyType)) throw new ActionError("Elegí un tipo de propiedad del listado");
    await prisma.estateInquiry.update({
      where: { id, tenantId: tenant.id },
      data: { searchCriteria: criteria, message: `Búsqueda de propiedades: ${describeSearch(criteria).join(" · ")}.` },
    });
    revalidatePath("/admin/gestion/consultas");
    revalidatePath("/admin/gestion/busquedas");
    revalidatePath("/agente");
    return { ok: true };
  } catch (error) { return toUserError(error, "No se pudo actualizar la búsqueda"); }
}

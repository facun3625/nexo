import { saveUploadedFile } from "@/lib/storage";
import { ActionError } from "@/lib/action-error";

const MAX_PHOTOS = 8;

// Compartido entre el alta de reclamo del propietario (portal) y la del
// staff (admin) — ambas formas suben fotos de la misma manera, al mismo
// bucket, con el mismo tope.
export async function uploadClaimPhotos(form: FormData, tenantId: string): Promise<string[]> {
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) {
    throw new ActionError(`Podés subir hasta ${MAX_PHOTOS} fotos por reclamo`);
  }
  return Promise.all(files.map((file) => saveUploadedFile(file, `${tenantId}/postventa-reclamos`)));
}

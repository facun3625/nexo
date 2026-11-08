"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatabaseBackupIcon, DownloadIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format";
import { createBackupNow } from "./backup-actions";

export type BackupRow = { filename: string; sizeBytes: number; when: string };

export function BackupsPanel({ backups, max }: { backups: BackupRow[]; max: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Copias de seguridad</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Todos los días se hace sola una copia completa de la base de datos (propiedades, clientes, consultas,
            contratos…) y se guardan las últimas {max}. Podés descargarlas o crear una ahora antes de un cambio grande.
            Las fotos están guardadas aparte, en el almacenamiento de imágenes.
          </p>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await createBackupNow();
              if ("error" in result) toast.error(result.error);
              else toast.success("Copia de seguridad creada");
              router.refresh();
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <DatabaseBackupIcon className="size-4" />}
          Crear copia ahora
        </Button>
      </div>

      {backups.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Todavía no hay copias guardadas en el servidor.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {backups.map((b, i) => (
            <li key={b.filename} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium">
                  {b.when}
                  {i === 0 && <span className="ml-2 text-xs font-normal text-emerald-600 dark:text-emerald-400">Más reciente</span>}
                </span>
                <span className="text-xs text-muted-foreground">{formatFileSize(b.sizeBytes)}</span>
              </div>
              <Button size="sm" variant="outline" render={<a href={`/api/admin/backups/${b.filename}`} download />}>
                <DownloadIcon className="size-3.5" />
                Descargar
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        El archivo es un volcado de PostgreSQL (.dump): sirve para restaurar la base completa con pg_restore.
      </p>
    </section>
  );
}

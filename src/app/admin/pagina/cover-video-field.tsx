"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_MB = 50;

export function CoverVideoField({ url }: { url: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(url);
  const [progress, setProgress] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  function upload(file: File) {
    setError("");
    if (file.type !== "video/mp4") {
      setError("El video tiene que ser MP4.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El video pesa ${Math.round(file.size / 1024 / 1024)} MB y el máximo es ${MAX_MB} MB.`);
      return;
    }
    // XMLHttpRequest y no fetch: es lo que da el avance de la subida.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/cover-video");
    xhr.setRequestHeader("Content-Type", "video/mp4");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      let body: { url?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // nginx responde HTML si el archivo pasa su límite
      }
      if (xhr.status === 200 && body.url) {
        setCurrent(body.url);
        router.refresh();
      } else if (xhr.status === 413) {
        setError(body.error ?? `El servidor rechazó el archivo por tamaño (máximo ${MAX_MB} MB).`);
      } else {
        setError(body.error ?? "No se pudo subir el video. Probá de nuevo.");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setError("Se cortó la conexión mientras subía el video.");
    };
    setProgress(0);
    xhr.send(file);
  }

  async function remove() {
    setRemoving(true);
    setError("");
    const response = await fetch("/api/admin/cover-video", { method: "DELETE" });
    setRemoving(false);
    if (!response.ok) {
      setError("No se pudo quitar el video.");
      return;
    }
    setCurrent(null);
    router.refresh();
  }

  const uploading = progress !== null;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
      <Label>Video de portada</Label>
      <p className="text-sm text-muted-foreground">
        Si cargás un video, reemplaza a la foto de portada del Inicio. Se reproduce solo, sin sonido y en loop; la foto queda
        como imagen de espera mientras carga. MP4, hasta {MAX_MB} MB.
      </p>
      {current && (
        <video src={current} muted controls playsInline preload="metadata" className="aspect-[16/7] h-[200px] w-auto max-w-full rounded-xl bg-muted object-cover" />
      )}
      {uploading && (
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-2 max-w-sm overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={uploading || removing} onClick={() => inputRef.current?.click()}>
          {uploading ? `Subiendo… ${progress}%` : current ? "Cambiar video" : "Subir video"}
        </Button>
        {current && (
          <Button type="button" variant="ghost" size="sm" disabled={uploading || removing} onClick={remove}>
            Quitar video
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />
    </div>
  );
}

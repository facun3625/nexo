"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CameraIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { updateProfile } from "./actions";

type ProfileUser = {
  name: string;
  email: string;
  phone: string;
  address: string;
  image: string | null;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const { data: session, update } = useSession();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address);
  const [preview, setPreview] = useState<string | null>(user.image);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      if (session.user.image !== user.image || session.user.name !== user.name) {
        update({ name: user.name, image: user.image });
      }
    }
  }, [session?.user?.image, session?.user?.name, user.image, user.name, update]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Elegí un archivo de imagen");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("phone", phone);
        formData.set("address", address);
        if (file) formData.set("photo", file);
        const res = await updateProfile(formData);
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        await update({ name, image: res.image ?? user.image });
        // La vista previa venía de URL.createObjectURL — una URL temporal
        // que solo existe mientras dure esta pestaña. Sin este paso, al
        // recargar la página esa URL ya no resuelve a nada y el navegador
        // muestra el texto alternativo (el nombre) en vez de la foto.
        if (res.image) {
          if (file) URL.revokeObjectURL(preview!);
          setPreview(res.image);
        }
        setFile(null);
        toast.success("Perfil actualizado");
      } catch {
        toast.error("Se cortó la conexión. Probá de nuevo.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-12">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-4 ring-background shadow-md lg:size-32"
            aria-label="Cambiar foto de perfil"
          >
            {preview ? (
              <Image src={preview} alt={name} width={128} height={128} className="size-full object-cover" unoptimized={preview.startsWith("blob:")} />
            ) : (
              <UserIcon className="size-10 text-muted-foreground lg:size-14" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
              <CameraIcon className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
          <span className="pointer-events-none absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background lg:size-9 lg:ring-4">
            <CameraIcon className="size-3.5 lg:size-4" />
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground text-center">Tocá la foto para cambiarla</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-name">Nombre</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} disabled />
            <p className="text-[0.7rem] text-muted-foreground">No se puede cambiar — es tu usuario.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-phone">Teléfono</Label>
            <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-address">Dirección</Label>
            <Input id="profile-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Se usan para prellenar el checkout — no hace falta volver a escribirlos en cada pedido.
        </p>

        <Button type="submit" disabled={pending || (name === user.name && phone === user.phone && address === user.address && !file)} className="self-start mt-2">
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

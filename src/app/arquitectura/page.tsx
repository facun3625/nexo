import { redirect } from "next/navigation";

// "Arquitectura" en el menú es un desplegable; la URL suelta lleva a la
// primera sección.
export default function ArquitecturaPage() {
  redirect("/arquitectura/equipo");
}

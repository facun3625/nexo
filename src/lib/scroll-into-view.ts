// Callback ref para mensajes de "enviado": el formulario largo se reemplaza
// por un aviso corto, la página se achica y el usuario quedaba mirando el
// pie. Al montarse, el aviso se centra en pantalla.
export function scrollIntoViewOnMount(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

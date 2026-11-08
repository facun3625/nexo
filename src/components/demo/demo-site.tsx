"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

const services = [["Tasación", "tasacion"], ["Administración de Consorcios", "administracion-consorcios"], ["Proyecto y Ejecución de Obras", "obras"]];
const links = [["Inicio", ""], ["Nosotros", "nosotros"], ["Propiedades en Mapa", "mapa"], ["Recibir Alertas", "alertas"], ["Contacto", "contacto"]];

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  function item([label, slug]: string[]) {
    const href = `/demo${slug ? `/${slug}` : ""}`;
    return <Link key={slug} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined} className={`rounded-lg px-3 py-2 text-sm transition hover:bg-sky-50 hover:text-[#1e658c] ${pathname === href ? "font-semibold text-[#1e658c]" : "text-[#133453]"}`}>{label}</Link>;
  }
  return <div className="min-h-screen bg-white text-[#133453]">
    <div className="bg-[#133453] px-5 py-2 text-xs text-white"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2"><Link href="/" className="inline-flex items-center gap-1.5 hover:underline">← Volver a Urbi</Link><Link href="/registro" className="inline-flex items-center gap-2">Quiero una web así <ArrowRight size={14}/></Link></div></div>
    <header className="border-b border-slate-100 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5">
      <Link href="/demo" aria-label="Urbi, inicio"><Image src="/brand/logo.svg" width={595} height={180} alt="Urbi" className="h-11 w-auto" priority/></Link>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="demo-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} className="rounded-lg border border-slate-200 p-2 xl:hidden">{open ? <X/> : <Menu/>}</button>
      <nav id="demo-menu" aria-label="Menú de la inmobiliaria" className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-32 z-40 flex-col gap-1 border-b border-slate-200 bg-white p-5 shadow-lg xl:static xl:flex xl:flex-row xl:items-center xl:border-0 xl:p-0 xl:shadow-none`}>
        {links.slice(0, 2).map(item)}
        <details className="group relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sky-50">Servicios <ChevronDown size={14}/></summary><div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white p-2 xl:absolute xl:left-0 xl:top-full xl:z-50 xl:w-72 xl:shadow-lg">{services.map(item)}</div></details>
        {links.slice(2).map(item)}
      </nav>
    </div></header>
    <main>{children}</main>
    <section className="bg-[#208ab1] px-6 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6"><div><p className="text-sm text-white/80">¿Querés vender o alquilar?</p><h2 className="mt-2 text-3xl font-semibold">Conversemos sobre tu propiedad.</h2></div><Link href="/demo/contacto" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#133453]">Contactanos</Link></div></section>
    <footer className="bg-[#133453] px-6 py-12 text-white"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3"><div><Image src="/logo_blanco.svg" width={595} height={180} alt="Urbi" className="h-12 w-auto"/><p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">Un espacio para encontrar tu próxima propiedad y conocer nuestros servicios.</p></div><div><h2 className="font-semibold">Servicios</h2><div className="mt-3 flex flex-col gap-3 text-sm text-slate-300">{services.map(([label, slug]) => <Link key={slug} href={`/demo/${slug}`}>{label}</Link>)}</div></div><div><h2 className="font-semibold">Tu inmobiliaria, online</h2><p className="mt-3 text-sm leading-6 text-slate-300">Este sitio es una demostración. Propiedades y contenidos ilustrativos.</p><Link href="/" className="mt-4 inline-block text-sm text-[#51c2ec]">Conocé los planes de Urbi →</Link></div></div></footer>
  </div>;
}

export function DemoForm({ kind = "contacto" }: { kind?: string }) {
  const [sent, setSent] = useState(false);
  const input = "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-[#208ab1] focus:ring-2 focus:ring-sky-100";
  return <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="mb-6 text-sm leading-6 text-slate-500">Formulario de demostración. No se envían ni guardan datos.</p>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nombre<input required name="name" autoComplete="name" className={input}/></label><label className="text-sm font-medium">Email<input required type="email" name="email" autoComplete="email" className={input}/></label>
    {kind === "alertas" ? <><label className="text-sm font-medium">Operación<select className={input} name="operation"><option>Venta</option><option>Alquiler</option></select></label><label className="text-sm font-medium">Zona de interés<input required name="zone" className={input}/></label><label className="text-sm font-medium">Tipo de propiedad<select name="type" className={input}><option>Departamento</option><option>Casa</option><option>Terreno</option><option>Local</option></select></label><label className="text-sm font-medium">Presupuesto máximo<input type="number" min="0" name="budget" className={input}/></label></> : <><label className="text-sm font-medium sm:col-span-2">Teléfono<input type="tel" autoComplete="tel" name="phone" className={input}/></label><label className="text-sm font-medium sm:col-span-2">{kind === "tasacion" ? "Contanos sobre tu propiedad" : "Tu consulta"}<textarea required name="message" rows={4} className={input}/></label></>}
    </div><button className="mt-6 rounded-lg bg-[#1e658c] px-6 py-3 font-semibold text-white hover:bg-[#133453]">{kind === "alertas" ? "Probar mi alerta" : "Probar consulta"}</button>
    {sent && <p role="status" className="mt-4 rounded-lg bg-sky-50 p-4 text-sm text-[#133453]">Así se confirmaría tu solicitud en la web de tu inmobiliaria. Esta prueba no envió datos ni activó alertas.</p>}
  </form>;
}

const properties = [
  { id: "departamento-centro", title: "Departamento con balcón", type: "Departamento", operation: "Venta", zone: "Centro", rooms: "2" },
  { id: "casa-jardin", title: "Casa con jardín", type: "Casa", operation: "Alquiler", zone: "Zona norte", rooms: "3" },
  { id: "departamento-parque", title: "Departamento frente al parque", type: "Departamento", operation: "Alquiler", zone: "Centro", rooms: "1" },
];
export function DemoProperties() {
  const [filters, setFilters] = useState({ operation: "", type: "", zone: "", rooms: "" });
  const [applied, setApplied] = useState(filters);
  const matches = properties.filter(p => Object.entries(applied).every(([key, value]) => !value || p[key as keyof typeof applied] === value));
  return <>
    <form onSubmit={e => { e.preventDefault(); setApplied(filters); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      {([["operation", "Operación", ["Venta", "Alquiler"]], ["type", "Tipo de propiedad", ["Departamento", "Casa"]], ["zone", "Zona", ["Centro", "Zona norte"]], ["rooms", "Dormitorios", ["1", "2", "3"]]] as const).map(([key, label, options]) => <label key={key} className="text-xs font-semibold text-slate-500">{label}<select value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-[#133453]"><option value="">Todos</option>{options.map(o => <option key={o}>{o}</option>)}</select></label>)}
      <button className="self-end rounded-lg bg-[#1e658c] px-5 py-3 text-sm font-semibold text-white">Buscar propiedades</button>
    </form>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#1e658c]">Nuestra selección</p><h2 className="mt-2 text-3xl font-semibold">Propiedades destacadas</h2></div><p aria-live="polite" className="text-sm text-slate-500">{matches.length} propiedades de ejemplo</p></div>
    <div className="mt-6 grid gap-6 md:grid-cols-3">{matches.map(p => <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200"><div aria-hidden="true" className="aspect-[16/10] bg-[#f1f6f9]"/><div className="p-6"><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#1e658c]">{p.operation}</span><h3 className="mt-4 text-lg font-semibold">{p.title}</h3><p className="mt-2 text-sm text-slate-500">{p.zone} · {p.rooms} dormitorios</p><div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm"><span>Consultar precio</span><Link href={`/demo/contacto?propiedad=${p.id}`} className="font-semibold text-[#1e658c]">Consultar →</Link></div></div></article>)}</div>
    {matches.length === 0 && <p className="py-12 text-center text-slate-500">No hay propiedades de ejemplo con esos filtros. Probá otra búsqueda.</p>}
  </>;
}

// Luminancia relativa (fórmula WCAG) — decide blanco o negro para que el
// texto se siga leyendo sobre cualquier color de fondo que elija el tenant,
// sin que el admin tenga que pensar en eso.
export function contrastText(hex: string): "#ffffff" | "#000000" {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "#ffffff";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function formatPrice(
  price: number,
  currency: string = "USD",
  perMonth: boolean = false
): string {
  if (currency === "CONSULTAR") return "Consultar";
  const formatted = price.toLocaleString("es-AR");
  const prefix = currency === "ARS" ? "$ " : "USD ";
  const suffix = perMonth ? "/mes" : "";
  return `${prefix}${formatted}${suffix}`;
}

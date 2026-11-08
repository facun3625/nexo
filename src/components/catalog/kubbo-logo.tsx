// Logo de kubbo (quien desarrolla el sitio), redibujado en SVG para que se
// vea nítido a cualquier tamaño en el pie.
export function KubboLogo({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="40 55 1712 436" className={className} role="img" aria-label="kubbo" fill="#3EE080">
      <rect x="46" y="61" width="71" height="420" />
      <polygon points="117,314 263,179 348,179 222,305 360,481 274,481 169,351 117,401" />
      <path d="M370 179H441V343Q441 422 511 422Q595 422 595 333V179H665V481H597V442Q563 485 498 485Q370 485 370 352Z" />
      <rect x="729" y="61" width="71" height="420" />
      <path fillRule="evenodd" d="M741 330a154 154 0 1 0 308 0a154 154 0 1 0-308 0ZM799 330a89 94 0 1 0 178 0a89 94 0 1 0-178 0Z" />
      <rect x="1088" y="61" width="71" height="420" />
      <path fillRule="evenodd" d="M1100 330a154 154 0 1 0 308 0a154 154 0 1 0-308 0ZM1158 330a89 94 0 1 0 178 0a89 94 0 1 0-178 0Z" />
      <path fillRule="evenodd" d="M1424 330a160.5 154.5 0 1 0 321 0a160.5 154.5 0 1 0-321 0ZM1495 330a89 94 0 1 0 178 0a89 94 0 1 0-178 0Z" />
    </svg>
  );
}

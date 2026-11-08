import L from "leaflet";

// Color del favicon de Gerelli (el mismo verde azulado del logo).
export const MAP_PIN_COLOR = "#579fad";

// Pin de mapa con el ícono de los edificios del favicon adentro. Los
// polígonos son los del logo (logo gerelli.svg), escalados y centrados en
// la cabeza del pin.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
  <path d="M18 1.5C8.9 1.5 1.5 8.9 1.5 18c0 12.2 16.5 26.5 16.5 26.5S34.5 30.2 34.5 18C34.5 8.9 27.1 1.5 18 1.5z" fill="${MAP_PIN_COLOR}" stroke="#fff" stroke-width="2.5"/>
  <g fill="#fff" transform="translate(-55.6 3.6) scale(.3)">
    <polygon points="243.66 41.38 231.13 35.28 231.15 28.23 251.67 18.43 251.65 72.17 243.64 72.19 243.66 41.38"/>
    <polygon points="215.72 72.18 215.73 43.17 229.56 36.65 229.53 72.17 215.72 72.18"/>
    <polygon points="266.85 72.16 260.67 72.19 260.67 45.67 266.85 42.71 266.85 72.16"/>
    <polygon points="273.16 44.37 268.42 41.37 268.4 33.33 275.05 30.16 275.04 72.17 273.16 72.17 273.16 44.37"/>
  </g>
</svg>`;

export const MAP_PIN_ICON = L.divIcon({
  html: PIN_SVG,
  iconSize: [36, 46],
  iconAnchor: [18, 45],
  popupAnchor: [0, -42],
  className: "",
});

// Service worker compartido por el panel admin (scope /admin) y el
// storefront de cada tienda (scope /) — cada registro es una instancia
// independiente aunque compartan este mismo archivo, así que todo acá
// abajo se apoya en self.registration.scope en vez de hardcodear "/admin".
// A propósito no maneja "fetch" ni cachea nada — esto es solo
// instalabilidad, no un PWA offline-first. Cachear datos que cambian todo
// el tiempo (stock, pedidos) es un riesgo aparte (datos viejos mostrados
// como si fueran actuales) que no vale la pena tomar acá.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

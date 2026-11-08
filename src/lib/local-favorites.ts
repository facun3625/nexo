// Favoritos de un visitante sin cuenta — el bucket de PropertyFavorite en la
// base necesita userId, así que mientras no haya sesión esto vive en el
// localStorage del navegador (ya separado por tenant: cada inmobiliaria es
// un subdominio, o sea un origin distinto). FavoritesSync los vuelca a la
// base apenas el visitante inicia sesión.
const KEY = "estate-favorites";

function readAll(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Storage bloqueado (privado, cuota) — el favorito no persiste, pero no rompe la UI.
  }
}

export function getLocalFavorites(): string[] {
  return readAll();
}

export function isLocalFavorite(id: string): boolean {
  return readAll().includes(id);
}

export function toggleLocalFavorite(id: string): boolean {
  const current = readAll();
  const has = current.includes(id);
  writeAll(has ? current.filter((x) => x !== id) : [...current, id]);
  return !has;
}

export function clearLocalFavorites() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}

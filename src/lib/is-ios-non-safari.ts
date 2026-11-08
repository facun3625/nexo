// iOS obliga a todos los navegadores a correr sobre WebKit, así que
// "Chrome/Firefox/Edge en iOS" son en los hechos Safari con otra piel —
// pero ninguno de ellos expone instalación de PWA ni dispara
// beforeinstallprompt (esa API no existe fuera de Safari en iOS). Si se les
// muestran las instrucciones de "tocá Compartir" terminan sin poder
// instalar nada, sin entender por qué.
export function isIOSNonSafariUA(userAgent: string): boolean {
  return /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
}

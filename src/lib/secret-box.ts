import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Cifrado para credenciales que mueven plata (hoy: el access token de
// MercadoPago de cada tienda). A diferencia de una contraseña de SMTP, ese
// token permite cobrar y devolver dinero — si alguien se lleva un dump de la
// base, no queremos que se lleve eso en texto plano.
//
// La clave se deriva de AUTH_SECRET, que vive en .env y NO en la base: un
// volcado de la base por sí solo no alcanza para descifrar nada.
//
// Formato guardado: "v1.<iv>.<authTag>.<ciphertext>", todo en base64url. El
// prefijo de versión permite rotar el esquema más adelante sin romper lo ya
// guardado.
const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
// Fijo a propósito: derivar la clave tiene que dar lo mismo siempre, si no
// no podríamos descifrar lo que guardamos antes. Lo que hace impredecible
// cada texto cifrado es el IV aleatorio, no esto.
const KEY_SALT = "urbi.secret-box.v1";

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET — no se pueden cifrar ni leer credenciales guardadas.");
  }
  return scryptSync(secret, KEY_SALT, 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

// Devuelve null en vez de tirar si el valor no se puede descifrar (formato
// viejo, AUTH_SECRET rotado, dato corrupto). Quien llama decide qué hacer —
// en general, pedirle a la tienda que cargue la credencial de nuevo, que es
// mejor que romper toda la página de configuración.
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;

  try {
    const [, iv, authTag, ciphertext] = parts;
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

// Para mostrar en la UI que una credencial está cargada sin exponerla —
// nunca mandamos el token completo al navegador.
export function maskSecret(plain: string | null): string | null {
  if (!plain) return null;
  const tail = plain.slice(-4);
  return `${"•".repeat(8)}${tail}`;
}

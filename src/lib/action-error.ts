import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

// Error con un mensaje escrito para quien está usando la app, no para
// nosotros ("Se venció el horario de corte", "Ese cupón ya venció").
//
// Existe para poder distinguirlo de un bug real, porque en producción Next
// enmascara TODO error que salga de un server action: el cliente recibe
// "Minified React error #441" y el mensaje verdadero queda solo en los logs
// del servidor. Por eso los errores esperados se devuelven como valor en vez
// de tirarse — ver toUserError.
export class ActionError extends Error {}

// Traduce lo que haya salido mal a un mensaje accionable. Un error inesperado
// no se muestra crudo: se loguea y sale el texto genérico, para no filtrar
// detalles internos a quien está del otro lado.
export function toUserError(err: unknown, fallback: string): { error: string } {
  // redirect() y notFound() de Next funcionan tirando una excepción de control
  // de flujo. Si nos la quedáramos acá, el redirect se rompería en silencio y
  // el usuario vería un error en vez de ir a donde tenía que ir.
  unstable_rethrow(err);
  if (err instanceof ActionError) return { error: err.message };
  if (err instanceof z.ZodError) return { error: err.issues[0]?.message ?? fallback };
  console.error(fallback, err);
  return { error: fallback };
}

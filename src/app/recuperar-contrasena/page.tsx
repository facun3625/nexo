import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">GOSF</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Plataforma de inteligência educacional
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-card-foreground">
            Acesse sua conta
          </h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

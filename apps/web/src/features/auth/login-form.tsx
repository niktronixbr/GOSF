"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormValues } from "@/lib/schemas/auth.schema";
import { api, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { institutionSlug: "", email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        values,
        true
      );
      const redirectTo = login(res.accessToken, res.refreshToken);
      router.push(redirectTo);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha incorretos."
          : "Erro ao conectar. Tente novamente.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Código da instituição
        </label>
        <input
          {...form.register("institutionSlug")}
          placeholder="ex: escola-demo"
          autoComplete="organization"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.institutionSlug && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.institutionSlug.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          E-mail
        </label>
        <input
          {...form.register("email")}
          type="email"
          placeholder="voce@escola.com"
          autoComplete="email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Senha
        </label>
        <input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Esqueci minha senha
        </Link>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

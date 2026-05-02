"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormValues } from "@/lib/schemas/auth.schema";
import { api, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        true,
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
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Código da instituição
        </label>
        <Input
          {...form.register("institutionSlug")}
          placeholder="ex: escola-demo"
          autoComplete="organization"
        />
        {form.formState.errors.institutionSlug && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.institutionSlug.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          E-mail
        </label>
        <Input
          {...form.register("email")}
          type="email"
          placeholder="voce@escola.com"
          autoComplete="email"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-error">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Senha
        </label>
        <Input
          {...form.register("password")}
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-error">
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

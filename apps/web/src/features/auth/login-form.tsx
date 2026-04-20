"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, LoginFormValues } from "@/lib/schemas/auth.schema";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { institutionSlug: "", email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>(
        "/auth/login",
        values
      );
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      router.push("/dashboard");
    } catch {
      toast.error("E-mail ou senha incorretos. Verifique e tente novamente.");
    } finally {
      setIsLoading(false);
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
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {form.formState.errors.password && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { privacyApi } from "@/lib/api/privacy";

export const TERMS_PURPOSE = "terms-of-use";
export const TERMS_VERSION = "2026.04";

const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isPublicRoute(pathname: string | null) {
  if (!pathname || pathname === "/") return true;
  return PUBLIC_ROUTE_PREFIXES.some((p) => pathname.startsWith(p));
}

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoadingUser = useAuthStore((s) => s.isLoading);
  const onPublicRoute = isPublicRoute(pathname);

  const { data: consents, isLoading: loadingConsents } = useQuery({
    queryKey: ["my-consents"],
    queryFn: privacyApi.getMyConsents,
    enabled: !!user && !onPublicRoute,
  });

  const acceptMut = useMutation({
    mutationFn: () =>
      privacyApi.recordConsent({
        purpose: TERMS_PURPOSE,
        version: TERMS_VERSION,
        accepted: true,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-consents"] });
      toast.success("Termos aceitos");
    },
    onError: () => toast.error("Erro ao registrar consentimento"),
  });

  if (onPublicRoute) return <>{children}</>;
  if (isLoadingUser || !user) return <>{children}</>;
  if (loadingConsents) return <>{children}</>;

  const hasAccepted = (consents ?? []).some(
    (c) =>
      c.purpose === TERMS_PURPOSE && c.version === TERMS_VERSION && c.accepted,
  );

  if (hasAccepted) return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Termos de uso e privacidade
              </h2>
              <p className="text-xs text-muted-foreground">
                Versão {TERMS_VERSION} — necessário para continuar
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-3 text-sm text-muted-foreground">
            <p>
              Ao continuar, você concorda com o tratamento dos seus dados pessoais pela
              plataforma <strong className="text-foreground">GOSF</strong> conforme a{" "}
              <strong className="text-foreground">
                Lei Geral de Proteção de Dados (LGPD)
              </strong>
              .
            </p>
            <p>
              Seus dados (nome, e-mail, avaliações, planos de estudo, metas) são usados
              apenas para fins educacionais, dentro da sua instituição, e ficam
              acessíveis a você a qualquer momento em{" "}
              <strong className="text-foreground">Privacidade</strong> no menu lateral.
            </p>
            <p>
              Você pode a qualquer momento solicitar{" "}
              <strong className="text-foreground">acesso, correção, exclusão</strong> ou{" "}
              <strong className="text-foreground">portabilidade</strong> dos seus dados.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Ao aceitar, este consentimento ficará registrado.
            </p>
            <button
              onClick={() => acceptMut.mutate()}
              disabled={acceptMut.isPending}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {acceptMut.isPending ? "Registrando..." : "Aceito os termos"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

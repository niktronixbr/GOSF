import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingCards } from "@/components/pricing/PricingCards";

export const metadata = {
  title: "Planos — GOSF",
  description: "Escolha o plano ideal para sua escola. 14 dias grátis, sem cartão.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-8">
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar
          </Link>
        </div>

        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Planos simples e transparentes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Sem surpresas. Escolha o plano certo para o tamanho da sua escola e comece hoje.
          </p>
        </div>
        <PricingCards />
      </div>
    </div>
  );
}

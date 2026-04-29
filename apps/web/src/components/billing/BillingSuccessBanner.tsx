"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function BillingSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        router.replace("/coordinator", { scroll: false });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 font-medium flex items-center gap-3">
      <span className="text-xl">🎉</span>
      Assinatura ativada com sucesso! Bem-vindo ao GOSF.
    </div>
  );
}

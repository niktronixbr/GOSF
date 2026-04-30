"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { coordinatorApi } from "@/lib/api/coordinator";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/coordinator/onboarding") return;

    const skipped = localStorage.getItem("gosf_onboarding_skipped");
    if (skipped) return;

    coordinatorApi.getClasses().then((classes) => {
      if (classes.length === 0) {
        router.replace("/coordinator/onboarding");
      }
    }).catch(() => {});
  }, [pathname, router]);

  return <>{children}</>;
}

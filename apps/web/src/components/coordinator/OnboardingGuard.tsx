"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { coordinatorApi } from "@/lib/api/coordinator";
import { useAuthStore } from "@/store/auth.store";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role !== "COORDINATOR") return;
    if (pathname === "/coordinator/onboarding") return;

    const skipped = localStorage.getItem("gosf_onboarding_skipped");
    if (skipped) return;

    coordinatorApi.getClasses().then((classes) => {
      if (classes.length === 0) {
        router.replace("/coordinator/onboarding");
      }
    }).catch(() => {});
  }, [pathname, router, user]);

  return <>{children}</>;
}

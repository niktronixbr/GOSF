"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ConsentGate } from "@/components/consent-gate";

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      <ConsentGate>{children}</ConsentGate>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

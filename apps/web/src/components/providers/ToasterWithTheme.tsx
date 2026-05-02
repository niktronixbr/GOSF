"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme as "light" | "dark" | undefined}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--outline-variant)",
          color: "var(--foreground)",
          borderRadius: "12px",
          fontFamily: "var(--font-lexend), sans-serif",
        },
      }}
    />
  );
}

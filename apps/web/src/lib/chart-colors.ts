// apps/web/src/lib/chart-colors.ts
"use client";

import { useEffect, useState } from "react";

function readCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
  foreground: string;
  gridLine: string;
}

function snapshot(): ChartColors {
  return {
    primary: readCssVar("--primary") || "#703e0e",
    secondary: readCssVar("--secondary") || "#0061a5",
    success: readCssVar("--success") || "#1a6b3c",
    warning: readCssVar("--warning") || "#b45309",
    danger: readCssVar("--error") || "#ba1a1a",
    muted: readCssVar("--muted-foreground") || "#847469",
    foreground: readCssVar("--foreground") || "#0d1c2e",
    gridLine: readCssVar("--outline-variant") || "#d7c3b6",
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(snapshot);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(snapshot()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}

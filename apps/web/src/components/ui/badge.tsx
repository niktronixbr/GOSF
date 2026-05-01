import { clsx } from "clsx";
import type { ReactNode } from "react";

type BadgeVariant = "teal" | "amber" | "success" | "warning" | "danger" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  teal:    "bg-teal-soft text-teal-fg",
  amber:   "bg-amber-soft text-amber-fg",
  success: "bg-green-50 text-green-700",
  warning: "bg-yellow-50 text-yellow-700",
  danger:  "bg-red-50 text-red-700",
  neutral: "bg-muted text-muted-foreground",
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const dotColors: Record<BadgeVariant, string> = {
  teal:    "bg-teal",
  amber:   "bg-amber",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger:  "bg-red-500",
  neutral: "bg-muted-foreground",
};

export function Badge({ variant = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "text-[10px] font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
}

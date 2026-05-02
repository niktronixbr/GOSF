import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ChipVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
}

const variantClasses: Record<ChipVariant, string> = {
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  danger: "bg-error-container text-on-error-container",
  info: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ variant = "neutral", className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Chip.displayName = "Chip";

// apps/web/src/components/ui/button.tsx
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   "bg-teal text-white shadow-teal hover:brightness-110 active:brightness-95",
  secondary: "bg-amber-soft text-amber-fg hover:bg-amber/20 active:bg-amber/30",
  ghost:     "bg-transparent text-muted-foreground border border-border hover:bg-muted active:bg-muted/80",
  danger:    "bg-[oklch(0.97_0.02_25)] text-destructive border border-[oklch(0.9_0.04_25)] hover:bg-[oklch(0.93_0.04_25)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7  px-3   text-xs  rounded-md gap-1.5",
  md: "h-9  px-4   text-sm  rounded-[10px] gap-2",
  lg: "h-11 px-6   text-base rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

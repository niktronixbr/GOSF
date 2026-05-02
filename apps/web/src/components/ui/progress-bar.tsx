import { cn } from "@/lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  className?: string;
  showLabel?: boolean;
  thick?: boolean;
}

const variantClasses = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  className,
  showLabel = false,
  thick = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const height = thick ? "h-3" : "h-2";

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{value} / {max}</span>
          <span className="font-semibold text-foreground">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-surface-container", height)}>
        <div
          className={cn("rounded-full transition-all", height, variantClasses[variant])}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
        />
      </div>
    </div>
  );
}

import { cn } from "@/lib/cn";

type BadgeVariant = "teal" | "amber" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  teal:    "bg-teal-soft text-teal-fg",
  amber:   "bg-amber-soft text-amber-fg",
  success: "bg-[oklch(0.95_0.04_150)] text-[oklch(0.38_0.12_150)]",
  warning: "bg-[oklch(0.97_0.04_75)] text-[oklch(0.50_0.14_75)]",
  danger:  "bg-[oklch(0.97_0.03_25)] text-[oklch(0.42_0.18_25)]",
  neutral: "bg-stone-100 text-stone-500",
};

export function Badge({ variant = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span className="h-[5px] w-[5px] rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}

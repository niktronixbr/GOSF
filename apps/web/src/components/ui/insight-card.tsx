import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/cn";

interface InsightCardProps {
  variant?: "primary" | "tertiary";
  label: string;
  title: string;
  description?: string;
  subItems?: { label: string; text: string }[];
  cta?: { text: string; onClick: () => void };
  icon?: ReactNode;
  className?: string;
}

const variantClasses = {
  primary: "bg-primary text-primary-foreground",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
};

export function InsightCard({
  variant = "primary",
  label,
  title,
  description,
  subItems,
  cta,
  icon = <Sparkles size={16} />,
  className,
}: InsightCardProps) {
  const isOnPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 space-y-4 shadow-[0_8px_16px_rgba(0,0,0,0.04)]",
        variantClasses[variant],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
          {label}
        </span>
      </div>

      <h3 className="text-xl font-bold leading-tight">{title}</h3>

      {description && (
        <p className={cn("text-sm leading-relaxed", isOnPrimary ? "opacity-90" : "opacity-80")}>
          {description}
        </p>
      )}

      {subItems && subItems.length > 0 && (
        <div className="space-y-2">
          {subItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg p-3",
                isOnPrimary ? "bg-black/15" : "bg-white/40",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {cta && (
        <Button
          variant={isOnPrimary ? "secondary" : "primary"}
          onClick={cta.onClick}
          className={cn(
            "w-full",
            isOnPrimary && "bg-white text-primary border-white hover:bg-white/90",
          )}
        >
          {cta.text}
        </Button>
      )}
    </div>
  );
}

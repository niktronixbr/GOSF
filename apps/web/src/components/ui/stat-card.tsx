import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./card";
import { Chip } from "./chip";
import { cn } from "@/lib/cn";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  badge?: { text: string; variant?: "success" | "warning" | "danger" | "info" | "neutral" };
  className?: string;
}

export function StatCard({ icon, label, value, trend, badge, className }: StatCardProps) {
  return (
    <Card className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
            {icon}
          </div>
        )}
        {badge && <Chip variant={badge.variant ?? "neutral"}>{badge.text}</Chip>}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-xs font-medium">
          {trend.direction === "up" && <TrendingUp size={12} className="text-success" />}
          {trend.direction === "down" && <TrendingDown size={12} className="text-error" />}
          <span
            className={cn(
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-error",
              trend.direction === "neutral" && "text-muted-foreground",
            )}
          >
            {trend.value}
          </span>
        </div>
      )}
    </Card>
  );
}

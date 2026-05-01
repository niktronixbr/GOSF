import { clsx } from "clsx";
import type { ReactNode } from "react";

interface StatProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  className?: string;
}

export function Stat({ icon, label, value, delta, deltaPositive, className }: StatProps) {
  return (
    <div
      className={clsx(
        "stat-card rounded-lg border border-border bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {delta !== undefined && (
            <p
              className={clsx(
                "mt-1 text-xs font-medium",
                deltaPositive ? "text-green-600" : "text-destructive"
              )}
            >
              {deltaPositive ? "▲" : "▼"} {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-soft text-teal-fg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

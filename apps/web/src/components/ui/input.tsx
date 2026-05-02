import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border border-transparent bg-input px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground",
          "focus:bg-card focus:border-primary focus:border-2 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

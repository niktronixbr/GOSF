"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({ children, className, align = "center" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 w-72 rounded-lg border border-outline-variant bg-card p-4 shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

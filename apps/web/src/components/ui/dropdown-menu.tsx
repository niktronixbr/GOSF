"use client";

import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ children, className, align = "end" }: { children: ReactNode; className?: string; align?: "start" | "center" | "end" }) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-50 min-w-[180px] rounded-lg border border-outline-variant bg-card p-1 shadow-[0_8px_16px_rgba(0,0,0,0.08)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className,
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ children, onSelect, className, danger }: { children: ReactNode; onSelect?: () => void; className?: string; danger?: boolean }) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none",
        "data-[highlighted]:bg-surface-container",
        danger ? "text-error" : "text-foreground",
        className,
      )}
    >
      {children}
    </DropdownPrimitive.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <DropdownPrimitive.Separator className={cn("my-1 h-px bg-outline-variant", className)} />;
}

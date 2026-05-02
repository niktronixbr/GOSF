import Image from "next/image";
import { avatarColorForName, getInitials } from "@/lib/avatar-color";
import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

const sizeDimensions = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const color = avatarColorForName(name);
  const initials = getInitials(name);
  const dim = sizeDimensions[size];

  if (src && src.startsWith("http")) {
    return (
      <Image
        src={src}
        alt={name}
        width={dim}
        height={dim}
        unoptimized
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        color.bg,
        color.text,
        sizeClasses[size],
        className,
      )}
      aria-label={`Avatar de ${name}`}
    >
      {initials || "?"}
    </div>
  );
}

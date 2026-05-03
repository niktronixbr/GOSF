type GosfIconProps = {
  size?: number;
  variant?: "outline" | "filled";
  className?: string;
};

export function GosfIcon({ size = 24, variant = "outline", className }: GosfIconProps) {
  if (variant === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        {/* Base */}
        <path d="M14,62 L14,76 Q14,96 50,96 Q86,96 86,76 L86,62 Z" fill="#d1d5db" />
        {/* Board */}
        <path d="M12,2 L78,2 L78,64 L12,64 Q2,64 2,54 L2,12 Q2,2 12,2 Z" fill="#703e0e" />
        {/* Tassel */}
        <path d="M78,2 L88,2 Q98,2 98,10 L98,60 Q98,68 90,68 L78,68 Z" fill="#2563eb" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Base (open path — top edge hidden behind board) */}
      <path
        d="M14,62 L14,76 Q14,96 50,96 Q86,96 86,76 L86,62"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cap outline (board + tassel as one rounded rect) */}
      <path
        d="M12,2 L88,2 Q98,2 98,12 L98,54 Q98,64 88,64 L12,64 Q2,64 2,54 L2,12 Q2,2 12,2 Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Divider line between board and tassel */}
      <line x1="78" y1="2" x2="78" y2="64" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

type GosfIconProps = {
  size?: number;
  variant?: "outline" | "filled";
  className?: string;
};

/**
 * Graduation cap icon in emoji style.
 * filled — colorful (brown board, blue tassel, gray/white head)
 * outline — stroke-only, inherits currentColor (e.g. white on dark bg)
 */
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
        {/* Head – left half (gray) */}
        <path d="M50,66 Q18,66 18,82 Q18,96 50,96 Z" fill="#9CA3AF" />
        {/* Head – right half (near-white) */}
        <path d="M50,66 Q82,66 82,82 Q82,96 50,96 Z" fill="#F1F5F9" />

        {/* Brim collar — sits behind the board; sides visible at 45° angle */}
        <path
          d="M15,46 Q50,36 85,46 Q90,54 85,64 Q50,74 15,64 Q10,56 15,46 Z"
          fill="#5C2A00"
        />
        {/* Brim top highlight */}
        <path d="M15,46 Q50,36 85,46" fill="none" stroke="#B07040" strokeWidth="2.5" />

        {/* Board (diamond / rhombus with rounded corners) — drawn over brim */}
        <path
          d="M44,12 Q50,5 56,12 L79,29 Q86,33 79,37 L56,52 Q50,58 44,52 L21,37 Q14,33 21,29 Z"
          fill="#8B4513"
          stroke="#5C2A00"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Tassel — blue ribbon on right corner */}
        <path
          d="M77,28 L84,22 Q91,24 91,31 L84,35 L82,56 Q82,64 79,65 Q76,64 76,56 L74,35 L67,31 Q67,24 74,22 Z"
          fill="#3B82F6"
        />
      </svg>
    );
  }

  // Outline variant — stroke only, inherits currentColor
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
      {/* Head (half-sphere) */}
      <path
        d="M18,66 Q18,82 50,96 Q82,82 82,66"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Head center divider */}
      <line x1="50" y1="66" x2="50" y2="96" stroke="currentColor" strokeWidth="3" />

      {/* Brim collar */}
      <ellipse cx="50" cy="55" rx="35" ry="11" stroke="currentColor" strokeWidth="4" />

      {/* Board (diamond with rounded corners) */}
      <path
        d="M44,12 Q50,5 56,12 L79,29 Q86,33 79,37 L56,52 Q50,58 44,52 L21,37 Q14,33 21,29 Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      {/* Tassel */}
      <path
        d="M77,28 L84,22 Q91,24 91,31 L84,35 L82,56 Q82,64 79,65 Q76,64 76,56 L74,35 L67,31"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

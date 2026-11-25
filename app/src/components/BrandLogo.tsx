import { useId } from "react";
import type { ReactElement } from "react";

const CENTER_BODY = "M28.2 70.4C28.2 62 36 54.1 45 54.1H55C64 54.1 71.8 62 71.8 70.4Z";

interface BrandLogoProps {
  size?: number;
  className?: string;
  /**
   * "tile" is the Shocker Yellow app icon (same drawing as public/favicon.svg).
   * "frosted" is a see-through version that blends into a colored background.
   */
  variant?: "tile" | "frosted";
}

/** App icon: three people on a rounded square. */
export function BrandLogo({ size = 48, className, variant = "tile" }: BrandLogoProps): ReactElement {
  // The gap around the middle person is cut out with a mask, so it is
  // transparent on any background instead of painted yellow.
  const maskId = `brand-gap-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frosted = variant === "frosted";

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#ffffff" />
          <path d={CENTER_BODY} fill="#000000" stroke="#000000" strokeWidth="6" strokeLinejoin="round" />
        </mask>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="98.5"
        height="98.5"
        rx="24"
        fill={frosted ? "rgba(255, 255, 255, 0.12)" : "#ffdb00"}
        stroke={frosted ? "rgba(255, 255, 255, 0.28)" : "none"}
        strokeWidth="1.5"
      />
      <g fill={frosted ? "rgba(255, 255, 255, 0.92)" : "#000000"}>
        <circle cx="25.5" cy="44.2" r="8.5" />
        <circle cx="74.5" cy="44.2" r="8.5" />
        <circle cx="50" cy="40.5" r="11.5" />
        <g mask={`url(#${maskId})`}>
          <path d="M9.8 66.3C9.8 59 15 54.5 22 54.5H27C33 54.5 38 59 38 66.3Z" />
          <path d="M90.2 66.3C90.2 59 85 54.5 78 54.5H73C67 54.5 62 59 62 66.3Z" />
        </g>
        <path d={CENTER_BODY} />
      </g>
    </svg>
  );
}

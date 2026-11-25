import { useId } from "react";
import type { ReactElement } from "react";

/** The app's name. */
export const APP_NAME = "CoCongruo";

/* The three circles of the CoCongruo mark (from the poster), in a 100×100 box. */
const CIRCLES = {
  yellow: { cx: 50, cy: 35, r: 28 },
  black: { cx: 33.5, cy: 63.5, r: 28 },
  grey: { cx: 66.5, cy: 63.5, r: 28 },
};

const COLORS = {
  yellow: "#f2c037",
  black: "#0d0d0d",
  grey: "#a4a8ae",
  yellowBlack: "#7a6424",
  yellowGrey: "#5c5c5c",
  blackGrey: "#3b3e43",
  centre: "#ffffff",
};

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * The CoCongruo mark: three overlapping circles (yellow, black and grey) with a
 * white centre where all three meet, on a white rounded tile so the black
 * circle still shows on the dark headers. Same drawing as public/favicon.svg.
 */
export function BrandLogo({ size = 48, className }: BrandLogoProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clip = { yellow: `logo-yellow-${uid}`, black: `logo-black-${uid}` };
  const { yellow, black, grey } = CIRCLES;

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
        <clipPath id={clip.yellow}>
          <circle {...yellow} />
        </clipPath>
        <clipPath id={clip.black}>
          <circle {...black} />
        </clipPath>
      </defs>
      <rect width="100" height="100" rx="24" fill="#ffffff" />
      <g transform="translate(50 50) scale(0.8) translate(-50 -50)">
        <circle {...yellow} fill={COLORS.yellow} />
        <circle {...black} fill={COLORS.black} />
        <circle {...grey} fill={COLORS.grey} />
        <circle {...black} fill={COLORS.yellowBlack} clipPath={`url(#${clip.yellow})`} />
        <circle {...grey} fill={COLORS.yellowGrey} clipPath={`url(#${clip.yellow})`} />
        <circle {...grey} fill={COLORS.blackGrey} clipPath={`url(#${clip.black})`} />
        <g clipPath={`url(#${clip.yellow})`}>
          <circle {...grey} fill={COLORS.centre} clipPath={`url(#${clip.black})`} />
        </g>
      </g>
    </svg>
  );
}

/** "CoCongruo" with "Co" in yellow, as on the poster. */
export function BrandName(): ReactElement {
  return (
    <span className="brand-name">
      <span className="brand-name__co">Co</span>Congruo
    </span>
  );
}

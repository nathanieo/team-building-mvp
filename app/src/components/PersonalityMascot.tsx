import type { ReactElement, ReactNode } from "react";
import { ARCHETYPES } from "@team-building-mvp/contracts";
import type { ArchetypeId } from "@team-building-mvp/contracts";
import { Mascot } from "./Mascot";
import type { MascotScene } from "./Mascot";

const WHITE = "#ffffff";
const BLACK = "#000000";

/**
 * The eight personality mascots: one wheat family, each with its own face,
 * movement and a single black-and-white accessory (Wichita State's colours on
 * the yellow body), so they read as related characters and stay recognisable
 * at small sizes.
 */
const LOOKS: Record<ArchetypeId, { scene: MascotScene; accessory: ReactNode }> = {
  anchor: {
    scene: { mood: "calm", prop: "none", motion: "float" },
    accessory: (
      <g>
        <circle cx="150" cy="134" r="12" fill={WHITE} stroke={BLACK} strokeWidth="2" />
        <g stroke={BLACK} strokeWidth="2.4" fill="none" strokeLinecap="round">
          <circle cx="150" cy="127" r="2.4" />
          <path d="M150 129.5 V141 M145 132 H155 M143 137 Q150 145 157 137" />
        </g>
      </g>
    ),
  },
  spark: {
    scene: { mood: "excited", prop: "none", motion: "bounce" },
    accessory: (
      <g>
        <path d="M176 40 L162 64 H174 L166 86 L188 58 H175 L184 40 Z" fill={WHITE} stroke={BLACK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M58 60 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill={WHITE} />
        <path d="M196 92 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={WHITE} />
      </g>
    ),
  },
  strategist: {
    scene: { mood: "focused", prop: "none", motion: "nod" },
    accessory: (
      <g stroke={BLACK} strokeWidth="3" fill="rgba(255,255,255,0.35)">
        <circle cx="107" cy="108" r="11" />
        <circle cx="133" cy="108" r="11" />
        <path d="M118 107 H122" fill="none" />
        <path d="M96 106 L84 102 M144 106 L156 102" fill="none" />
      </g>
    ),
  },
  explorer: {
    scene: { mood: "happy", prop: "none", motion: "sway" },
    accessory: (
      <g>
        <path d="M94 72 C94 50 146 50 146 72 Z" fill={WHITE} />
        <rect x="94" y="64" width="52" height="8" fill={BLACK} />
        <ellipse cx="120" cy="73" rx="46" ry="8" fill={WHITE} />
      </g>
    ),
  },
  harmonizer: {
    scene: { mood: "warm", prop: "none", motion: "float" },
    accessory: (
      <g>
        <path
          d="M140 132 C140 126 148 124 150 130 C152 124 160 126 160 132 C160 138 150 145 150 145 C150 145 140 138 140 132 Z"
          fill={WHITE}
          stroke={BLACK}
          strokeWidth="2"
        />
        <path
          className="mascot__heart"
          d="M60 72 C60 68 65 67 66 71 C67 67 72 68 72 72 C72 76 66 80 66 80 C66 80 60 76 60 72 Z"
          fill={WHITE}
        />
      </g>
    ),
  },
  builder: {
    scene: { mood: "focused", prop: "none", motion: "nod" },
    accessory: (
      <g>
        <path d="M86 80 C86 54 154 54 154 80 Z" fill={WHITE} />
        <path d="M117 57 H123 V80 H117 Z" fill={BLACK} />
        <rect x="78" y="78" width="84" height="8" rx="4" fill={WHITE} stroke={BLACK} strokeWidth="1.5" />
      </g>
    ),
  },
  challenger: {
    scene: { mood: "focused", prop: "none", motion: "bounce" },
    accessory: (
      <g>
        <path d="M72 94 C92 84 148 84 168 94 L168 102 C148 92 92 92 72 102 Z" fill={WHITE} />
        <path d="M74 97 C94 88 146 88 166 97" stroke={BLACK} strokeWidth="2" fill="none" />
        <path d="M168 96 L184 90 L180 100 Z M168 100 L182 106 L172 108 Z" fill={WHITE} />
      </g>
    ),
  },
  flowkeeper: {
    scene: { mood: "calm", prop: "none", motion: "sway" },
    accessory: (
      <g>
        <path d="M70 110 Q70 58 120 58 Q170 58 170 110" stroke={WHITE} strokeWidth="6" fill="none" strokeLinecap="round" />
        <rect x="60" y="98" width="16" height="26" rx="7" fill={WHITE} />
        <rect x="164" y="98" width="16" height="26" rx="7" fill={WHITE} />
        <rect x="64" y="103" width="8" height="16" rx="4" fill={BLACK} />
        <rect x="168" y="103" width="8" height="16" rx="4" fill={BLACK} />
      </g>
    ),
  },
};

export function PersonalityMascot({
  id,
  label = true,
}: {
  id: ArchetypeId;
  /** Announce the mascot to screen readers ("The Anchor mascot"); turn off where the name is right beside it. */
  label?: boolean;
}): ReactElement {
  const look = LOOKS[id];
  return (
    <Mascot
      scene={look.scene}
      accessory={look.accessory}
      {...(label ? { title: `${ARCHETYPES[id].name} mascot` } : {})}
    />
  );
}

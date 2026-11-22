import { useId } from "react";
import type { ReactElement, ReactNode } from "react";

/**
 * "Sprout", the questionnaire buddy: a soft green dome with two leaves,
 * sitting in a mound of soil (an original drawing in the style the team chose).
 * Each question gives it a face, a prop and a movement; its leaves perk up or
 * droop with its mood, and it hops when the student answers.
 */
export type MascotMood = "happy" | "excited" | "calm" | "worried" | "thinking" | "shy" | "oops" | "focused" | "warm";

export type MascotProp =
  | "party"
  | "heart"
  | "hearts"
  | "checklist"
  | "sunCloud"
  | "dream"
  | "dots"
  | "shrug"
  | "socks"
  | "sunglasses"
  | "lightbulb"
  | "chatter"
  | "blocks"
  | "rain"
  | "puzzle"
  | "peek"
  | "headphones"
  | "paint"
  | "sun"
  | "emptyThought"
  | "laptop"
  | "gears"
  | "chart"
  | "palette"
  | "pencil"
  | "calendar"
  | "magnifier"
  | "microphone"
  | "books"
  | "rocket"
  | "confetti"
  | "friends"
  | "music"
  | "none";

export type MascotMotion = "bounce" | "float" | "wiggle" | "sway" | "nod" | "dance";

export interface MascotScene {
  mood: MascotMood;
  prop: MascotProp;
  motion: MascotMotion;
}

const INK = "#1b1f1d";
const LEAF_DARK = "#5aa832";
const PINK = "#f4a0a0";
const AMBER = "#f5b83d";
const SKY = "#6fb6ff";
const VIOLET = "#a78bfa";
const RED = "#ff6b6b";
const GREEN = "#5ec26a";

/* Face positions in the 240×190 scene: the sprout's dome is centred on x 120. */
const EYE_L = 107;
const EYE_R = 133;
const EYE_Y = 108;

function Eyes({ mood }: { mood: MascotMood }): ReactElement {
  if (mood === "calm" || mood === "warm") {
    return (
      <g stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round">
        <path d={`M${EYE_L - 6} ${EYE_Y + 2} Q${EYE_L} ${EYE_Y - 5} ${EYE_L + 6} ${EYE_Y + 2}`} />
        <path d={`M${EYE_R - 6} ${EYE_Y + 2} Q${EYE_R} ${EYE_Y - 5} ${EYE_R + 6} ${EYE_Y + 2}`} />
      </g>
    );
  }
  if (mood === "oops") {
    // One eye open, one squeezed shut: a sheepish wink.
    return (
      <g>
        <ellipse cx={EYE_L} cy={EYE_Y} rx="5" ry="7.5" fill={INK} />
        <circle cx={EYE_L + 1.6} cy={EYE_Y - 3} r="1.6" fill="#ffffff" />
        <path d={`M${EYE_R - 6} ${EYE_Y - 3} L${EYE_R + 5} ${EYE_Y} L${EYE_R - 6} ${EYE_Y + 4}`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  const shift = mood === "thinking" ? { x: 2.5, y: -2.5 } : mood === "shy" ? { x: -2, y: 2.5 } : { x: 0, y: 0 };
  const big = mood === "excited";
  return (
    <g className="mascot__eyes">
      {[EYE_L, EYE_R].map((x) => (
        <g key={x}>
          <ellipse cx={x + shift.x} cy={EYE_Y + shift.y} rx={big ? 5.8 : 5} ry={big ? 8.5 : 7.5} fill={INK} />
          <circle cx={x + shift.x + 1.6} cy={EYE_Y + shift.y - 3} r={big ? 2.2 : 1.6} fill="#ffffff" />
        </g>
      ))}
      {mood === "worried" ? (
        <g stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d={`M${EYE_L - 8} ${EYE_Y - 12} L${EYE_L + 4} ${EYE_Y - 15}`} />
          <path d={`M${EYE_R + 8} ${EYE_Y - 12} L${EYE_R - 4} ${EYE_Y - 15}`} />
        </g>
      ) : null}
      {mood === "focused" ? (
        <g stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d={`M${EYE_L - 6} ${EYE_Y - 13} L${EYE_L + 6} ${EYE_Y - 13}`} />
          <path d={`M${EYE_R - 6} ${EYE_Y - 13} L${EYE_R + 6} ${EYE_Y - 13}`} />
        </g>
      ) : null}
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }): ReactElement {
  const stroke = { stroke: INK, strokeWidth: 3.2, fill: "none", strokeLinecap: "round" as const };
  switch (mood) {
    case "excited":
      return (
        <g>
          <path d="M110 117 Q120 132 130 117 Z" fill={INK} />
          <path d="M115 124 Q120 129 125 124 Z" fill={PINK} />
        </g>
      );
    case "worried":
      return <path d="M112 124 Q120 117 128 124" {...stroke} />;
    case "thinking":
      return <path d="M113 122 L127 119" {...stroke} />;
    case "shy":
      return <ellipse cx="120" cy="121" rx="3" ry="2.6" fill={INK} />;
    case "oops":
      return <path d="M111 121 q3 -4 6 0 q3 4 6 0 q3 -4 6 0" {...stroke} />;
    case "focused":
      return <path d="M114 121 Q120 123 126 121" {...stroke} />;
    case "calm":
      return <path d="M114 119 Q120 124 126 119" {...stroke} />;
    default:
      return <path d="M111 118 Q120 128 129 118" {...stroke} />;
  }
}

/** Leaves act like arms: they perk up when excited and droop when worried. */
function Leaves({ mood, ids }: { mood: MascotMood; ids: { leaf: string } }): ReactElement {
  const tilt = mood === "excited" ? -14 : mood === "worried" || mood === "shy" ? 22 : 0;
  return (
    <g className="mascot__leaves">
      <path d="M120 66 C120 58 120 52 121 46" stroke={LEAF_DARK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <g transform={`rotate(${tilt} 121 46)`}>
        <path d="M121 46 C108 28 86 30 82 39 C90 53 112 55 121 46 Z" fill={`url(#${ids.leaf})`} />
        <path d="M120 46 C108 40 96 38 88 40" stroke={LEAF_DARK} strokeWidth="1.5" fill="none" opacity="0.5" />
      </g>
      <g transform={`rotate(${-tilt} 121 46)`}>
        <path d="M121 46 C133 27 156 28 160 37 C152 52 131 55 121 46 Z" fill={`url(#${ids.leaf})`} />
        <path d="M122 46 C134 39 146 37 154 38" stroke={LEAF_DARK} strokeWidth="1.5" fill="none" opacity="0.5" />
      </g>
    </g>
  );
}

/** The prop or scene around the sprout. */
function Prop({ prop }: { prop: MascotProp }): ReactElement | null {
  switch (prop) {
    case "party":
      return (
        <g>
          <g transform="rotate(-24 92 62)">
            <path d="M80 70 L92 38 L104 70 Z" fill={AMBER} />
            <path d="M84 60 L100 60" stroke="#ffffff" strokeWidth="3" />
            <circle cx="92" cy="37" r="4.5" fill={RED} />
          </g>
          <Confetti />
          <MusicNotes />
        </g>
      );
    case "music":
      return <MusicNotes />;
    case "friends":
      return <FriendSprout />;
    case "confetti":
      return <Confetti />;
    case "heart":
      return <HeartShape x={176} y={44} size={1.25} />;
    case "hearts":
      return (
        <g>
          <HeartShape x={176} y={40} size={1.1} />
          <HeartShape x={44} y={60} size={0.85} />
        </g>
      );
    case "checklist":
      return (
        <g transform="translate(180 66)">
          <rect width="42" height="54" rx="6" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
          <rect x="13" y="-6" width="16" height="10" rx="3" fill={SKY} />
          {[13, 27, 41].map((y) => (
            <g key={y}>
              <path d={`M7 ${y} l4 4 l7 -8`} stroke={GREEN} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d={`M23 ${y} H34`} stroke="#c9d6d1" strokeWidth="3" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "sunCloud":
      return (
        <g transform="translate(184 48)">
          <circle r="16" fill={AMBER} />
          <CloudShape x={-8} y={6} fill="#dfe6f0" />
        </g>
      );
    case "rain":
      return (
        <g transform="translate(92 8)">
          <CloudShape x={0} y={0} fill="#b9c3d4" />
          {[14, 28, 42].map((x) => (
            <path key={x} className="mascot__drop" d={`M${x} 30 l-3 8`} stroke={SKY} strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>
      );
    case "dream":
    case "emptyThought":
      return (
        <g>
          <circle cx="160" cy="54" r="4" fill="#ffffff" />
          <circle cx="170" cy="42" r="6" fill="#ffffff" />
          <ellipse cx="198" cy="28" rx="30" ry="20" fill="#ffffff" />
          {prop === "dream" ? (
            <g fill="none" strokeWidth="3">
              <path d="M180 32 a18 18 0 0 1 36 0" stroke={RED} />
              <path d="M184 32 a14 14 0 0 1 28 0" stroke={AMBER} />
              <path d="M188 32 a10 10 0 0 1 20 0" stroke={GREEN} />
              <path d="M192 32 a6 6 0 0 1 12 0" stroke={SKY} />
            </g>
          ) : (
            <text x="198" y="35" textAnchor="middle" fontSize="18" fontWeight="700" fill="#9aa7a2">
              …
            </text>
          )}
        </g>
      );
    case "dots":
      return (
        <g transform="translate(170 40)">
          <rect width="48" height="30" rx="15" fill="#ffffff" />
          <path d="M10 28 l-6 10 l14 -8 Z" fill="#ffffff" />
          {[14, 24, 34].map((x) => (
            <circle key={x} className="mascot__typing" cx={x} cy="15" r="3.5" fill="#9aa7a2" />
          ))}
        </g>
      );
    case "chatter":
      return (
        <g>
          <g transform="translate(172 34)">
            <rect width="44" height="26" rx="13" fill="#ffffff" />
            <text x="22" y="18" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2f8a43">
              hi!
            </text>
          </g>
          <g transform="translate(22 52)">
            <rect width="40" height="24" rx="12" fill="#ffffff" />
            <text x="20" y="17" textAnchor="middle" fontSize="13" fontWeight="800" fill={VIOLET}>
              hey
            </text>
          </g>
        </g>
      );
    case "shrug":
      return (
        <g fill="#ffffff" fontWeight="800" fontSize="22">
          <text x="46" y="70">?</text>
          <text x="184" y="62">?</text>
        </g>
      );
    case "socks":
      return (
        <g>
          <path d="M34 168 l0 -18 h10 v12 q0 8 -8 8 h-10 q-4 0 -4 -2 Z" fill={VIOLET} />
          <rect x="190" y="156" width="22" height="12" rx="3" fill={SKY} transform="rotate(-14 201 162)" />
          <circle cx="52" cy="176" r="5" fill={AMBER} />
        </g>
      );
    case "sunglasses":
      return <circle cx="204" cy="34" r="16" fill={AMBER} />;
    case "lightbulb":
      return (
        <g transform="translate(190 34)" className="mascot__glow">
          <circle cy="10" r="16" fill="#ffe27a" />
          <rect x="-7" y="24" width="14" height="10" rx="3" fill="#9aa7a2" />
          <path d="M-22 2 l-6 -4 M22 2 l6 -4 M0 -10 v-8" stroke={AMBER} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "blocks":
      return (
        <g transform="translate(184 106)">
          <rect x="0" y="24" width="22" height="22" rx="4" fill={SKY} />
          <rect x="24" y="24" width="22" height="22" rx="4" fill={GREEN} />
          <rect x="12" y="0" width="22" height="22" rx="4" fill={AMBER} />
        </g>
      );
    case "puzzle":
      return (
        <g transform="translate(182 50)">
          <path d="M0 0 h12 a6 6 0 1 1 12 0 h12 v12 a6 6 0 1 1 0 12 v12 h-36 Z" fill={VIOLET} />
          <text x="-138" y="18" fontSize="22" fontWeight="800" fill="#ffffff">
            ?
          </text>
        </g>
      );
    case "paint":
      return (
        <g>
          <circle cx="42" cy="150" r="10" fill={PINK} />
          <circle cx="56" cy="162" r="5" fill={PINK} />
          <circle cx="200" cy="140" r="12" fill={SKY} />
          <circle cx="186" cy="158" r="5" fill={SKY} />
          <circle cx="190" cy="52" r="7" fill={AMBER} />
        </g>
      );
    case "sun":
      return (
        <g transform="translate(196 40)">
          <g className="mascot__spin">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path key={angle} d="M0 -22 V-30" stroke={AMBER} strokeWidth="4" strokeLinecap="round" transform={`rotate(${angle})`} />
            ))}
          </g>
          <circle r="16" fill={AMBER} />
        </g>
      );
    case "laptop":
      return (
        <g transform="translate(172 110)">
          <rect x="6" y="0" width="52" height="36" rx="4" fill={INK} />
          <rect x="10" y="4" width="44" height="28" rx="2" fill="#dff3ff" />
          <rect x="14" y="9" width="18" height="5" rx="2" fill={SKY} />
          <rect x="14" y="18" width="34" height="4" rx="2" fill="#a6d4ff" />
          <rect x="0" y="36" width="64" height="6" rx="3" fill="#9aa7a2" />
        </g>
      );
    case "gears":
      return (
        <g>
          <Gear x={196} y={52} r={18} fill="#9aa7a2" />
          <Gear x={220} y={84} r={12} fill={SKY} reverse />
        </g>
      );
    case "chart":
      return (
        <g transform="translate(180 76)">
          <rect x="0" y="34" width="12" height="20" rx="3" fill={SKY} />
          <rect x="16" y="20" width="12" height="34" rx="3" fill={GREEN} />
          <rect x="32" y="6" width="12" height="48" rx="3" fill={AMBER} />
          <path d="M-4 56 H50" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    case "palette":
      return (
        <g transform="translate(176 100)">
          <path d="M28 0 C46 0 58 10 58 24 C58 34 48 34 42 36 C36 38 40 48 30 48 C12 48 0 38 0 24 C0 10 12 0 28 0 Z" fill="#f4e3c8" />
          <circle cx="14" cy="20" r="5" fill={RED} />
          <circle cx="26" cy="12" r="5" fill={AMBER} />
          <circle cx="40" cy="16" r="5" fill={GREEN} />
          <circle cx="18" cy="34" r="5" fill={SKY} />
        </g>
      );
    case "pencil":
      return (
        <g>
          <rect x="180" y="96" width="40" height="50" rx="4" fill="#ffffff" stroke="#c9d6d1" strokeWidth="2" />
          {[108, 118, 128].map((y) => (
            <path key={y} d={`M188 ${y} H212`} stroke="#c9d6d1" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <g transform="rotate(35 210 78)">
            <rect x="204" y="48" width="10" height="40" rx="2" fill={AMBER} />
            <path d="M204 88 L209 100 L214 88 Z" fill="#f4e3c8" />
          </g>
        </g>
      );
    case "calendar":
      return (
        <g transform="translate(178 70)">
          <rect width="50" height="50" rx="7" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
          <rect width="50" height="14" rx="7" fill={RED} />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={8 + col * 13}
                y={20 + row * 9}
                width="8"
                height="5"
                rx="1.5"
                fill={row === 1 && col === 1 ? GREEN : "#d5ddd9"}
              />
            )),
          )}
        </g>
      );
    case "magnifier":
      return (
        <g transform="translate(192 74)">
          <circle r="16" fill="#dff3ff" stroke={INK} strokeWidth="5" />
          <path d="M12 12 L28 28" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        </g>
      );
    case "microphone":
      return (
        <g transform="translate(190 84)">
          <rect x="-8" y="-24" width="16" height="28" rx="8" fill="#9aa7a2" />
          <path d="M-14 -4 Q0 16 14 -4" stroke={INK} strokeWidth="3" fill="none" />
          <path d="M0 10 V26 M-10 26 H10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M18 -26 q8 8 0 16 M26 -32 q14 14 0 28" stroke={AMBER} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "books":
      return (
        <g transform="translate(178 112)">
          <rect x="0" y="30" width="54" height="12" rx="3" fill={VIOLET} />
          <rect x="4" y="18" width="48" height="12" rx="3" fill={SKY} />
          <rect x="2" y="6" width="50" height="12" rx="3" fill={AMBER} />
          <circle cx="40" cy="-14" r="10" fill="#ffe27a" />
        </g>
      );
    case "rocket":
      return (
        <g transform="translate(198 60) rotate(30)">
          <g className="mascot__float-prop">
            <path d="M0 -30 C12 -18 12 6 8 18 H-8 C-12 6 -12 -18 0 -30 Z" fill="#ffffff" stroke={INK} strokeWidth="2.5" />
            <circle cy="-6" r="5" fill={SKY} />
            <path d="M-8 10 L-16 22 L-8 18 Z M8 10 L16 22 L8 18 Z" fill={RED} />
            <path d="M-5 20 Q0 34 5 20 Z" fill={AMBER} />
          </g>
        </g>
      );
    default:
      return null;
  }
}

/** Props worn on the sprout itself, drawn over its face so they move with it. */
function Wearable({ prop }: { prop: MascotProp }): ReactElement | null {
  if (prop === "sunglasses") {
    return (
      <g>
        <rect x={EYE_L - 12} y={EYE_Y - 8} width="24" height="16" rx="7" fill={INK} />
        <rect x={EYE_R - 12} y={EYE_Y - 8} width="24" height="16" rx="7" fill={INK} />
        <path d={`M${EYE_L + 12} ${EYE_Y - 2} H${EYE_R - 12}`} stroke={INK} strokeWidth="3" />
      </g>
    );
  }
  if (prop === "headphones") {
    return (
      <g>
        <path d="M70 112 Q70 62 120 62 Q170 62 170 112" stroke={INK} strokeWidth="5" fill="none" />
        <rect x="62" y="100" width="14" height="24" rx="6" fill={RED} />
        <rect x="164" y="100" width="14" height="24" rx="6" fill={RED} />
      </g>
    );
  }
  return null;
}

/** A second, smaller sprout for the social questions, chatting with the main one. */
function FriendSprout(): ReactElement {
  return (
    <g>
      <g className="mascot__friend">
        <g transform="translate(-30 98) scale(0.5)">
          <path d="M120 66 C120 58 120 52 121 46" stroke={LEAF_DARK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M121 46 C108 28 86 30 82 39 C90 53 112 55 121 46 Z" fill="#a4dd6c" />
          <path d="M121 46 C133 27 156 28 160 37 C152 52 131 55 121 46 Z" fill="#a4dd6c" />
          <path d="M66 156 C64 98 86 64 120 64 C154 64 176 98 174 156 Z" fill="#8fd04f" />
          <ellipse cx="107" cy="108" rx="5.5" ry="8" fill={INK} />
          <ellipse cx="133" cy="108" rx="5.5" ry="8" fill={INK} />
          <path d="M110 118 Q120 130 130 118" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="94" cy="120" rx="8" ry="5" fill={PINK} />
          <ellipse cx="146" cy="120" rx="8" ry="5" fill={PINK} />
          <path d="M56 170 C58 152 84 144 120 144 C156 144 182 152 184 170 C184 177 168 181 120 181 C72 181 56 177 56 170 Z" fill="#c9a27a" />
        </g>
      </g>
      <g className="mascot__bubble mascot__bubble--one">
        <rect x="0" y="62" width="50" height="26" rx="13" fill="#ffffff" />
        <path d="M22 86 l-2 10 l10 -9 Z" fill="#ffffff" />
        <text x="25" y="80" textAnchor="middle" fontSize="13" fontWeight="800" fill={VIOLET}>
          hey!
        </text>
      </g>
      <g className="mascot__bubble mascot__bubble--two">
        <rect x="170" y="36" width="56" height="26" rx="13" fill="#ffffff" />
        <path d="M184 60 l-6 10 l12 -8 Z" fill="#ffffff" />
        <text x="198" y="54" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2f8a43">
          hi there
        </text>
      </g>
    </g>
  );
}

function MusicNotes(): ReactElement {
  return (
    <g fill={INK}>
      <g className="mascot__note mascot__note--one">
        <ellipse cx="196" cy="76" rx="6" ry="4.5" />
        <path d="M201 76 V54 L212 50" stroke={INK} strokeWidth="2.5" fill="none" />
      </g>
      <g className="mascot__note mascot__note--two">
        <ellipse cx="44" cy="92" rx="5" ry="4" />
        <path d="M48.5 92 V74" stroke={INK} strokeWidth="2.5" />
      </g>
    </g>
  );
}

function Confetti(): ReactElement {
  const pieces: Array<[number, number, string, number]> = [
    [40, 34, PINK, 20],
    [62, 16, AMBER, -30],
    [178, 20, SKY, 40],
    [206, 46, GREEN, -15],
    [28, 78, VIOLET, 60],
    [212, 94, AMBER, 10],
    [192, 6, RED, -50],
    [52, 58, SKY, 25],
  ];
  return (
    <g className="mascot__confetti">
      {pieces.map(([x, y, fill, angle]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="4" rx="1" fill={fill} transform={`rotate(${angle} ${x} ${y})`} />
      ))}
    </g>
  );
}

function HeartShape({ x, y, size }: { x: number; y: number; size: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        className="mascot__heart"
        d="M0 6 C0 -2 10 -4 12 4 C14 -4 24 -2 24 6 C24 14 12 22 12 22 C12 22 0 14 0 6 Z"
        fill="#ff8fab"
      />
    </g>
  );
}

function CloudShape({ x, y, fill }: { x: number; y: number; fill: string }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`} fill={fill}>
      <circle cx="12" cy="14" r="12" />
      <circle cx="30" cy="10" r="14" />
      <circle cx="46" cy="16" r="10" />
      <rect x="10" y="14" width="40" height="12" rx="6" />
    </g>
  );
}

function Gear({ x, y, r, fill, reverse = false }: { x: number; y: number; r: number; fill: string; reverse?: boolean }): ReactElement {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={reverse ? "mascot__spin mascot__spin--reverse" : "mascot__spin"}>
        {[0, 45, 90, 135].map((angle) => (
          <rect key={angle} x={-r * 0.22} y={-r * 1.25} width={r * 0.44} height={r * 2.5} rx="2" fill={fill} transform={`rotate(${angle})`} />
        ))}
        <circle r={r} fill={fill} />
        <circle r={r * 0.4} fill="#ffffff" />
      </g>
    </g>
  );
}

/** The sprout in its scene. `reacting` plays a quick hop (e.g. right after an answer). */
export function Mascot({
  scene,
  reacting = false,
  accessory,
  title,
}: {
  scene: MascotScene;
  reacting?: boolean;
  /** Extra SVG drawn on the sprout's body (in the same 240×190 space), e.g. a personality's hat. */
  accessory?: ReactNode;
  /** If given, the mascot is announced to screen readers with this text instead of being hidden. */
  title?: string;
}): ReactElement {
  const { mood, prop, motion } = scene;
  // Unique gradient ids, in case two mascots are on screen at once.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = { body: `sprout-body-${uid}`, leaf: `sprout-leaf-${uid}`, soil: `sprout-soil-${uid}` };
  const blush = mood === "shy" || mood === "warm" ? 1 : 0.85;

  return (
    <svg
      className="mascot"
      viewBox="0 -4 240 194"
      focusable="false"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <defs>
        <radialGradient id={ids.body} cx="62%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#b6e27c" />
          <stop offset="55%" stopColor="#8fd04f" />
          <stop offset="100%" stopColor="#6fb83a" />
        </radialGradient>
        <linearGradient id={ids.leaf} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fe064" />
          <stop offset="100%" stopColor="#6cbf3b" />
        </linearGradient>
        <linearGradient id={ids.soil} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8b68f" />
          <stop offset="100%" stopColor="#b48b62" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="182" rx="66" ry="6" fill="rgba(0,0,0,0.10)" />
      <g className="mascot__prop-in">
        <Prop prop={prop} />
      </g>

      <g className={`mascot__body mascot__body--${motion}${reacting ? " mascot__body--react" : ""}`}>
        <Leaves mood={mood} ids={ids} />
        {/* Dome, with a soft highlight */}
        <path d="M66 156 C64 98 86 64 120 64 C154 64 176 98 174 156 Z" fill={`url(#${ids.body})`} />
        <ellipse cx="140" cy="86" rx="15" ry="9" fill="#ffffff" opacity="0.22" transform="rotate(30 140 86)" />
        {/* Cheeks, eyes, mouth */}
        <ellipse cx="96" cy="120" rx="7.5" ry="5" fill={PINK} opacity={blush} />
        <ellipse cx="144" cy="120" rx="7.5" ry="5" fill={PINK} opacity={blush} />
        <Eyes mood={mood} />
        <Mouth mood={mood} />
        <Wearable prop={prop} />
        {accessory}
        {mood === "oops" ? <path d="M160 82 q6 10 0 14 q-6 -4 0 -14 Z" fill={SKY} /> : null}
      </g>

      {/* Soil mound, in front of the dome's base */}
      <path
        d="M56 170 C58 152 84 144 120 144 C156 144 182 152 184 170 C184 177 168 181 120 181 C72 181 56 177 56 170 Z"
        fill={`url(#${ids.soil})`}
      />
      <ellipse cx="98" cy="152" rx="10" ry="3" fill="#ffffff" opacity="0.18" />

      {prop === "peek" ? <rect x="138" y="54" width="92" height="126" rx="12" fill="#ffffff" opacity="0.92" /> : null}
    </svg>
  );
}

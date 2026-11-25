import { useEffect, useState } from "react";
import type { CSSProperties, ReactElement } from "react";

const SEEN_KEY = "tb-login-intro-seen";
/** How long the tree plays before fading out, and how long the fade takes. */
const PLAY_MS = 3400;
const FADE_MS = 450;

const TEAMS = [
  { x: 70, fill: "#dde9f7", dot: "#3d6fa8" },
  { x: 180, fill: "#fff3b0", dot: "#000000" },
  { x: 290, fill: "#fbe3ec", dot: "#b04a76" },
] as const;

const MEMBER_OFFSETS = [
  [-14, 0],
  [14, 0],
  [-14, 25],
  [14, 25],
] as const;

/** Sets the animation start time for one piece of the tree. */
function at(seconds: number): CSSProperties {
  return { "--d": `${seconds}s` } as CSSProperties;
}

/** Plays once per browser tab, and never for people who prefer reduced motion. */
function shouldPlay(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return window.sessionStorage.getItem(SEEN_KEY) === null;
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage can be blocked; the intro then simply plays again next time.
  }
}

/**
 * A short animated "how it works" tree that plays over the login page:
 * class → students answer questionnaires → balanced teams. Click, Escape or
 * Skip ends it early.
 */
export function LoginIntro(): ReactElement | null {
  const [phase, setPhase] = useState<"playing" | "leaving" | "gone">(() => (shouldPlay() ? "playing" : "gone"));

  useEffect(() => {
    if (phase === "gone") return undefined;
    markSeen();
    const timer = window.setTimeout(
      () => setPhase(phase === "playing" ? "leaving" : "gone"),
      phase === "playing" ? PLAY_MS : FADE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") setPhase("leaving");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  if (phase === "gone") return null;

  const skip = (): void => setPhase((current) => (current === "playing" ? "leaving" : current));

  return (
    <div className={`intro${phase === "leaving" ? " intro--leaving" : ""}`} onClick={skip}>
      <svg
        className="intro__tree"
        viewBox="0 0 360 304"
        role="img"
        aria-label="Create a class, students answer the questionnaires, and balanced teams are formed."
      >
        <path className="intro__line" style={at(0.5)} d="M180 56 V94" pathLength={1} />
        <path className="intro__line" style={at(1.35)} d="M180 146 C180 178, 70 170, 70 204" pathLength={1} />
        <path className="intro__line" style={at(1.35)} d="M180 146 V204" pathLength={1} />
        <path className="intro__line" style={at(1.35)} d="M180 146 C180 178, 290 170, 290 204" pathLength={1} />

        <g className="intro__node" style={at(0.15)}>
          <rect className="intro__card" x="105" y="12" width="150" height="44" rx="12" />
          <text className="intro__title" x="180" y="31" textAnchor="middle">
            Create a class
          </text>
          <text className="intro__sub" x="180" y="46" textAnchor="middle">
            Join code · BD8VEF
          </text>
        </g>

        <g className="intro__node" style={at(0.75)}>
          <rect className="intro__card" x="66" y="94" width="228" height="52" rx="12" />
          <text className="intro__title" x="180" y="114" textAnchor="middle">
            Students answer questionnaires
          </text>
          <rect className="intro__track" x="92" y="126" width="176" height="6" rx="3" />
          <rect className="intro__fill" style={at(0.95)} x="92" y="126" width="176" height="6" rx="3" />
        </g>

        {TEAMS.map((team, teamIndex) => (
          <g key={team.x} className="intro__team" style={at(1.7 + teamIndex * 0.12)}>
            <rect x={team.x - 46} y="204" width="92" height="92" rx="14" fill={team.fill} />
            {MEMBER_OFFSETS.map(([dx, dy], memberIndex) => (
              <circle
                key={`${dx},${dy}`}
                className="intro__dot"
                style={at(2.05 + teamIndex * 0.12 + memberIndex * 0.06)}
                cx={team.x + dx}
                cy={228 + dy}
                r="9"
                fill={team.dot}
              />
            ))}
            <text className="intro__team-label" x={team.x} y="284" textAnchor="middle" fill={team.dot}>
              Team {teamIndex + 1}
            </text>
          </g>
        ))}
      </svg>

      <button
        type="button"
        className="intro__skip"
        onClick={(event) => {
          event.stopPropagation();
          skip();
        }}
      >
        Skip
      </button>
    </div>
  );
}

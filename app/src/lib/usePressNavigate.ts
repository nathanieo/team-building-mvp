import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router";

/** How long the clicked link shows its "pressed" style before the page changes. */
const PRESS_MS = 160;

/**
 * For links that flash a "pressed" style, then change page with a smooth
 * cross-fade (the browser's View Transitions; the logo glides between its
 * spots via `view-transition-name` in CSS). Browsers without View
 * Transitions just switch pages. `pressed` holds the destination being
 * opened, so the clicked link can style itself. New-tab clicks
 * (cmd/ctrl/shift, middle button) behave like normal links.
 */
export function usePressNavigate(): {
  pressed: string | null;
  onPress: (event: MouseEvent<HTMLAnchorElement>, to: string) => void;
} {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onPress(event: MouseEvent<HTMLAnchorElement>, to: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPressed(to);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const go = (): void => {
      if (!reduceMotion && typeof document.startViewTransition === "function") {
        // flushSync makes React render the new page inside the transition's snapshot.
        document.startViewTransition(() => flushSync(() => navigate(to)));
      } else {
        navigate(to);
      }
    };

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(go, reduceMotion ? 0 : PRESS_MS);
  }

  return { pressed, onPress };
}

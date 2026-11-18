import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router";

const PRESS_MS = 220;

/**
 * For links that flash a "pressed" style before the page changes. `pressed`
 * holds the destination being opened, so the clicked link can style itself.
 * New-tab clicks (cmd/ctrl/shift, middle button) behave like normal links.
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
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate(to), reduceMotion ? 0 : PRESS_MS);
  }

  return { pressed, onPress };
}

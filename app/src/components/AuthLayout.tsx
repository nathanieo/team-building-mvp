import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { BrandLogo } from "./BrandLogo";

/** Shared frame for the log-in and sign-up pages: brand gradient, logo, white card. */
export function AuthLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="auth-layout">
      <main className="auth-layout__main">
        <div className="auth-brand">
          <BrandLogo className="brand-logo" size={44} variant="frosted" />
          Team Building
        </div>
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}

interface AuthSwitchProps {
  prompt: string;
  /** Plain words before the highlighted part, e.g. "Join". */
  lead?: string;
  highlight: string;
  to: string;
}

const PRESS_MS = 220;

/**
 * "Not with us? Join Team Building" style link. The highlighted words flip
 * from green text to white-on-green when clicked, then the page changes.
 */
export function AuthSwitch({ prompt, lead, highlight, to }: AuthSwitchProps): ReactElement {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    // Let new-tab / new-window clicks behave normally.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPressed(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = window.setTimeout(() => navigate(to), reduceMotion ? 0 : PRESS_MS);
  }

  return (
    <p className="auth-switch">
      {prompt}{" "}
      <Link to={to} className="auth-switch__link" onClick={handleClick}>
        {lead ? `${lead} ` : null}
        <span className={`auth-switch__highlight${pressed ? " auth-switch__highlight--pressed" : ""}`}>
          {highlight}
        </span>
      </Link>
    </p>
  );
}

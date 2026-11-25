import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router";
import { usePressNavigate } from "../lib/usePressNavigate";
import { BrandLogo, BrandName } from "./BrandLogo";
import { TeamDots } from "./TeamDots";

/** Shared frame for the log-in, sign-up and join pages: brand gradient, logo, white card. */
export function AuthLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="auth-layout">
      <TeamDots />
      <main className="auth-layout__main">
        <div className="auth-brand">
          <BrandLogo className="brand-logo" size={44} />
          <BrandName />
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

/**
 * "Not with us? Join CoCongruo" style link. The highlighted words flip
 * from dark text to white-on-black when clicked, then the page changes.
 */
export function AuthSwitch({ prompt, lead, highlight, to }: AuthSwitchProps): ReactElement {
  const { pressed, onPress } = usePressNavigate();

  return (
    <p className="auth-switch">
      {prompt}{" "}
      <Link to={to} className="auth-switch__link" onClick={(event) => onPress(event, to)}>
        {lead ? `${lead} ` : null}
        <span className={`auth-switch__highlight${pressed ? " auth-switch__highlight--pressed" : ""}`}>
          {highlight}
        </span>
      </Link>
    </p>
  );
}

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Link } from "react-router";
import { joinCodeError, normalizeJoinCode } from "@team-building-mvp/contracts";
import { useAuth } from "../auth/useAuth";
import { AuthSwitch } from "../components/AuthLayout";
import { BrandLogo } from "../components/BrandLogo";

function StudentIcon(): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" />
      <path d="M22 9v5" />
    </svg>
  );
}

function FacilitatorIcon(): ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4" />
    </svg>
  );
}

/**
 * The site's front door: students enter a class code, facilitators log in.
 * The student join flow is the next roadmap step, so a valid code shows a
 * "coming soon" note for now instead of going anywhere.
 */
function HomePage(): ReactElement {
  const { state } = useAuth();
  const signedIn = state.status === "signed-in";
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [heldCode, setHeldCode] = useState<string | null>(null);

  function handleJoin(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalized = normalizeJoinCode(code);
    const problem = joinCodeError(normalized);
    if (problem) {
      setError(problem);
      setHeldCode(null);
      return;
    }
    setError(null);
    setHeldCode(normalized);
  }

  return (
    <div className="auth-layout">
      <main className="home">
        <div className="auth-brand">
          <BrandLogo className="brand-logo" size={44} variant="frosted" />
          Team Building
        </div>
        <h1 className="visually-hidden">Team Building: choose how to continue</h1>

        <div className="home__doors">
          <section className="door" aria-labelledby="door-student">
            <span className="door__icon">
              <StudentIcon />
            </span>
            <h2 id="door-student">I'm a student</h2>
            <p>Enter the code from your instructor.</p>

            <form className="door__actions" noValidate onSubmit={handleJoin}>
              <label className="visually-hidden" htmlFor="join-code">
                Class code
              </label>
              <input
                id="join-code"
                className={`code-input${error ? " code-input--invalid" : ""}`}
                value={code}
                placeholder="BD8VEF"
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "join-code-error" : undefined}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  setError(null);
                  setHeldCode(null);
                }}
              />
              {error ? (
                <p className="field__error" id="join-code-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="button button--primary button--block" type="submit">
                Join class
              </button>
              {heldCode ? (
                <div className="alert alert--info" role="status">
                  Joining with <strong>{heldCode}</strong> opens soon. Keep your code handy.
                </div>
              ) : null}
            </form>
          </section>

          <section className="door" aria-labelledby="door-facilitator">
            <span className="door__icon">
              <FacilitatorIcon />
            </span>
            <h2 id="door-facilitator">I'm a facilitator</h2>
            <p>Create classes and form teams.</p>

            <div className="door__actions">
              <Link to={signedIn ? "/dashboard" : "/login"} className="button button--primary button--block">
                {signedIn ? "Go to your dashboard" : "Log in"}
              </Link>
              {signedIn ? null : <AuthSwitch prompt="Not with us?" lead="Join" highlight="Team Building" to="/signup" />}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default HomePage;

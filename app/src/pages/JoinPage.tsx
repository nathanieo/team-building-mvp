import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { useNavigate } from "react-router";
import { joinCodeError, normalizeJoinCode } from "@team-building-mvp/contracts";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { api, ApiError } from "../lib/api";

/**
 * Student entry, step 1: type the class code. A real code moves on to the
 * sign-up page (/join/CODE), which asks for name, student ID and email.
 */
function JoinPage(): ReactElement {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleJoin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const normalized = normalizeJoinCode(code);
    const problem = joinCodeError(normalized);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const { cohort } = await api.lookupJoinCode(normalized);
      // Pass the class along so the next page can show it without asking again.
      navigate(`/join/${normalized}`, { state: { cohort } });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "We couldn't find a class with that code. Check it with your teacher."
          : caught instanceof ApiError
            ? caught.message
            : "Something went wrong. Try again.",
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Join your class</h1>

      <form className="stack" noValidate onSubmit={(event) => void handleJoin(event)}>
        <div className="field">
          <label className="field__label" htmlFor="join-code">
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
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "join-code-error" : undefined}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError(null);
            }}
          />
          {error ? (
            <p className="field__error" id="join-code-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button className="button button--primary button--block" type="submit" disabled={checking}>
          {checking ? "Checking…" : "Continue"}
        </button>
      </form>

      <AuthSwitch prompt="Already joined?" lead="Go to" highlight="your page" to="/student" />
      <AuthSwitch prompt="Are you a teacher?" highlight="Log in" to="/login" />
    </AuthLayout>
  );
}

export default JoinPage;

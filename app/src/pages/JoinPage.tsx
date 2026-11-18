import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { joinCodeError, normalizeJoinCode } from "@team-building-mvp/contracts";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";

/**
 * Student entry: type the class code. The student join flow is the next
 * roadmap step, so a valid code shows an "opens soon" note for now.
 */
function JoinPage(): ReactElement {
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
    <AuthLayout>
      <h1>Join your class</h1>

      <form className="stack" noValidate onSubmit={handleJoin}>
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
              setHeldCode(null);
            }}
          />
          {error ? (
            <p className="field__error" id="join-code-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button className="button button--primary button--block" type="submit">
          Join class
        </button>
      </form>

      {heldCode ? (
        <div className="alert alert--info" role="status">
          Joining with <strong>{heldCode}</strong> opens soon. Keep your code handy.
        </div>
      ) : null}

      <AuthSwitch prompt="Are you a teacher?" highlight="Log in" to="/login" />
    </AuthLayout>
  );
}

export default JoinPage;

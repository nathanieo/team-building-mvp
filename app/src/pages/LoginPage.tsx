import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AUTH_LIMITS, validateLoginRequest, validateRegisterRequest } from "@team-building-mvp/contracts";
import { useAuth } from "../auth/useAuth";
import { TextField } from "../components/TextField";
import { ApiError } from "../lib/api";

type Mode = "login" | "register";

interface FormValues {
  displayName: string;
  email: string;
  password: string;
  inviteCode: string;
}

const EMPTY: FormValues = { displayName: "", email: "", password: "", inviteCode: "" };

/**
 * Facilitator log-in page with a "create account" tab.
 * Validation uses the same shared rules as the API, so errors match exactly.
 */
function LoginPage(): ReactElement {
  const { state, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "signed-in") return <Navigate replace to="/dashboard" />;

  const destination =
    typeof (location.state as { from?: unknown } | null)?.from === "string"
      ? (location.state as { from: string }).from
      : "/dashboard";

  function update(field: keyof FormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  function switchMode(next: Mode): void {
    setMode(next);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    const loginCheck = validateLoginRequest(values);
    const registerCheck = validateRegisterRequest(values);
    const check = mode === "login" ? loginCheck : registerCheck;
    if (!check.ok) {
      setFieldErrors(check.errors as Record<string, string>);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login" && loginCheck.ok) await login(loginCheck.value);
      if (mode === "register" && registerCheck.ok) await register(registerCheck.value);
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(Object.keys(error.fieldErrors).length > 0 ? null : error.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand" aria-hidden="true">
        <div className="brand-mark">TB</div>
        <h2>Fair, explainable teams in one class period.</h2>
        <ol className="auth-steps">
          <li>Create a class and share the join code</li>
          <li>Students answer two short questionnaires</li>
          <li>Review suggested teams, adjust, and lock</li>
        </ol>
      </aside>

      <main className="auth-layout__main">
        <div className="auth-card">
          <p className="eyebrow">Facilitator</p>
          <h1>{isLogin ? "Log in" : "Create your account"}</h1>
          <p className="auth-card__lead">
            {isLogin
              ? "Manage your classes, track questionnaire progress and form teams."
              : "Set up a facilitator account to run your first class."}
          </p>

          <div className="segmented" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className="segmented__option"
              onClick={() => switchMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className="segmented__option"
              onClick={() => switchMode("register")}
            >
              Create account
            </button>
          </div>

          {formError ? (
            <div className="alert alert--error" role="alert">
              {formError}
            </div>
          ) : null}

          <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
            {!isLogin ? (
              <TextField
                label="Your name"
                name="displayName"
                autoComplete="name"
                value={values.displayName}
                error={fieldErrors.displayName}
                onChange={(event) => update("displayName", event.target.value)}
              />
            ) : null}

            <TextField
              label="School email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              error={fieldErrors.email}
              onChange={(event) => update("email", event.target.value)}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={values.password}
              error={fieldErrors.password}
              hint={isLogin ? undefined : `At least ${AUTH_LIMITS.passwordMinimumLength} characters.`}
              onChange={(event) => update("password", event.target.value)}
              trailing={
                <button
                  type="button"
                  className="field__toggle"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((shown) => !shown)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />

            {!isLogin ? (
              <TextField
                label="Invite code (if you were given one)"
                name="inviteCode"
                autoComplete="off"
                value={values.inviteCode}
                error={fieldErrors.inviteCode}
                onChange={(event) => update("inviteCode", event.target.value)}
              />
            ) : null}

            <button className="button button--primary button--block" type="submit" disabled={submitting}>
              {submitting ? (isLogin ? "Logging in…" : "Creating account…") : isLogin ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

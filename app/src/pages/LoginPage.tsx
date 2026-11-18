import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { validateLoginRequest } from "@team-building-mvp/contracts";
import { useAuth } from "../auth/useAuth";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { LoginIntro } from "../components/LoginIntro";
import { AppleIcon, GoogleIcon, MicrosoftIcon } from "../components/SocialIcons";
import { TextField } from "../components/TextField";
import { ApiError } from "../lib/api";

interface FormValues {
  identifier: string;
  password: string;
}

const EMPTY: FormValues = { identifier: "", password: "" };

const PROVIDERS = [
  { name: "Google", Icon: GoogleIcon },
  { name: "Apple", Icon: AppleIcon },
  { name: "Microsoft", Icon: MicrosoftIcon },
] as const;

/**
 * Facilitator log-in page. New facilitators sign up from the link at the bottom.
 * Validation uses the same shared rules as the API, so errors match exactly.
 */
function LoginPage(): ReactElement {
  const { state, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const check = validateLoginRequest(values);
    if (!check.ok) {
      setFieldErrors(check.errors as Record<string, string>);
      return;
    }

    setSubmitting(true);
    try {
      await login(check.value);
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

  // Placeholder until single sign-on is connected to the API.
  function handleProvider(provider: string): void {
    setFormError(null);
    setNotice(`Signing in with ${provider} isn't available yet. Use your email and password for now.`);
  }

  return (
    <>
      <LoginIntro />
      <AuthLayout>
        <h1>Log in</h1>

        {formError ? (
          <div className="alert alert--error" role="alert">
            {formError}
          </div>
        ) : null}

        <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            label="Username or email"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.identifier}
            error={fieldErrors.identifier}
            onChange={(event) => update("identifier", event.target.value)}
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={values.password}
            error={fieldErrors.password}
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

          <button className="button button--primary button--block" type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="social-buttons">
          {PROVIDERS.map(({ name, Icon }) => (
            <button key={name} type="button" className="social-button" onClick={() => handleProvider(name)}>
              <Icon />
              <span>
                <span className="visually-hidden">Continue with </span>
                {name}
              </span>
            </button>
          ))}
        </div>

        {notice ? (
          <div className="alert alert--info" role="status">
            {notice}
          </div>
        ) : null}

        <AuthSwitch prompt="Not with us?" lead="Join" highlight="Team Building" to="/signup" />
      </AuthLayout>
    </>
  );
}

export default LoginPage;

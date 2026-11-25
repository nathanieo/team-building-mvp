import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Navigate, useNavigate } from "react-router";
import { AUTH_LIMITS, validateRegisterRequest } from "@team-building-mvp/contracts";
import { useAuth } from "../auth/useAuth";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { ApiError } from "../lib/api";

interface FormValues {
  displayName: string;
  username: string;
  email: string;
  password: string;
}

const EMPTY: FormValues = { displayName: "", username: "", email: "", password: "" };

/**
 * The API only asks for an invite code when FACILITATOR_INVITE_CODE is set on
 * the server. This page has no invite field, so explain that case instead.
 */
const INVITE_ONLY_MESSAGE = "Sign-ups are invite-only on this site right now. Ask your administrator for access.";

/** Facilitator sign-up, reached from "Join CoCongruo" on the log-in page. */
function SignupPage(): ReactElement {
  const { state, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "signed-in") return <Navigate replace to="/dashboard" />;

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

    const check = validateRegisterRequest(values);
    if (!check.ok) {
      setFieldErrors(check.errors as Record<string, string>);
      return;
    }

    setSubmitting(true);
    try {
      await register(check.value);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        const { inviteCode, ...shownErrors } = error.fieldErrors;
        setFieldErrors(shownErrors);
        if (inviteCode) setFormError(INVITE_ONLY_MESSAGE);
        else setFormError(Object.keys(shownErrors).length > 0 ? null : error.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Create your account</h1>

      {formError ? (
        <div className="alert alert--error" role="alert">
          {formError}
        </div>
      ) : null}

      <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextField
          label="Your name"
          name="displayName"
          autoComplete="name"
          value={values.displayName}
          error={fieldErrors.displayName}
          onChange={(event) => update("displayName", event.target.value)}
        />

        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={values.username}
          error={fieldErrors.username}
          onChange={(event) => update("username", event.target.value)}
        />

        <TextField
          label="Email"
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
          autoComplete="new-password"
          value={values.password}
          error={fieldErrors.password}
          hint={`At least ${AUTH_LIMITS.passwordMinimumLength} characters.`}
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <AuthSwitch prompt="Already with us?" highlight="Log in" to="/login" />
    </AuthLayout>
  );
}

export default SignupPage;

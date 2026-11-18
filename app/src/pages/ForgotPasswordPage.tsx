import { useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { emailError } from "@team-building-mvp/contracts";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { TextField } from "../components/TextField";

/**
 * "Forgot password?" from the log-in page. The API can't send reset emails
 * yet, so after a valid address this says so plainly instead of pretending
 * an email went out. Wire the submit to a reset endpoint once one exists.
 */
function ForgotPasswordPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const problem = emailError(email);
    setError(problem);
    setNotice(problem ? null : "Password reset emails aren't available yet, so no email was sent.");
  }

  return (
    <AuthLayout>
      <h1>Reset your password</h1>

      <form className="stack" noValidate onSubmit={handleSubmit}>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          error={error}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(undefined);
            setNotice(null);
          }}
        />

        <button className="button button--primary button--block" type="submit">
          Send reset link
        </button>
      </form>

      {notice ? (
        <div className="alert alert--info" role="status">
          {notice}
        </div>
      ) : null}

      <AuthSwitch prompt="Remembered it?" highlight="Log in" to="/login" />
    </AuthLayout>
  );
}

export default ForgotPasswordPage;

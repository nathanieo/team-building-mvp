import { useEffect, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Link, useLocation, useParams } from "react-router";
import { joinCodeError, normalizeJoinCode, validateStudentJoinRequest } from "@team-building-mvp/contracts";
import type { JoinClassInfo } from "@team-building-mvp/contracts";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { api, ApiError } from "../lib/api";

type ClassState =
  | { status: "loading" }
  | { status: "missing"; message: string }
  | { status: "ready"; cohort: JoinClassInfo };

interface FormValues {
  displayName: string;
  studentId: string;
  email: string;
}

const EMPTY: FormValues = { displayName: "", studentId: "", email: "" };

/**
 * Student entry, step 2 (/join/CODE): the first time a student joins a class
 * they give their full name, student ID and student email. The class comes
 * from the code page, or is looked up here when the link is opened directly.
 */
function StudentSignupPage(): ReactElement {
  const params = useParams();
  const location = useLocation();
  const code = normalizeJoinCode(params.code ?? "");
  const passed = (location.state as { cohort?: JoinClassInfo } | null)?.cohort;

  const [classState, setClassState] = useState<ClassState>(() =>
    passed ? { status: "ready", cohort: passed } : { status: "loading" },
  );
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinedName, setJoinedName] = useState<string | null>(null);

  useEffect(() => {
    if (passed) return undefined;
    if (joinCodeError(code)) {
      setClassState({ status: "missing", message: "That link doesn't have a valid class code." });
      return undefined;
    }
    let cancelled = false;
    api
      .lookupJoinCode(code)
      .then(({ cohort }) => {
        if (!cancelled) setClassState({ status: "ready", cohort });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setClassState({
          status: "missing",
          message:
            caught instanceof ApiError && caught.status === 404
              ? "We couldn't find a class with that code. Check it with your teacher."
              : caught instanceof ApiError
                ? caught.message
                : "Something went wrong. Try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [code, passed]);

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
    const check = validateStudentJoinRequest(values);
    if (!check.ok) {
      setFieldErrors(check.errors as Record<string, string>);
      return;
    }
    setSubmitting(true);
    try {
      const { student } = await api.joinClass(code, check.value);
      setJoinedName(student.displayName.split(/\s+/)[0] ?? student.displayName);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors);
        setFormError(Object.keys(caught.fieldErrors).length > 0 ? null : caught.message);
      } else {
        setFormError("Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (classState.status === "loading") {
    return (
      <AuthLayout>
        <p className="page-loading page-loading--inline" role="status">
          Finding your class…
        </p>
      </AuthLayout>
    );
  }

  if (classState.status === "missing") {
    return (
      <AuthLayout>
        <h1>Class not found</h1>
        <div className="alert alert--error" role="alert">
          {classState.message}
        </div>
        <Link to="/join" className="button button--primary button--block">
          Enter a different code
        </Link>
      </AuthLayout>
    );
  }

  const { cohort } = classState;

  if (joinedName) {
    return (
      <AuthLayout>
        <div className="join-done">
          <span className="join-done__check" aria-hidden="true">
            ✓
          </span>
          <h1>You're in, {joinedName}!</h1>
          <p>
            You've joined <strong>{cohort.name}</strong>. Your teacher can now see that you're in the class.
          </p>
          <p className="join-done__next">Your questionnaires will open here soon.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="join-heading">
        <h1>Join {cohort.name}</h1>
        {cohort.term ? <p>{cohort.term}</p> : null}
      </div>

      {formError ? (
        <div className="alert alert--error" role="alert">
          {formError}
        </div>
      ) : null}

      <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextField
          label="Full name"
          name="displayName"
          autoComplete="name"
          autoFocus
          value={values.displayName}
          error={fieldErrors.displayName}
          onChange={(event) => update("displayName", event.target.value)}
        />

        <TextField
          label="Student ID"
          name="studentId"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          value={values.studentId}
          error={fieldErrors.studentId}
          onChange={(event) => update("studentId", event.target.value)}
        />

        <TextField
          label="Student email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          error={fieldErrors.email}
          onChange={(event) => update("email", event.target.value)}
        />

        <button className="button button--primary button--block" type="submit" disabled={submitting}>
          {submitting ? "Joining…" : "Join class"}
        </button>
      </form>

      <AuthSwitch prompt="Wrong class?" highlight="Change code" to="/join" />
    </AuthLayout>
  );
}

export default StudentSignupPage;

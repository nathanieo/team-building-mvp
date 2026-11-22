import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { studentStage, validateStudentLoginRequest } from "@team-building-mvp/contracts";
import type { StudentClassView, StudentHomeResponse, StudentStage } from "@team-building-mvp/contracts";
import { AuthLayout, AuthSwitch } from "../components/AuthLayout";
import { BrandLogo } from "../components/BrandLogo";
import { QuestionnairesStage, TeamStage, WaitingStage } from "../components/StudentStages";
import { TeamDots } from "../components/TeamDots";
import { TextField } from "../components/TextField";
import { api, ApiError } from "../lib/api";
import { isDemoMode } from "../lib/demoFlag";

type LoadState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; home: StudentHomeResponse };

const STAGE_LABELS: Record<StudentStage, string> = {
  questionnaires: "Questionnaires",
  waiting: "Waiting",
  team: "Team",
};

/** Development only: flip the demo student's class between the three stages. */
function DemoStageSwitcher({ view, onChanged }: { view: StudentClassView; onChanged: () => void }): ReactElement | null {
  if (!import.meta.env.DEV || !isDemoMode()) return null;
  const current = studentStage(view);
  return (
    <div className="demo-stages" role="group" aria-label="Preview stage (demo only)">
      <span>Preview stage</span>
      {(Object.keys(STAGE_LABELS) as StudentStage[]).map((stage) => (
        <button
          key={stage}
          type="button"
          className="filter-chip"
          aria-pressed={current === stage}
          onClick={() => {
            void import("../lib/demoApi").then(({ setDemoStudentStage }) => {
              setDemoStudentStage(view.code, stage);
              onChanged();
            });
          }}
        >
          {STAGE_LABELS[stage]}
        </button>
      ))}
    </div>
  );
}

function ChevronIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * The class button at the top of a student's page. With several classes it
 * opens a list to switch between their pages; with one it just names it.
 */
function ClassSwitcher({
  classes,
  current,
  onPick,
}: {
  classes: StudentClassView[];
  current: StudentClassView;
  onPick: (code: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event: MouseEvent): void {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const label = (
    <>
      <span className="class-switcher__name">{current.name}</span>
      {current.term ? <span className="class-switcher__term">{current.term}</span> : null}
    </>
  );

  if (classes.length < 2) return <div className="class-switcher__button class-switcher__button--single">{label}</div>;

  return (
    <div className="class-switcher" ref={wrapperRef}>
      <button
        type="button"
        className="class-switcher__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${current.name}. Switch class`}
        onClick={() => setOpen((shown) => !shown)}
      >
        {label}
        <ChevronIcon />
      </button>
      {open ? (
        <ul className="class-switcher__menu" aria-label="Your classes">
          {classes.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                className="class-switcher__option"
                aria-current={item.code === current.code ? "page" : undefined}
                onClick={() => {
                  setOpen(false);
                  onPick(item.code);
                }}
              >
                <span className="class-switcher__name">{item.name}</span>
                {item.term ? <span className="class-switcher__term">{item.term}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StudentLoginForm({ onSignedIn }: { onSignedIn: (home: StudentHomeResponse) => void }): ReactElement {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);
    const check = validateStudentLoginRequest({ email });
    if (!check.ok) {
      setFieldError(check.errors.email);
      return;
    }
    setSubmitting(true);
    try {
      onSignedIn(await api.studentLogin(check.value));
    } catch (caught) {
      if (caught instanceof ApiError && caught.fieldErrors.email) setFieldError(caught.fieldErrors.email);
      else setFormError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Go to your page</h1>

      {formError ? (
        <div className="alert alert--error" role="alert">
          {formError}
        </div>
      ) : null}

      <form className="stack" noValidate onSubmit={(event) => void handleSubmit(event)}>
        <TextField
          label="Student email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          error={fieldError}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldError(undefined);
          }}
        />
        <button className="button button--primary button--block" type="submit" disabled={submitting}>
          {submitting ? "Opening…" : "Continue"}
        </button>
      </form>

      {import.meta.env.DEV && isDemoMode() ? (
        <p className="demo-hint">
          Demo: try <strong>ana.lopez@school.edu</strong>
        </p>
      ) : null}

      <AuthSwitch prompt="New here?" highlight="Join a class" to="/join" />
    </AuthLayout>
  );
}

/**
 * A student's own pages: /student/CODE for each class they're in (/student
 * opens their first). One card says what to do now for that class: finish
 * questionnaires, wait for teams, or meet their team.
 */
function StudentHomePage(): ReactElement {
  const navigate = useNavigate();
  const { code } = useParams();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  const fetchHome = useCallback(async () => {
    try {
      const home = await api.studentHome();
      setLoad({ status: "ready", home });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setLoad({ status: "signed-out" });
        return;
      }
      setLoad({ status: "error", message: caught instanceof ApiError ? caught.message : "Couldn't load your page." });
    }
  }, []);

  useEffect(() => {
    void fetchHome();
  }, [fetchHome]);

  const classes = load.status === "ready" ? load.home.classes : [];
  const view = classes.find((item) => item.code === code) ?? classes[0];

  // Keep the address on the class being shown, so each class has its own page.
  useEffect(() => {
    if (view && view.code !== code) navigate(`/student/${view.code}`, { replace: true });
  }, [view, code, navigate]);

  async function logOut(): Promise<void> {
    try {
      await api.studentLogout();
    } finally {
      setLoad({ status: "signed-out" });
      navigate("/student", { replace: true });
    }
  }

  if (load.status === "loading") {
    return (
      <div className="page-loading" role="status">
        Loading…
      </div>
    );
  }

  if (load.status === "signed-out") {
    return <StudentLoginForm onSignedIn={(home) => setLoad({ status: "ready", home })} />;
  }

  if (load.status === "error") {
    return (
      <AuthLayout>
        <h1>Something went wrong</h1>
        <div className="alert alert--error" role="alert">
          {load.message}
        </div>
        <button type="button" className="button button--primary button--block" onClick={() => void fetchHome()}>
          Try again
        </button>
      </AuthLayout>
    );
  }

  const { student } = load.home;
  const firstName = student.displayName.split(/\s+/)[0] ?? student.displayName;
  const stage = view ? studentStage(view) : null;

  return (
    <div className="student-page">
      <section className="dash-hero student-hero">
        <TeamDots contained />
        <header className="dash-bar">
          <div className="auth-brand dash-bar__brand">
            <BrandLogo className="brand-logo" size={36} variant="frosted" />
            Team Building
          </div>
          <div className="dash-bar__account">
            <span className="dash-bar__name">{student.displayName}</span>
            <button type="button" className="dash-bar__logout" onClick={() => void logOut()}>
              Log out
            </button>
          </div>
        </header>
        <div className="dash-hero__intro">
          <h1>Hi, {firstName}</h1>
          {view ? (
            <ClassSwitcher classes={classes} current={view} onPick={(next) => navigate(`/student/${next}`)} />
          ) : null}
        </div>
      </section>

      <main className="student-main">
        {view ? (
          <>
            <DemoStageSwitcher view={view} onChanged={() => void fetchHome()} />
            {stage === "questionnaires" ? <QuestionnairesStage key={view.code} view={view} /> : null}
            {stage === "waiting" ? <WaitingStage /> : null}
            {stage === "team" && view.team ? <TeamStage team={view.team} /> : null}
          </>
        ) : (
          <div className="stage-card stage-card--centered">
            <h2>No classes yet</h2>
            <p className="stage-card__lead">Join a class with the code from your teacher.</p>
            <Link className="button button--primary" to="/join">
              Join a class
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentHomePage;

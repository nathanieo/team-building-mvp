import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { CohortSummary, Facilitator } from "@team-building-mvp/contracts";
import { useAuth } from "../auth/useAuth";
import { BrandLogo } from "../components/BrandLogo";
import { ClassCard } from "../components/ClassCard";
import { CreateClassDialog } from "../components/CreateClassDialog";
import { TeamDots } from "../components/TeamDots";
import { api, ApiError } from "../lib/api";
import { summarizeCohorts } from "../lib/cohortProgress";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; cohorts: CohortSummary[] };

function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Facilitator home: totals across classes, the class list, and creating a class. */
function DashboardPage({ facilitator }: { facilitator: Facilitator }): ReactElement {
  const { logout, handleSessionExpired } = useAuth();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newestId, setNewestId] = useState<string | null>(null);

  const fetchCohorts = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      const { cohorts } = await api.listCohorts();
      setLoad({ status: "ready", cohorts });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSessionExpired();
        return;
      }
      setLoad({
        status: "error",
        message: error instanceof ApiError ? error.message : "Couldn't load your classes.",
      });
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    void fetchCohorts();
  }, [fetchCohorts]);

  function handleCreated(cohort: CohortSummary): void {
    setDialogOpen(false);
    setNewestId(cohort.id);
    setLoad((current) =>
      current.status === "ready" ? { status: "ready", cohorts: [cohort, ...current.cohorts] } : current,
    );
  }

  const cohorts = load.status === "ready" ? load.cohorts : [];
  const totals = summarizeCohorts(cohorts);
  const firstName = facilitator.displayName.split(" ").find((part) => !/^(dr|prof|mr|mrs|ms)\.?$/i.test(part));

  return (
    <div className="dashboard">
      <section className="dash-hero">
        <TeamDots contained />
        <header className="dash-bar">
          <div className="auth-brand dash-bar__brand">
            <BrandLogo className="brand-logo" size={36} variant="frosted" />
            Team Building
          </div>
          <div className="dash-bar__account">
            <span className="dash-bar__name">{facilitator.displayName}</span>
            <button type="button" className="dash-bar__logout" onClick={() => void logout()}>
              Log out
            </button>
          </div>
        </header>

        <div className="dash-hero__intro">
          <h1>
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <button type="button" className="dash-new-class" onClick={() => setDialogOpen(true)}>
            <span aria-hidden="true">+</span> New class
          </button>
        </div>
      </section>

      <main className="dashboard__main">
        <section className="stat-strip" aria-label="Totals across your classes">
          <div className="stat">
            <span className="stat__label">Classes</span>
            <span className="stat__value">{totals.classCount}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Students joined</span>
            <span className="stat__value">{totals.studentCount}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Questionnaires complete</span>
            <span className="stat__value">
              {totals.completionPercent === null ? "—" : `${totals.completionPercent}%`}
              {totals.studentCount > 0 ? (
                <span className="stat__sub">
                  {totals.completedCount} of {totals.studentCount}
                </span>
              ) : null}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Teams formed</span>
            <span className="stat__value">{totals.teamCount}</span>
          </div>
        </section>

        <section aria-labelledby="classes-heading">
          <h2 id="classes-heading" className="section-heading">
            Your classes
          </h2>

          {load.status === "loading" ? (
            <div className="class-grid" aria-busy="true">
              <div className="class-card class-card--skeleton" />
              <div className="class-card class-card--skeleton" />
            </div>
          ) : null}

          {load.status === "error" ? (
            <div className="alert alert--error" role="alert">
              {load.message}{" "}
              <button type="button" className="link-button" onClick={() => void fetchCohorts()}>
                Try again
              </button>
            </div>
          ) : null}

          {load.status === "ready" && cohorts.length === 0 ? (
            <div className="empty-state">
              <h3>Create your first class</h3>
              <p>You'll get a join code to share with your students.</p>
              <button type="button" className="button button--primary" onClick={() => setDialogOpen(true)}>
                + New class
              </button>
            </div>
          ) : null}

          {load.status === "ready" && cohorts.length > 0 ? (
            <div className="class-grid">
              {cohorts.map((cohort) => (
                <ClassCard key={cohort.id} cohort={cohort} highlighted={cohort.id === newestId} />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <CreateClassDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
        onUnauthorized={handleSessionExpired}
      />
    </div>
  );
}

export default DashboardPage;

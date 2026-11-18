import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { formatTeamSize } from "@team-building-mvp/contracts";
import type { CohortSummary } from "@team-building-mvp/contracts";
import { StudentsTab } from "./StudentsTab";

const TABS = [
  { id: "students", label: "Students" },
  { id: "projects", label: "Projects" },
  { id: "teams", label: "Teams" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface ClassPanelProps {
  /** The class to show; null keeps the panel closed. */
  cohort: CohortSummary | null;
  onClose: () => void;
  onUnauthorized: () => void;
}

/**
 * Panel that slides out from the right when a class card is clicked, with
 * tabs for the class. A native <dialog> gives focus trapping and Escape.
 */
export function ClassPanel({ cohort, onClose, onUnauthorized }: ClassPanelProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<TabId>("students");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (cohort && !dialog.open) {
      setTab("students");
      dialog.showModal();
    }
    if (!cohort && dialog.open) dialog.close();
  }, [cohort]);

  // Left/right arrows move between tabs, as screen-reader users expect.
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const index = TABS.findIndex((item) => item.id === tab);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
    if (!next) return;
    setTab(next.id);
    document.getElementById(`class-tab-${next.id}`)?.focus();
  }

  return (
    <dialog
      ref={dialogRef}
      className="drawer"
      aria-labelledby="class-panel-title"
      onClose={onClose}
      // A click on the dimmed area outside the panel lands on the dialog itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      {cohort ? (
        <div className="drawer__inner">
          <header className="drawer__header">
            <div>
              <h2 id="class-panel-title">{cohort.name}</h2>
              <p className="drawer__meta">
                {[cohort.term, `Teams of ${formatTeamSize(cohort.teamSize, cohort.teamSizeMax)}`].filter(Boolean).join(" · ")} · Join code{" "}
                <code className="drawer__code">{cohort.joinCode}</code>
              </p>
            </div>
            <button
              type="button"
              className="drawer__close"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </header>

          <div className="tabs" role="tablist" aria-label={`${cohort.name} sections`}>
            {TABS.map((item) => (
              <button
                key={item.id}
                id={`class-tab-${item.id}`}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === item.id}
                aria-controls={`class-tabpanel-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={handleTabKey}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            className="drawer__body"
            role="tabpanel"
            id={`class-tabpanel-${tab}`}
            aria-labelledby={`class-tab-${tab}`}
          >
            {tab === "students" ? <StudentsTab key={cohort.id} cohortId={cohort.id} onUnauthorized={onUnauthorized} /> : null}
            {tab === "projects" ? (
              <div className="drawer-empty">
                <h3>No projects yet</h3>
                <p>Adding the projects students will work on comes next.</p>
              </div>
            ) : null}
            {tab === "teams" ? (
              <div className="drawer-empty">
                <h3>No teams yet</h3>
                <p>Teams show up here once you form them.</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

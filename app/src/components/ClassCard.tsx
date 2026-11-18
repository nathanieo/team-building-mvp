import { useState } from "react";
import type { ReactElement } from "react";
import { formatTeamSize } from "@team-building-mvp/contracts";
import type { CohortSummary } from "@team-building-mvp/contracts";
import { describeNextStep, formatCreated, STATUS_LABELS } from "../lib/cohortProgress";

interface ClassCardProps {
  cohort: CohortSummary;
  highlighted?: boolean;
  /** Opens the class panel. The whole card is clickable; Copy still works on its own. */
  onOpen: () => void;
}

/** One class on the dashboard: join code, questionnaire progress and next step. */
export function ClassCard({ cohort, highlighted = false, onOpen }: ClassCardProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const percent = cohort.studentCount === 0 ? 0 : Math.round((cohort.completedCount / cohort.studentCount) * 100);

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(cohort.joinCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the code is still visible to copy by hand.
    }
  }

  return (
    <article className={`class-card${highlighted ? " class-card--new" : ""}`} aria-labelledby={`class-${cohort.id}`}>
      <header className="class-card__header">
        <div>
          <h3 id={`class-${cohort.id}`}>
            <button type="button" className="class-card__open" onClick={onOpen}>
              {cohort.name}
            </button>
          </h3>
          <p className="class-card__meta">
            {[cohort.term, `Teams of ${formatTeamSize(cohort.teamSize, cohort.teamSizeMax)}`, formatCreated(cohort.createdAt)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`status-pill status-pill--${cohort.status}`}>{STATUS_LABELS[cohort.status]}</span>
      </header>

      <div className="class-card__body">
        <div className="join-code">
          <span className="join-code__label">Join code</span>
          <code className="join-code__value">{cohort.joinCode}</code>
          <button type="button" className="button button--small button--ghost" onClick={() => void copyCode()}>
            {copied ? "Copied" : "Copy"}
          </button>
          <span className="visually-hidden" aria-live="polite">
            {copied ? "Join code copied" : ""}
          </span>
        </div>

        <div className="progress-block">
          <div className="progress-block__labels">
            <span>Questionnaires complete</span>
            <span>
              <strong>{cohort.completedCount}</strong> of {cohort.studentCount} joined
            </span>
          </div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={`${cohort.name} questionnaire completion`}
          >
            <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <p className="class-card__next">
          <span className="class-card__next-arrow" aria-hidden="true">
            →
          </span>
          <span>
            <span className="visually-hidden">Next step: </span>
            {describeNextStep(cohort)}
          </span>
        </p>
      </div>
    </article>
  );
}

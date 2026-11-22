import { useState } from "react";
import type { ReactElement } from "react";
import type { QuestionnaireProgress, StudentClassView, StudentTeam } from "@team-building-mvp/contracts";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

function questionnaireStatus(item: QuestionnaireProgress): { label: string; tone: "todo" | "partway" | "done" } {
  if (item.answered >= item.total) return { label: "Done", tone: "done" };
  if (item.answered > 0) return { label: `${item.answered} of ${item.total} answered`, tone: "partway" };
  return { label: "Not started", tone: "todo" };
}

/** Stage 1: the two questionnaires, with progress and Start / Continue buttons. */
export function QuestionnairesStage({ view }: { view: StudentClassView }): ReactElement {
  const [notice, setNotice] = useState(false);
  const doneCount = view.questionnaires.filter((item) => item.answered >= item.total).length;
  // The bar follows questions answered, so it moves even before a whole questionnaire is done.
  const answeredTotal = view.questionnaires.reduce((sum, item) => sum + Math.min(item.answered, item.total), 0);
  const questionTotal = view.questionnaires.reduce((sum, item) => sum + item.total, 0);
  const percent = Math.round((answeredTotal / Math.max(1, questionTotal)) * 100);

  return (
    <section className="stage-card" aria-labelledby="stage-title">
      <h2 id="stage-title">Finish your questionnaires</h2>

      <div className="stage-progress">
        <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Questionnaires done">
          <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
        </div>
        <span>
          {doneCount} of {view.questionnaires.length} done
        </span>
      </div>

      <ul className="questionnaire-list">
        {view.questionnaires.map((item) => {
          const status = questionnaireStatus(item);
          return (
            <li key={item.id} className="questionnaire-item">
              <span className={`questionnaire-item__mark questionnaire-item__mark--${status.tone}`} aria-hidden="true">
                {status.tone === "done" ? "✓" : ""}
              </span>
              <span className="questionnaire-item__text">
                <span className="questionnaire-item__title">{item.title}</span>
                <span className="questionnaire-item__meta">
                  About {item.minutes} min · {status.label}
                </span>
              </span>
              {status.tone === "done" ? null : (
                <button
                  type="button"
                  className={`button button--small ${status.tone === "partway" ? "button--primary" : "button--ghost"}`}
                  onClick={() => setNotice(true)}
                >
                  {status.tone === "partway" ? "Continue" : "Start"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {notice ? (
        <div className="alert alert--info" role="status">
          The questionnaire screens are coming next.
        </div>
      ) : null}
    </section>
  );
}

/** Stage 2: everything answered, teams not out yet. */
export function WaitingStage(): ReactElement {
  return (
    <section className="stage-card stage-card--centered" aria-labelledby="stage-title">
      <span className="stage-card__check" aria-hidden="true">
        ✓
      </span>
      <h2 id="stage-title">You're all set</h2>
      <p className="stage-card__lead">Your teacher will form teams soon. Your team will show up here.</p>
    </section>
  );
}

/** Stage 3: the locked team, teammates to contact, and why the team fits together. */
export function TeamStage({ team }: { team: StudentTeam }): ReactElement {
  const others = team.members.filter((member) => !member.isYou);
  const mailto = `mailto:${others.map((member) => member.email).join(",")}?subject=${encodeURIComponent(team.name)}`;

  return (
    <section className="stage-card" aria-labelledby="stage-title">
      <p className="stage-card__kicker">Your team</p>
      <h2 id="stage-title">{team.name}</h2>
      {team.project ? <p className="stage-card__lead">Project: {team.project}</p> : null}

      <ul className="team-members">
        {team.members.map((member) => (
          <li key={member.email} className="team-member">
            <span className="team-member__avatar" aria-hidden="true">
              {initials(member.displayName)}
            </span>
            <span className="team-member__text">
              <span className="team-member__name">
                {member.displayName}
                {member.isYou ? <span className="team-member__you">You</span> : null}
              </span>
              {member.isYou ? (
                <span className="team-member__email">{member.email}</span>
              ) : (
                <a className="team-member__email" href={`mailto:${member.email}`}>
                  {member.email}
                </a>
              )}
            </span>
          </li>
        ))}
      </ul>

      {others.length > 0 ? (
        <a className="button button--primary button--block" href={mailto}>
          Email your team
        </a>
      ) : null}

      {team.reasons.length > 0 ? (
        <div className="team-why">
          <h3>Why this team</h3>
          <ul>
            {team.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

import { Fragment } from "react";
import type { CSSProperties, ReactElement } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { BrandLogo, BrandName } from "../components/BrandLogo";
import { TeamDots } from "../components/TeamDots";
import { usePressNavigate } from "../lib/usePressNavigate";

/** Each word pops in one after another, then the answer buttons follow. */
const QUESTION = "Are you a student or a teacher?";

function ArrowIcon(): ReactElement {
  return (
    <svg
      className="choice-pill__arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * The site's front door. One question, two answers: students go to the
 * class-code page, teachers go to log in (or their dashboard if signed in).
 */
function HomePage(): ReactElement {
  const { state } = useAuth();
  const { pressed, onPress } = usePressNavigate();
  const teacherTo = state.status === "signed-in" ? "/dashboard" : "/login";

  const choices = [
    { label: "Student", to: "/join" },
    { label: "Teacher", to: teacherTo },
  ];

  return (
    <div className="home-page">
      <TeamDots />
      <header className="home-page__bar">
        <div className="auth-brand">
          <BrandLogo className="brand-logo" size={44} />
          <BrandName />
        </div>
      </header>

      <main className="home-page__main">
        <h1 className="home__question">
          {QUESTION.split(" ").map((word, index) => (
            <Fragment key={index}>
              {index > 0 ? " " : null}
              <span className="pop-word" style={{ "--i": index } as CSSProperties}>
                {word}
              </span>
            </Fragment>
          ))}
        </h1>

        <div className="home__choices">
          {choices.map((choice) => (
            <Link
              key={choice.label}
              to={choice.to}
              className={`choice-pill${pressed === choice.to ? " choice-pill--pressed" : ""}`}
              onClick={(event) => onPress(event, choice.to)}
            >
              {choice.label}
              <ArrowIcon />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default HomePage;

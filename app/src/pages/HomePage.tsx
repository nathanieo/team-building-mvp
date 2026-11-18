import type { ReactElement } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { BrandLogo } from "../components/BrandLogo";
import { usePressNavigate } from "../lib/usePressNavigate";

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
    <div className="auth-layout">
      <main className="home">
        <div className="auth-brand">
          <BrandLogo className="brand-logo" size={44} variant="frosted" />
          Team Building
        </div>

        <h1 className="home__question">Are you a student or a teacher?</h1>

        <div className="home__choices">
          {choices.map((choice) => (
            <Link
              key={choice.label}
              to={choice.to}
              className={`choice-card${pressed === choice.to ? " choice-card--pressed" : ""}`}
              onClick={(event) => onPress(event, choice.to)}
            >
              {choice.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default HomePage;

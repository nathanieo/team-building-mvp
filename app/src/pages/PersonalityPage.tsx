import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ARCHETYPES, computePersonality } from "@team-building-mvp/contracts";
import type { PersonalityResult, QuestionnaireAnswer } from "@team-building-mvp/contracts";
import { AuthLayout } from "../components/AuthLayout";
import {
  BlindSpotList,
  CompatibilityCard,
  IdealTeamSection,
  PersonalityReveal,
  StrengthList,
  TeamRoleSection,
  TraitBreakdown,
  WhyInsights,
} from "../components/PersonalitySections";
import { api, ApiError } from "../lib/api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; answers: Record<string, QuestionnaireAnswer> };

/**
 * A student's personality profile (/student/CODE/personality). It's worked out
 * from their saved Work style answers every time, so nothing extra is stored
 * and the result can be revisited whenever they like.
 */
function PersonalityPage(): ReactElement {
  const navigate = useNavigate();
  const { code = "" } = useParams();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    api
      .getQuestionnaire(code, "work-style")
      .then(({ answers }) => {
        if (!cancelled) setLoad({ status: "ready", answers });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          navigate("/student", { replace: true });
          return;
        }
        setLoad({ status: "error", message: caught instanceof ApiError ? caught.message : "Couldn't load your answers." });
      });
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  const result: PersonalityResult | null = useMemo(
    () => (load.status === "ready" ? computePersonality(load.answers) : null),
    [load],
  );

  if (load.status === "loading") {
    return (
      <div className="page-loading" role="status">
        Working out your profile…
      </div>
    );
  }

  if (load.status === "error" || !result) {
    return (
      <AuthLayout>
        <h1>Something went wrong</h1>
        <div className="alert alert--error" role="alert">
          {load.status === "error" ? load.message : "Couldn't work out your profile."}
        </div>
        <Link to={`/student/${code}`} className="button button--primary button--block">
          Back to my page
        </Link>
      </AuthLayout>
    );
  }

  if (result.status === "incomplete") {
    return (
      <AuthLayout>
        <h1>Almost there</h1>
        <p className="persona-incomplete">
          Your personality profile comes from the Work style questionnaire. You've answered {result.answered} of {result.total}{" "}
          statements so far.
        </p>
        <Link to={`/student/${code}/questionnaire/work-style`} className="button button--primary button--block">
          {result.answered > 0 ? "Continue Work style" : "Start Work style"}
        </Link>
        <Link to={`/student/${code}`} className="button button--ghost button--block">
          Back to my page
        </Link>
      </AuthLayout>
    );
  }

  const archetype = ARCHETYPES[result.primary];

  return (
    <div className="persona-page">
      <header className="persona-bar">
        <Link to={`/student/${code}`} className="quiz-back">
          ← My page
        </Link>
      </header>

      <main className="persona-main">
        <PersonalityReveal primary={result.primary} secondary={result.secondary} match={result.match} intro={result.intro} />

        <p className="persona-note">
          Based on your {result.total} Work style answers. This is a lightweight snapshot of how you like to work, not a diagnosis
          or a fixed label, and every type brings something valuable to a team.
        </p>

        <WhyInsights archetypeName={archetype.name} insights={result.insights} />
        <TraitBreakdown traits={result.traits} />
        <StrengthList strengths={result.strengths} />
        <BlindSpotList blindSpots={result.blindSpots} />
        <TeamRoleSection role={result.team} />

        <section className="persona-section" aria-labelledby="persona-compat">
          <h2 id="persona-compat">Who you work best with</h2>
          <p className="persona-section__lead">
            Complementary work styles, not a promise: anyone can work well together with a little understanding.
          </p>
          <div className="compat-list">
            {result.compatibility.map((match) => (
              <CompatibilityCard key={match.id} match={match} />
            ))}
          </div>
        </section>

        <IdealTeamSection team={result.idealTeam} />

        <footer className="persona-footer">
          <Link to={`/student/${code}`} className="button button--primary">
            Back to my page
          </Link>
          <Link to={`/student/${code}/questionnaire/work-style`} className="link-button persona-footer__review">
            Review my answers
          </Link>
        </footer>
      </main>
    </div>
  );
}

export default PersonalityPage;

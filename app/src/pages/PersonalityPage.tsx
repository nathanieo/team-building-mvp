import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactElement } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { ARCHETYPES, computePersonality } from "@team-building-mvp/contracts";
import type { PersonalityResult, QuestionnaireAnswer } from "@team-building-mvp/contracts";
import { AuthLayout } from "../components/AuthLayout";
import {
  BlindSpotList,
  CompatibilitySection,
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

type CompleteResult = Extract<PersonalityResult, { status: "complete" }>;

/** The profile's pages, in order. Each has its own soft background colour. */
const SLIDES = [
  { id: "you", label: "You", tone: "mint" },
  { id: "why", label: "Why", tone: "sky" },
  { id: "traits", label: "Big 5", tone: "lilac" },
  { id: "strengths", label: "Strengths", tone: "sun" },
  { id: "blind-spots", label: "Blind spots", tone: "peach" },
  { id: "team", label: "In a team", tone: "mint" },
  { id: "matches", label: "Good matches", tone: "pink" },
  { id: "ideal", label: "Ideal team", tone: "sky" },
] as const;

/** How long the old page takes to slide away before the next one comes in. */
const LEAVE_MS = 200;
const SWIPE_PX = 60;

function slideFromParam(value: string | null): number {
  const index = Number(value) - 1;
  return Number.isInteger(index) && index >= 0 && index < SLIDES.length ? index : 0;
}

/**
 * The profile as a short run of pages, like a story: one idea per page with
 * the details a tap away. Next/Back, the arrow keys, swiping and the
 * progress segments all move between pages; ?page= keeps the place.
 */
function ProfileSlides({ code, result }: { code: string; result: CompleteResult }): ReactElement {
  const [params, setParams] = useSearchParams();
  const [index, setIndex] = useState(() => slideFromParam(params.get("page")));
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [direction, setDirection] = useState<"next" | "back">("next");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const last = SLIDES.length - 1;
  const slide = SLIDES[index] ?? SLIDES[0];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // After a page change, start at the top and move focus to the new heading.
  useEffect(() => {
    if (!moved.current) return;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next > last || next === index || phase === "out") return;
      setDirection(next > index ? "next" : "back");
      const show = (): void => {
        moved.current = true;
        setIndex(next);
        setPhase("in");
        setParams(next === 0 ? {} : { page: String(next + 1) }, { replace: true });
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        show();
        return;
      }
      setPhase("out");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(show, LEAVE_MS);
    },
    [index, last, phase, setParams],
  );

  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo, index]);

  function handlePointerDown(event: PointerEvent<HTMLElement>): void {
    swipe.current = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>): void {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dy) > Math.abs(dx)) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  }

  const archetype = ARCHETYPES[result.primary];
  const ref = headingRef;
  const pages: Record<(typeof SLIDES)[number]["id"], ReactElement> = {
    you: <PersonalityReveal primary={result.primary} secondary={result.secondary} match={result.match} intro={result.intro} headingRef={ref} />,
    why: <WhyInsights archetypeName={archetype.name} insights={result.insights} headingRef={ref} />,
    traits: <TraitBreakdown traits={result.traits} total={result.total} headingRef={ref} />,
    strengths: <StrengthList strengths={result.strengths} headingRef={ref} />,
    "blind-spots": <BlindSpotList blindSpots={result.blindSpots} headingRef={ref} />,
    team: <TeamRoleSection role={result.team} headingRef={ref} />,
    matches: <CompatibilitySection matches={result.compatibility} headingRef={ref} />,
    ideal: <IdealTeamSection team={result.idealTeam} headingRef={ref} />,
  };

  return (
    <div className="persona-page" data-tone={slide.tone}>
      <header className="persona-bar">
        <Link to={`/student/${code}`} className="quiz-back">
          ← My page
        </Link>
        <span className="persona-bar__count">
          {index + 1} of {SLIDES.length}
        </span>
      </header>

      <nav className="persona-steps" aria-label="Profile pages">
        {SLIDES.map((item, position) => (
          <button
            key={item.id}
            type="button"
            className={`persona-steps__segment${position <= index ? " persona-steps__segment--done" : ""}`}
            aria-label={`Page ${position + 1}: ${item.label}`}
            aria-current={position === index ? "step" : undefined}
            onClick={() => goTo(position)}
          />
        ))}
      </nav>

      <main className="persona-main" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <section
          key={slide.id}
          className={`persona-slide persona-slide--${phase} persona-slide--${direction}`}
          aria-label={`${slide.label}, page ${index + 1} of ${SLIDES.length}`}
        >
          {pages[slide.id]}
        </section>
      </main>

      <footer className="persona-nav">
        {index > 0 ? (
          <button type="button" className="button button--ghost persona-nav__back" onClick={() => goTo(index - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        {index < last ? (
          <button type="button" className="button button--primary persona-nav__next" onClick={() => goTo(index + 1)}>
            {index === 0 ? "See why" : `Next: ${SLIDES[index + 1]?.label ?? ""}`}
          </button>
        ) : (
          <div className="persona-nav__end">
            <Link to={`/student/${code}/questionnaire/work-style`} className="link-button">
              Review answers
            </Link>
            <Link to={`/student/${code}`} className="button button--primary">
              Done
            </Link>
          </div>
        )}
      </footer>
    </div>
  );
}

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

  return <ProfileSlides code={code} result={result} />;
}

export default PersonalityPage;

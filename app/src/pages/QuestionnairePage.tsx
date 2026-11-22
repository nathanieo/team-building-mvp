import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { firstUnanswered, isValidAnswer } from "@team-building-mvp/contracts";
import type {
  QuestionnaireAnswer,
  QuestionnaireId,
  QuestionnaireResponse,
  RankQuestion,
  ScaleQuestion,
} from "@team-building-mvp/contracts";
import { AuthLayout } from "../components/AuthLayout";
import { Mascot } from "../components/Mascot";
import { api, ApiError } from "../lib/api";
import { DONE_VISUAL, visualFor } from "../lib/questionVisuals";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: QuestionnaireResponse };

const OTHER: Record<QuestionnaireId, { id: QuestionnaireId; title: string }> = {
  "work-style": { id: "skills", title: "Skills and project interests" },
  skills: { id: "work-style", title: "Work style" },
};

/** Pause after picking an answer so the choice registers before the next question slides in. */
const ADVANCE_MS = 260;

function ScaleOptions({
  question,
  value,
  disabled,
  onChoose,
}: {
  question: ScaleQuestion;
  value: number | undefined;
  disabled: boolean;
  onChoose: (answer: number) => void;
}): ReactElement {
  return (
    <div className="quiz-options" role="radiogroup" aria-labelledby="quiz-prompt">
      {question.labels.map((label, index) => {
        const answer = index + 1;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={value === answer}
            aria-keyshortcuts={String(answer)}
            className={`quiz-option${value === answer ? " quiz-option--chosen" : ""}`}
            disabled={disabled}
            data-autofocus={index === 0 ? "" : undefined}
            onClick={() => onChoose(answer)}
          >
            <span className="quiz-option__key" aria-hidden="true">
              {answer}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function RankOptions({
  question,
  saved,
  disabled,
  isLast,
  onSave,
}: {
  question: RankQuestion;
  saved: string[] | undefined;
  disabled: boolean;
  isLast: boolean;
  onSave: (answer: string[]) => void;
}): ReactElement {
  const [picked, setPicked] = useState<string[]>(saved ?? []);

  function toggle(id: string): void {
    setPicked((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < question.pick ? [...current, id] : current,
    );
  }

  return (
    <>
      <p className="quiz-hint">
        Tap your top {question.pick} in order. {picked.length} of {question.pick} picked.
      </p>
      <div className="quiz-options" role="group" aria-labelledby="quiz-prompt">
        {question.options.map((option) => {
          const rank = picked.indexOf(option.id) + 1;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={rank > 0}
              className={`quiz-option${rank > 0 ? " quiz-option--chosen" : ""}`}
              disabled={disabled}
              onClick={() => toggle(option.id)}
            >
              <span className="quiz-option__key" aria-hidden="true">
                {rank > 0 ? rank : ""}
              </span>
              {option.label}
              {rank > 0 ? <span className="visually-hidden">, choice {rank}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="quiz-rank-actions">
        <button type="button" className="link-button" disabled={picked.length === 0 || disabled} onClick={() => setPicked([])}>
          Clear
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={picked.length !== question.pick || disabled}
          onClick={() => onSave(picked)}
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </>
  );
}

/**
 * One questionnaire, one question per screen (/student/CODE/questionnaire/ID).
 * Every answer is saved as it's picked, so students can leave and pick up
 * where they stopped.
 */
function QuestionnairePage(): ReactElement {
  const navigate = useNavigate();
  const params = useParams();
  const code = params.code ?? "";
  const id: QuestionnaireId = params.id === "skills" ? "skills" : "work-style";

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswer>>({});
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [otherUnfinished, setOtherUnfinished] = useState(false);
  /** Sprout's neutral hop after any answer (the same whatever was picked), and its tap wiggle. */
  const [reacting, setReacting] = useState(false);
  const [poked, setPoked] = useState(false);
  const reactTimer = useRef<number | undefined>(undefined);
  const pokeTimer = useRef<number | undefined>(undefined);
  const cardRef = useRef<HTMLElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);

  const handleError = useCallback(
    (caught: unknown, fallback: string): string | null => {
      if (caught instanceof ApiError && caught.status === 401) {
        navigate("/student", { replace: true });
        return null;
      }
      return caught instanceof ApiError ? caught.message : fallback;
    },
    [navigate],
  );

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: "loading" });
    api
      .getQuestionnaire(code, id)
      .then((data) => {
        if (cancelled) return;
        setAnswers(data.answers);
        setIndex(firstUnanswered(data.questionnaire, data.answers));
        setLoad({ status: "ready", data });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const message = handleError(caught, "Couldn't open the questionnaire.");
        if (message) setLoad({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [code, id, handleError]);

  useEffect(
    () => () => {
      window.clearTimeout(advanceTimer.current);
      window.clearTimeout(reactTimer.current);
      window.clearTimeout(pokeTimer.current);
    },
    [],
  );

  function poke(): void {
    setPoked(true);
    window.clearTimeout(pokeTimer.current);
    pokeTimer.current = window.setTimeout(() => setPoked(false), 600);
  }

  const questionnaire = load.status === "ready" ? load.data.questionnaire : null;
  const total = questionnaire?.questions.length ?? 0;
  const done = questionnaire !== null && index >= total;
  const question = questionnaire && !done ? questionnaire.questions[index] : undefined;

  // Each new question puts focus on its first answer, for keyboard users. On the finish
  // screen it re-runs once we know whether "Next: …" is shown, so focus lands on that.
  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
  }, [index, load.status, otherUnfinished]);

  // On the finish screen, check whether the other questionnaire still needs doing.
  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    api
      .studentHome()
      .then(({ classes }) => {
        const view = classes.find((item) => item.code === code);
        const other = view?.questionnaires.find((item) => item.id === OTHER[id].id);
        if (!cancelled) setOtherUnfinished(Boolean(other && other.answered < other.total));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [done, code, id]);

  const save = useCallback(
    async (answer: QuestionnaireAnswer): Promise<void> => {
      if (!question || saving) return;
      setAnswers((current) => ({ ...current, [question.id]: answer }));
      setReacting(true);
      window.clearTimeout(reactTimer.current);
      reactTimer.current = window.setTimeout(() => setReacting(false), 420);
      setSaving(true);
      setSaveError(null);
      try {
        await api.saveAnswer(code, id, question.id, { answer });
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        advanceTimer.current = window.setTimeout(() => setIndex((current) => current + 1), reduceMotion ? 0 : ADVANCE_MS);
      } catch (caught) {
        const message = handleError(caught, "Couldn't save that answer.");
        if (message) setSaveError(`${message} Pick it again to retry.`);
      } finally {
        setSaving(false);
      }
    },
    [question, saving, code, id, handleError],
  );

  // Keys: 1–5 answer a rating question, ← goes back, → moves on if already answered.
  useEffect(() => {
    if (!question) return undefined;
    function handleKey(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey || !question) return;
      if (question.kind === "scale" && /^[1-5]$/.test(event.key)) {
        event.preventDefault();
        void save(Number(event.key));
      } else if (event.key === "ArrowLeft" && index > 0) {
        setIndex(index - 1);
      } else if (event.key === "ArrowRight" && isValidAnswer(question, answers[question.id])) {
        setIndex(index + 1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [question, index, answers, save]);

  if (load.status === "loading") {
    return (
      <div className="page-loading" role="status">
        Loading…
      </div>
    );
  }

  if (load.status === "error" || !questionnaire) {
    return (
      <AuthLayout>
        <h1>Something went wrong</h1>
        <div className="alert alert--error" role="alert">
          {load.status === "error" ? load.message : "Couldn't open the questionnaire."}
        </div>
        <Link to={`/student/${code}`} className="button button--primary button--block">
          Back to my page
        </Link>
      </AuthLayout>
    );
  }

  const visual = question ? visualFor(question.id) : DONE_VISUAL;
  // The bar follows where the student is (moving with every question, back or forward)
  // and is full on the finish screen.
  const percent = done ? 100 : Math.round((index / Math.max(1, total)) * 100);
  const currentAnswer = question ? answers[question.id] : undefined;

  return (
    <div className="quiz-page" data-topic={visual.topic}>
      <header className="quiz-bar">
        <Link to={`/student/${code}`} className="quiz-back">
          ← My page
        </Link>
        <span className="quiz-bar__title">{questionnaire.title}</span>
        <span className="quiz-bar__count">{done ? "Done" : `${index + 1} of ${total}`}</span>
      </header>
      <div
        className="quiz-progress"
        role="progressbar"
        aria-label={`${questionnaire.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="quiz-progress__fill" style={{ width: `${percent}%` }} />
      </div>

      <main className="quiz-main">
        {/* Decorative: Sprout acts out each question. Tapping it makes it wiggle. */}
        <div className={`quiz-stage${poked ? " quiz-stage--poked" : ""}`} onClick={poke} aria-hidden="true">
          <Mascot key={question?.id ?? "done"} scene={visual} reacting={reacting} />
        </div>

        {done ? (
          <section className="quiz-card quiz-card--done" ref={cardRef} key="done">
            <span className="stage-card__check" aria-hidden="true">
              ✓
            </span>
            <h1>{questionnaire.title} done</h1>
            <p className="quiz-done__lead">Thanks! Your answers are saved.</p>
            <div className="quiz-done__actions">
              {otherUnfinished ? (
                <Link
                  to={`/student/${code}/questionnaire/${OTHER[id].id}`}
                  className="button button--primary button--block"
                  data-autofocus=""
                >
                  Next: {OTHER[id].title}
                </Link>
              ) : null}
              <Link
                to={`/student/${code}`}
                className={`button button--block ${otherUnfinished ? "button--ghost" : "button--primary"}`}
                data-autofocus={otherUnfinished ? undefined : ""}
              >
                Back to my page
              </Link>
              <button type="button" className="link-button quiz-done__review" onClick={() => setIndex(0)}>
                Review my answers
              </button>
            </div>
          </section>
        ) : question ? (
          <section className="quiz-card" ref={cardRef} key={question.id} aria-live="polite">
            <p className="quiz-lead">{question.lead}</p>
            <h1 id="quiz-prompt" className="quiz-prompt">
              {question.prompt}
            </h1>

            {question.kind === "scale" ? (
              <ScaleOptions
                question={question}
                value={typeof currentAnswer === "number" ? currentAnswer : undefined}
                disabled={saving}
                onChoose={(answer) => void save(answer)}
              />
            ) : (
              <RankOptions
                question={question}
                saved={Array.isArray(currentAnswer) ? currentAnswer : undefined}
                disabled={saving}
                isLast={index === total - 1}
                onSave={(answer) => void save(answer)}
              />
            )}

            {saveError ? (
              <p className="field__error" role="alert">
                {saveError}
              </p>
            ) : null}

            <nav className="quiz-nav" aria-label="Questions">
              <button type="button" className="quiz-nav__button" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                ← Back
              </button>
              {question.kind === "scale" && isValidAnswer(question, currentAnswer) ? (
                <button type="button" className="quiz-nav__button" onClick={() => setIndex(index + 1)}>
                  Next →
                </button>
              ) : null}
            </nav>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default QuestionnairePage;

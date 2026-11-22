import type { QuestionnaireId } from "./student.js";

/** A statement or skill the student rates on a five-point scale. */
export interface ScaleQuestion {
  id: string;
  kind: "scale";
  /** Short line above the prompt, e.g. "How well does this describe you?" */
  lead: string;
  prompt: string;
  /** Five labels, lowest to highest; the answer is 1–5. */
  labels: readonly string[];
}

/** The student picks their top choices in order; the answer is the chosen option ids. */
export interface RankQuestion {
  id: string;
  kind: "rank";
  lead: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  /** How many to pick (fewer if there aren't that many options). */
  pick: number;
}

export type Question = ScaleQuestion | RankQuestion;
export type QuestionnaireAnswer = number | string[];

export interface Questionnaire {
  id: QuestionnaireId;
  title: string;
  minutes: number;
  questions: Question[];
}

/** A questionnaire plus what this student has answered so far, keyed by question id. */
export interface QuestionnaireResponse {
  questionnaire: Questionnaire;
  answers: Record<string, QuestionnaireAnswer>;
}

export interface SaveAnswerRequest {
  answer: QuestionnaireAnswer;
}

export interface SaveAnswerResponse {
  answered: number;
  total: number;
}

export const AGREEMENT_LABELS = [
  "Very inaccurate",
  "Moderately inaccurate",
  "Neither",
  "Moderately accurate",
  "Very accurate",
] as const;

export const SKILL_LABELS = ["None yet", "Beginner", "Comfortable", "Strong", "Expert"] as const;

export type BigFiveTrait = "extraversion" | "agreeableness" | "conscientiousness" | "neuroticism" | "intellect";

/**
 * 30 public-domain IPIP items, six per Big Five trait: the 20-item Mini-IPIP
 * (Donnellan et al., 2006) plus ten more IPIP Big Five markers. `reverse`
 * items are scored 6 − answer when traits are worked out.
 */
export const WORK_STYLE_ITEMS: ReadonlyArray<{ id: string; text: string; trait: BigFiveTrait; reverse: boolean }> = [
  { id: "ws-01", text: "I am the life of the party.", trait: "extraversion", reverse: false },
  { id: "ws-02", text: "I sympathize with others' feelings.", trait: "agreeableness", reverse: false },
  { id: "ws-03", text: "I get chores done right away.", trait: "conscientiousness", reverse: false },
  { id: "ws-04", text: "I have frequent mood swings.", trait: "neuroticism", reverse: false },
  { id: "ws-05", text: "I have a vivid imagination.", trait: "intellect", reverse: false },
  { id: "ws-06", text: "I don't talk a lot.", trait: "extraversion", reverse: true },
  { id: "ws-07", text: "I am not interested in other people's problems.", trait: "agreeableness", reverse: true },
  { id: "ws-08", text: "I often forget to put things back in their proper place.", trait: "conscientiousness", reverse: true },
  { id: "ws-09", text: "I am relaxed most of the time.", trait: "neuroticism", reverse: true },
  { id: "ws-10", text: "I am not interested in abstract ideas.", trait: "intellect", reverse: true },
  { id: "ws-11", text: "I talk to a lot of different people at parties.", trait: "extraversion", reverse: false },
  { id: "ws-12", text: "I feel others' emotions.", trait: "agreeableness", reverse: false },
  { id: "ws-13", text: "I like order.", trait: "conscientiousness", reverse: false },
  { id: "ws-14", text: "I get upset easily.", trait: "neuroticism", reverse: false },
  { id: "ws-15", text: "I have difficulty understanding abstract ideas.", trait: "intellect", reverse: true },
  { id: "ws-16", text: "I keep in the background.", trait: "extraversion", reverse: true },
  { id: "ws-17", text: "I am not really interested in others.", trait: "agreeableness", reverse: true },
  { id: "ws-18", text: "I make a mess of things.", trait: "conscientiousness", reverse: true },
  { id: "ws-19", text: "I seldom feel blue.", trait: "neuroticism", reverse: true },
  { id: "ws-20", text: "I do not have a good imagination.", trait: "intellect", reverse: true },
  // Ten more public-domain IPIP Big Five markers, two per trait, for six statements per trait.
  { id: "ws-21", text: "I start conversations.", trait: "extraversion", reverse: false },
  { id: "ws-22", text: "I make people feel at ease.", trait: "agreeableness", reverse: false },
  { id: "ws-23", text: "I am always prepared.", trait: "conscientiousness", reverse: false },
  { id: "ws-24", text: "I get stressed out easily.", trait: "neuroticism", reverse: false },
  { id: "ws-25", text: "I am full of ideas.", trait: "intellect", reverse: false },
  { id: "ws-26", text: "I don't like to draw attention to myself.", trait: "extraversion", reverse: true },
  { id: "ws-27", text: "I take time out for others.", trait: "agreeableness", reverse: false },
  { id: "ws-28", text: "I leave my belongings around.", trait: "conscientiousness", reverse: true },
  { id: "ws-29", text: "I worry about things.", trait: "neuroticism", reverse: false },
  { id: "ws-30", text: "I spend time reflecting on things.", trait: "intellect", reverse: false },
];

/** Skills students rate themselves on, used to spread skills across teams. */
export const SKILL_ITEMS: ReadonlyArray<{ id: string; text: string }> = [
  { id: "sk-frontend", text: "Front-end development (web pages and interfaces)" },
  { id: "sk-backend", text: "Back-end development (servers and APIs)" },
  { id: "sk-data", text: "Data and databases" },
  { id: "sk-design", text: "UX and visual design" },
  { id: "sk-writing", text: "Writing and documentation" },
  { id: "sk-planning", text: "Planning and project management" },
  { id: "sk-testing", text: "Testing and quality checks" },
  { id: "sk-presenting", text: "Presenting and public speaking" },
  { id: "sk-research", text: "Research and problem solving" },
];

export const PROJECT_RANK_QUESTION_ID = "sk-projects";

export function buildWorkStyleQuestionnaire(): Questionnaire {
  return {
    id: "work-style",
    title: "Work style",
    minutes: 12,
    questions: WORK_STYLE_ITEMS.map((item) => ({
      id: item.id,
      kind: "scale",
      lead: "How well does this describe you?",
      prompt: item.text,
      labels: AGREEMENT_LABELS,
    })),
  };
}

/** Skill ratings, then (if the class has projects) ranking the top three. */
export function buildSkillsQuestionnaire(projects: Array<{ id: string; label: string }>): Questionnaire {
  const questions: Question[] = SKILL_ITEMS.map((item) => ({
    id: item.id,
    kind: "scale",
    lead: "How confident are you with…",
    prompt: item.text,
    labels: SKILL_LABELS,
  }));
  if (projects.length > 0) {
    questions.push({
      id: PROJECT_RANK_QUESTION_ID,
      kind: "rank",
      lead: "Last one",
      prompt: "Which projects would you most like to work on?",
      options: projects,
      pick: Math.min(3, projects.length),
    });
  }
  return { id: "skills", title: "Skills and project interests", minutes: 5, questions };
}

/** True when the answer fits the question: 1–5 for a scale, the right number of distinct options for a rank. */
export function isValidAnswer(question: Question, answer: unknown): answer is QuestionnaireAnswer {
  if (question.kind === "scale") {
    return typeof answer === "number" && Number.isInteger(answer) && answer >= 1 && answer <= question.labels.length;
  }
  if (!Array.isArray(answer) || answer.length !== question.pick) return false;
  const ids = new Set(question.options.map((option) => option.id));
  return new Set(answer).size === answer.length && answer.every((id) => typeof id === "string" && ids.has(id));
}

export function countAnswered(questionnaire: Questionnaire, answers: Record<string, QuestionnaireAnswer>): number {
  return questionnaire.questions.filter((question) => isValidAnswer(question, answers[question.id])).length;
}

/** Where to resume: the first unanswered question, or the end when all are done. */
export function firstUnanswered(questionnaire: Questionnaire, answers: Record<string, QuestionnaireAnswer>): number {
  const index = questionnaire.questions.findIndex((question) => !isValidAnswer(question, answers[question.id]));
  return index === -1 ? questionnaire.questions.length : index;
}

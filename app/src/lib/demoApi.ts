/**
 * Development-only stand-in for the API, used in demo mode (see demoFlag.ts).
 * It answers the same paths with sample data kept in memory, so everything
 * resets on reload. It is only ever loaded through a dynamic import guarded by
 * `import.meta.env.DEV`, so production builds don't include it.
 */
import {
  buildSkillsQuestionnaire,
  buildWorkStyleQuestionnaire,
  countAnswered,
  isValidAnswer,
  JOIN_CODE_ALPHABET,
  COHORT_LIMITS,
  normalizeJoinCode,
  validateCreateCohortRequest,
  validateStudentJoinRequest,
  validateStudentLoginRequest,
  WORK_STYLE_ITEMS,
} from "@team-building-mvp/contracts";
import type {
  BigFiveTrait,
  ClassStudent,
  CohortSummary,
  Facilitator,
  Questionnaire,
  QuestionnaireAnswer,
  QuestionnaireId,
  StudentHomeResponse,
  StudentStage,
  StudentTeam,
} from "@team-building-mvp/contracts";

const DAY_MS = 86_400_000;

const facilitator: Facilitator = {
  id: "demo-facilitator",
  email: "demo.teacher@example.edu",
  username: "demo.teacher",
  displayName: "Demo Teacher",
};

function student(
  email: string,
  displayName: string | null,
  studentId: string | null,
  joined: boolean,
  finished = false,
): ClassStudent {
  return { email, displayName, studentId, joined, finished };
}

interface DemoClass {
  summary: Omit<CohortSummary, "studentCount" | "completedCount">;
  students: ClassStudent[];
  /** Projects students rank in the skills questionnaire. */
  projects: Array<{ id: string; label: string }>;
}

const classes: DemoClass[] = [
  {
    summary: {
      id: "demo-cs665",
      name: "CS 665 Senior Design",
      term: "Spring 2027",
      joinCode: "BD8VEF",
      teamSize: 4,
      teamSizeMax: 4,
      status: "collecting",
      projectCount: 3,
      teamCount: 0,
      createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
    },
    students: [
      student("ana.lopez@school.edu", "Ana Lopez", "W10234561", true, true),
      student("ben.kim@school.edu", "Ben Kim", "W10234588", true, true),
      student("chloe.nguyen@school.edu", "Chloe Nguyen", "W10234612", true),
      student("diego.ramos@school.edu", "Diego Ramos", "W10234647", true, true),
      student("ella.park@school.edu", "Ella Park", "W10234690", true),
      student("fatima.ali@school.edu", null, null, false),
      student("george.chen@school.edu", null, null, false),
      student("hana.sato@school.edu", null, null, false),
    ],
    projects: [
      { id: "proj-nav", label: "Campus navigation app" },
      { id: "proj-food", label: "Food bank inventory tracker" },
      { id: "proj-study", label: "Study group matcher" },
    ],
  },
  {
    summary: {
      id: "demo-engr101",
      name: "ENGR 101 Design Studio",
      term: null,
      joinCode: "W3HQZN",
      teamSize: 3,
      teamSizeMax: 3,
      status: "collecting",
      projectCount: 0,
      teamCount: 0,
      createdAt: new Date().toISOString(),
    },
    // Ana is in both sample classes, so the student page's class switcher has something to switch.
    students: [student("ana.lopez@school.edu", "Ana Lopez", "W10234561", true)],
    projects: [],
  },
];

let signedIn = true;

// ----- Student side -----

/** Saved answers per student, class and questionnaire (key "CODE|email|questionnaire"). */
const answerStore = new Map<string, Record<string, QuestionnaireAnswer>>();
/** Classes (by join code) whose teams the demo shows as locked. */
const lockedTeams = new Set<string>();
/** Email of the student signed in on the student side, if any. */
let studentEmail: string | null = null;

function questionnaireFor(item: DemoClass, id: QuestionnaireId): Questionnaire {
  return id === "work-style" ? buildWorkStyleQuestionnaire() : buildSkillsQuestionnaire(item.projects);
}

/**
 * Each sample student's Work style leaning, as trait levels from 1 (low) to 5 (high),
 * so the demo shows a range of personality profiles. Anyone else gets a gentle middle.
 */
const SAMPLE_TRAIT_LEVELS: Record<string, Record<BigFiveTrait, number>> = {
  "ana.lopez@school.edu": { intellect: 2, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 1 },
  "ben.kim@school.edu": { intellect: 4, conscientiousness: 2, extraversion: 5, agreeableness: 4, neuroticism: 2 },
  "chloe.nguyen@school.edu": { intellect: 5, conscientiousness: 2, extraversion: 4, agreeableness: 3, neuroticism: 3 },
  "diego.ramos@school.edu": { intellect: 2, conscientiousness: 4, extraversion: 4, agreeableness: 3, neuroticism: 1 },
  "ella.park@school.edu": { intellect: 3, conscientiousness: 3, extraversion: 4, agreeableness: 5, neuroticism: 3 },
};
const DEFAULT_LEVELS: Record<BigFiveTrait, number> = { intellect: 3, conscientiousness: 4, extraversion: 3, agreeableness: 4, neuroticism: 2 };

/** Made-up answers for the first `count` questions, for sample students. */
function sampleAnswers(questionnaire: Questionnaire, count: number, email = ""): Record<string, QuestionnaireAnswer> {
  const levels = SAMPLE_TRAIT_LEVELS[email] ?? DEFAULT_LEVELS;
  const answers: Record<string, QuestionnaireAnswer> = {};
  questionnaire.questions.slice(0, count).forEach((question, index) => {
    if (question.kind === "rank") {
      answers[question.id] = question.options.slice(0, question.pick).map((option) => option.id);
      return;
    }
    const item = WORK_STYLE_ITEMS.find((entry) => entry.id === question.id);
    if (!item) {
      answers[question.id] = (index % 5) + 1;
      return;
    }
    // Vary one statement per trait a little, so it reads like a real person rather than a pattern.
    const nudge = index % 4 === 2 ? -1 : 0;
    const level = Math.min(5, Math.max(1, levels[item.trait] + nudge));
    answers[question.id] = item.reverse ? 6 - level : level;
  });
  return answers;
}

/** A student's answers, seeding sample students the first time: finished ones fully, others partway. */
function answersFor(item: DemoClass, me: ClassStudent, id: QuestionnaireId): Record<string, QuestionnaireAnswer> {
  const key = `${item.summary.joinCode}|${me.email}|${id}`;
  let answers = answerStore.get(key);
  if (!answers) {
    const questionnaire = questionnaireFor(item, id);
    const count = me.finished ? questionnaire.questions.length : id === "work-style" ? 12 : 0;
    answers = sampleAnswers(questionnaire, count, me.email);
    answerStore.set(key, answers);
  }
  return answers;
}

function setAnswersFor(item: DemoClass, me: ClassStudent, id: QuestionnaireId, answers: Record<string, QuestionnaireAnswer>): void {
  answerStore.set(`${item.summary.joinCode}|${me.email}|${id}`, answers);
}

/** True once both questionnaires are complete; keeps the teacher's "finished" count in step. */
function updateFinished(item: DemoClass, me: ClassStudent): void {
  me.finished = (["work-style", "skills"] as const).every((id) => {
    const questionnaire = questionnaireFor(item, id);
    return countAnswered(questionnaire, answersFor(item, me, id)) === questionnaire.questions.length;
  });
}

/** A made-up locked team built from the student and three classmates who joined. */
function demoTeam(item: DemoClass, me: ClassStudent): StudentTeam {
  const mates = item.students.filter((entry) => entry.joined && entry.email !== me.email).slice(0, 3);
  return {
    name: "Team Lumen",
    project: "Campus navigation app",
    members: [me, ...mates].map((entry) => ({
      displayName: entry.displayName ?? entry.email,
      email: entry.email,
      isYou: entry.email === me.email,
    })),
    reasons: [
      "Together you cover front-end, back-end and data work.",
      "It mixes people who like to plan ahead with people who like to start fast.",
      "Everyone ranked this project in their top three.",
    ],
  };
}

function studentHome(email: string): StudentHomeResponse | null {
  const mine = classes
    .map((item) => ({ item, me: item.students.find((entry) => entry.joined && entry.email === email) }))
    .filter((entry): entry is { item: DemoClass; me: ClassStudent } => Boolean(entry.me));
  const first = mine[0]?.me;
  if (!first) return null;
  return {
    student: { displayName: first.displayName ?? email, email, studentId: first.studentId ?? "" },
    classes: mine.map(({ item, me }) => {
      return {
        code: item.summary.joinCode,
        name: item.summary.name,
        term: item.summary.term,
        questionnaires: (["work-style", "skills"] as const).map((id) => {
          const questionnaire = questionnaireFor(item, id);
          return {
            id,
            title: questionnaire.title,
            minutes: questionnaire.minutes,
            answered: countAnswered(questionnaire, answersFor(item, me, id)),
            total: questionnaire.questions.length,
          };
        }),
        team: lockedTeams.has(item.summary.joinCode) ? demoTeam(item, me) : null,
      };
    }),
  };
}

/** Demo stage switcher: puts the signed-in student's class at the given stage. */
export function setDemoStudentStage(code: string, stage: StudentStage): void {
  const item = classes.find((entry) => entry.summary.joinCode === code);
  const me = item?.students.find((entry) => entry.email === studentEmail);
  if (!item || !me) return;
  const done = stage !== "questionnaires";
  for (const id of ["work-style", "skills"] as const) {
    const questionnaire = questionnaireFor(item, id);
    const count = done ? questionnaire.questions.length : id === "work-style" ? 12 : 0;
    setAnswersFor(item, me, id, sampleAnswers(questionnaire, count, me.email));
  }
  me.finished = done;
  if (stage === "team") lockedTeams.add(code);
  else lockedTeams.delete(code);
}

export interface DemoResponse {
  status: number;
  body: unknown;
}

function toSummary(item: DemoClass): CohortSummary {
  const joined = item.students.filter((entry) => entry.joined);
  return {
    ...item.summary,
    studentCount: joined.length,
    completedCount: joined.filter((entry) => entry.finished).length,
  };
}

function newJoinCode(): string {
  let code = "";
  for (let index = 0; index < COHORT_LIMITS.joinCodeLength; index += 1) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

const ok = (body: unknown, status = 200): DemoResponse => ({ status, body });
const fail = (status: number, error: string, fieldErrors?: Record<string, string>): DemoResponse => ({
  status,
  body: fieldErrors ? { error, fieldErrors } : { error },
});

function readBody(init: RequestInit): Record<string, unknown> {
  try {
    return typeof init.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Answers one API call (path without the /api prefix) from the sample data. */
export async function demoRespond(path: string, init: RequestInit = {}): Promise<DemoResponse> {
  // A short pause so loading states show up like they would with a real server.
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  const method = (init.method ?? "GET").toUpperCase();
  const [pathname = ""] = path.split("?");

  if (pathname === "/auth/me") return signedIn ? ok({ facilitator }) : fail(401, "Log in to continue.");
  if (pathname === "/auth/login" || pathname === "/auth/register") {
    signedIn = true;
    return ok({ facilitator }, pathname === "/auth/register" ? 201 : 200);
  }
  if (pathname === "/auth/logout") {
    signedIn = false;
    return ok(null, 204);
  }
  // The student side has its own sign-in, separate from the teacher's.
  if (pathname === "/student/me") {
    const home = studentEmail ? studentHome(studentEmail) : null;
    return home ? ok(home) : fail(401, "Enter your class code and student email.");
  }
  if (pathname === "/student/login" && method === "POST") {
    const check = validateStudentLoginRequest(readBody(init));
    if (!check.ok) return fail(400, "Check the highlighted fields.", check.errors as Record<string, string>);
    const home = studentHome(check.value.email);
    if (!home) {
      return fail(400, "Check the highlighted fields.", {
        email: "We couldn't find a student with that email. Join your class first.",
      });
    }
    studentEmail = check.value.email;
    return ok(home);
  }
  if (pathname === "/student/logout") {
    studentEmail = null;
    return ok(null, 204);
  }

  const questionnaireMatch = pathname.match(/^\/student\/classes\/([^/]+)\/questionnaires\/([^/]+)(?:\/answers\/([^/]+))?$/);
  if (questionnaireMatch) {
    const [, rawCode = "", rawId = "", rawQuestion] = questionnaireMatch;
    const item = classes.find((entry) => entry.summary.joinCode === decodeURIComponent(rawCode));
    const me = item?.students.find((entry) => entry.joined && entry.email === studentEmail);
    if (!studentEmail) return fail(401, "Enter your student email.");
    const id = decodeURIComponent(rawId);
    if (!item || !me || (id !== "work-style" && id !== "skills")) return fail(404, "That questionnaire doesn't exist.");
    const questionnaire = questionnaireFor(item, id);
    const answers = answersFor(item, me, id);
    if (!rawQuestion && method === "GET") return ok({ questionnaire, answers });
    if (rawQuestion && method === "PUT") {
      const question = questionnaire.questions.find((entry) => entry.id === decodeURIComponent(rawQuestion));
      const answer = readBody(init).answer;
      if (!question || !isValidAnswer(question, answer)) return fail(400, "That answer doesn't fit the question.");
      setAnswersFor(item, me, id, { ...answers, [question.id]: answer });
      updateFinished(item, me);
      return ok({ answered: countAnswered(questionnaire, answersFor(item, me, id)), total: questionnaire.questions.length });
    }
  }

  // Student sign-up doesn't need a teacher login.
  const joinMatch = pathname.match(/^\/join\/([^/]+)$/);
  if (joinMatch) {
    const code = normalizeJoinCode(decodeURIComponent(joinMatch[1] ?? ""));
    const item = classes.find((entry) => entry.summary.joinCode === code);
    if (!item) return fail(404, "We couldn't find a class with that code.");
    if (method === "GET") return ok({ cohort: { name: item.summary.name, term: item.summary.term } });
    if (method === "POST") {
      const check = validateStudentJoinRequest(readBody(init));
      if (!check.ok) return fail(400, "Check the highlighted fields.", check.errors as Record<string, string>);
      const { displayName, studentId, email } = check.value;
      const existing = item.students.find((entry) => entry.email === email);
      if (existing?.joined) {
        return fail(400, "Check the highlighted fields.", { email: "You've already joined this class with this email." });
      }
      if (item.students.some((entry) => entry.joined && entry.studentId === studentId)) {
        return fail(400, "Check the highlighted fields.", { studentId: "That student ID has already joined this class." });
      }
      // Someone on the teacher's class list is marked joined; anyone else is added.
      if (existing) Object.assign(existing, { displayName, studentId, joined: true });
      else item.students.push(student(email, displayName, studentId, true));
      studentEmail = email;
      const joinedEntry = item.students.find((entry) => entry.email === email);
      if (joinedEntry) {
        setAnswersFor(item, joinedEntry, "work-style", {});
        setAnswersFor(item, joinedEntry, "skills", {});
      }
      return ok({ student: { displayName, email } }, 201);
    }
  }

  if (!signedIn) return fail(401, "Log in to continue.");

  if (pathname === "/cohorts" && method === "GET") return ok({ cohorts: classes.map(toSummary) });
  if (pathname === "/cohorts" && method === "POST") {
    const validation = validateCreateCohortRequest(readBody(init));
    if (!validation.ok) return fail(400, "Check the highlighted fields.", validation.errors as Record<string, string>);
    const created: DemoClass = {
      summary: {
        id: `demo-${Date.now()}`,
        ...validation.value,
        joinCode: newJoinCode(),
        status: "collecting",
        projectCount: 0,
        teamCount: 0,
        createdAt: new Date().toISOString(),
      },
      students: [],
      projects: [],
    };
    classes.unshift(created);
    return ok({ cohort: toSummary(created) }, 201);
  }

  const match = pathname.match(/^\/cohorts\/([^/]+)(?:\/(students|class-list)(?:\/([^/]+))?)?$/);
  const item = match ? classes.find((entry) => entry.summary.id === decodeURIComponent(match[1] ?? "")) : undefined;
  if (!match || !item) return fail(404, "That class doesn't exist.");
  const [, , section, email] = match;

  if (!section && method === "GET") return ok({ cohort: toSummary(item) });
  if (section === "students" && !email && method === "GET") return ok({ students: item.students });
  if (section === "class-list" && method === "POST") {
    const emails = readBody(init).emails;
    for (const entry of Array.isArray(emails) ? emails : []) {
      if (typeof entry === "string" && !item.students.some((existing) => existing.email === entry)) {
        item.students.push(student(entry, null, null, false));
      }
    }
    return ok({ students: item.students });
  }
  if (section === "students" && email && method === "DELETE") {
    const target = decodeURIComponent(email);
    item.students = item.students.filter((entry) => entry.email !== target);
    return ok({ students: item.students });
  }
  return fail(404, "Demo mode doesn't support that yet.");
}

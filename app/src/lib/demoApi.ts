/**
 * Development-only stand-in for the API, used in demo mode (see demoFlag.ts).
 * It answers the same paths with sample data kept in memory, so everything
 * resets on reload. It is only ever loaded through a dynamic import guarded by
 * `import.meta.env.DEV`, so production builds don't include it.
 */
import {
  JOIN_CODE_ALPHABET,
  COHORT_LIMITS,
  normalizeJoinCode,
  validateCreateCohortRequest,
  validateStudentJoinRequest,
  validateStudentLoginRequest,
} from "@team-building-mvp/contracts";
import type {
  ClassStudent,
  CohortSummary,
  Facilitator,
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
  },
];

let signedIn = true;

// ----- Student side -----

const QUESTIONNAIRES = [
  { id: "work-style", title: "Work style", minutes: 10, total: 20 },
  { id: "skills", title: "Skills and project interests", minutes: 5, total: 8 },
] as const;

/** Questions answered per student in each class (key "CODE|email"): [work style, skills]. */
const answered = new Map<string, [number, number]>();
/** Classes (by join code) whose teams the demo shows as locked. */
const lockedTeams = new Set<string>();
/** Email of the student signed in on the student side, if any. */
let studentEmail: string | null = null;

function progressFor(code: string, email: string, finished: boolean): [number, number] {
  return answered.get(`${code}|${email}`) ?? (finished ? [20, 8] : [12, 0]);
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
      const [workStyle, skills] = progressFor(item.summary.joinCode, me.email, me.finished);
      return {
        code: item.summary.joinCode,
        name: item.summary.name,
        term: item.summary.term,
        questionnaires: [
          { ...QUESTIONNAIRES[0], answered: workStyle },
          { ...QUESTIONNAIRES[1], answered: skills },
        ],
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
  answered.set(`${code}|${me.email}`, done ? [20, 8] : [12, 0]);
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
      answered.set(`${code}|${email}`, [0, 0]);
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

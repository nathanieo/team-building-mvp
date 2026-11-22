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
} from "@team-building-mvp/contracts";
import type { ClassStudent, CohortSummary, Facilitator } from "@team-building-mvp/contracts";

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
    students: [],
  },
];

let signedIn = true;

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

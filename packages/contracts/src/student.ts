import { emailError, normalizeEmail } from "./auth.js";
import { isRecord, readString } from "./validation.js";
import type { FieldErrors, Validation } from "./validation.js";

export const STUDENT_LIMITS = {
  displayNameMaximumLength: 80,
  studentIdMinimumLength: 3,
  studentIdMaximumLength: 30,
} as const;

/** What a student sees about a class before joining it: just enough to confirm the code. */
export interface JoinClassInfo {
  name: string;
  term: string | null;
}

/** Returned when a student looks up a class code. */
export interface JoinClassResponse {
  cohort: JoinClassInfo;
}

/** A student joining a class for the first time, after entering its code. */
export interface StudentJoinRequest {
  displayName: string;
  /** The school-issued student ID, stored in capitals. */
  studentId: string;
  email: string;
}

export interface StudentJoinResponse {
  student: {
    displayName: string;
    email: string;
  };
}

export type StudentJoinField = "displayName" | "studentId" | "email";

/** Letters, numbers and dashes, which covers the common school ID formats. */
const STUDENT_ID_PATTERN = /^[A-Z0-9-]+$/;

export function validateStudentJoinRequest(
  body: unknown,
): Validation<StudentJoinRequest, StudentJoinField> {
  const source = isRecord(body) ? body : {};
  const displayName = readString(source, "displayName");
  const studentId = readString(source, "studentId").replace(/\s+/g, "").toUpperCase();
  const email = normalizeEmail(readString(source, "email"));
  const errors: FieldErrors<StudentJoinField> = {};

  if (!displayName) errors.displayName = "Enter your full name.";
  else if (displayName.length > STUDENT_LIMITS.displayNameMaximumLength) {
    errors.displayName = `Use ${STUDENT_LIMITS.displayNameMaximumLength} characters or fewer.`;
  }

  if (!studentId) errors.studentId = "Enter your student ID.";
  else if (
    studentId.length < STUDENT_LIMITS.studentIdMinimumLength ||
    studentId.length > STUDENT_LIMITS.studentIdMaximumLength ||
    !STUDENT_ID_PATTERN.test(studentId)
  ) {
    errors.studentId = "Check your student ID. It should be letters and numbers only.";
  }

  const problem = emailError(email);
  if (problem) errors.email = problem === "Enter your email address." ? "Enter your student email." : problem;

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { displayName, studentId, email } };
}

/** The two questionnaires every student answers before teams are formed. */
export type QuestionnaireId = "work-style" | "skills";

export interface QuestionnaireProgress {
  id: QuestionnaireId;
  title: string;
  /** Rough time to finish, shown to students. */
  minutes: number;
  answered: number;
  total: number;
}

export interface Teammate {
  displayName: string;
  email: string;
  /** True for the student viewing the page. */
  isYou: boolean;
}

/** A student's team. Only sent once the teacher has locked teams, never while they're a draft. */
export interface StudentTeam {
  name: string;
  project: string | null;
  members: Teammate[];
  /** Plain-language reasons for the grouping, without anyone's personal answers. */
  reasons: string[];
}

/** One class as its student sees it. */
export interface StudentClassView {
  code: string;
  name: string;
  term: string | null;
  questionnaires: QuestionnaireProgress[];
  team: StudentTeam | null;
}

export interface StudentHomeResponse {
  student: { displayName: string; email: string; studentId: string };
  classes: StudentClassView[];
}

/** Returning students get back in with just their student email. */
export interface StudentLoginRequest {
  email: string;
}

export type StudentLoginField = "email";

/** Where a class is for its student: answering, waiting for teams, or on a team. */
export type StudentStage = "questionnaires" | "waiting" | "team";

export function studentStage(view: StudentClassView): StudentStage {
  if (view.team) return "team";
  return view.questionnaires.every((item) => item.answered >= item.total) ? "waiting" : "questionnaires";
}

export function validateStudentLoginRequest(
  body: unknown,
): Validation<StudentLoginRequest, StudentLoginField> {
  const source = isRecord(body) ? body : {};
  const email = normalizeEmail(readString(source, "email"));
  const problem = emailError(email);
  if (problem) {
    return { ok: false, errors: { email: problem === "Enter your email address." ? "Enter your student email." : problem } };
  }
  return { ok: true, value: { email } };
}

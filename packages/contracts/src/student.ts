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

import { isRecord, readString } from "./validation.js";
import type { FieldErrors, Validation } from "./validation.js";

export const COHORT_LIMITS = {
  nameMinimumLength: 3,
  nameMaximumLength: 120,
  termMaximumLength: 40,
  teamSizeMinimum: 2,
  teamSizeMaximum: 12,
  joinCodeLength: 6,
} as const;

/** Join code characters. No 0/O, 1/I/L, so codes read cleanly off a projector slide. */
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Uppercases and drops spaces and dashes, so "bd8 vef" and "BD8-VEF" both become "BD8VEF". */
export function normalizeJoinCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

/** Checks a normalized join code's shape. Returns the message to show, if any. */
export function joinCodeError(code: string): string | undefined {
  if (!code) return "Enter the class code from your instructor.";
  if (code.length !== COHORT_LIMITS.joinCodeLength || [...code].some((char) => !JOIN_CODE_ALPHABET.includes(char))) {
    return `Class codes are ${COHORT_LIMITS.joinCodeLength} letters and numbers, like BD8VEF. They never use 0, 1, I, L or O.`;
  }
  return undefined;
}

/**
 * Where a class is in the MVP flow:
 * collecting → students are joining and answering questionnaires;
 * teams-draft → teams have been formed and can still be adjusted;
 * teams-locked → teams are final and can be exported.
 */
export const COHORT_STATUSES = ["collecting", "teams-draft", "teams-locked"] as const;
export type CohortStatus = (typeof COHORT_STATUSES)[number];

/** One class as shown on the facilitator dashboard. */
export interface CohortSummary {
  id: string;
  name: string;
  term: string | null;
  joinCode: string;
  teamSize: number;
  status: CohortStatus;
  studentCount: number;
  /** Students who finished every questionnaire. */
  completedCount: number;
  projectCount: number;
  teamCount: number;
  createdAt: string;
}

export interface CreateCohortRequest {
  name: string;
  term: string | null;
  teamSize: number;
}

export interface CohortListResponse {
  cohorts: CohortSummary[];
}

export interface CohortResponse {
  cohort: CohortSummary;
}

export type CreateCohortField = "name" | "term" | "teamSize";

export function validateCreateCohortRequest(
  body: unknown,
): Validation<CreateCohortRequest, CreateCohortField> {
  const source = isRecord(body) ? body : {};
  const name = readString(source, "name");
  const termText = readString(source, "term");
  const teamSize = source.teamSize;
  const errors: FieldErrors<CreateCohortField> = {};

  if (name.length < COHORT_LIMITS.nameMinimumLength) {
    errors.name = `Use at least ${COHORT_LIMITS.nameMinimumLength} characters.`;
  } else if (name.length > COHORT_LIMITS.nameMaximumLength) {
    errors.name = `Use ${COHORT_LIMITS.nameMaximumLength} characters or fewer.`;
  }

  if (termText.length > COHORT_LIMITS.termMaximumLength) {
    errors.term = `Use ${COHORT_LIMITS.termMaximumLength} characters or fewer.`;
  }

  if (
    typeof teamSize !== "number" ||
    !Number.isInteger(teamSize) ||
    teamSize < COHORT_LIMITS.teamSizeMinimum ||
    teamSize > COHORT_LIMITS.teamSizeMaximum
  ) {
    errors.teamSize = `Choose a whole number from ${COHORT_LIMITS.teamSizeMinimum} to ${COHORT_LIMITS.teamSizeMaximum}.`;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : {
        ok: true,
        value: { name, term: termText || null, teamSize: teamSize as number },
      };
}

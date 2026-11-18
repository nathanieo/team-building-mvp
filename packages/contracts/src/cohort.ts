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
  /** Smallest team size. */
  teamSize: number;
  /** Largest team size; equal to teamSize when teams are a fixed size. */
  teamSizeMax: number;
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
  /** Smallest team size. */
  teamSize: number;
  /** Largest team size. Optional when sending; it defaults to teamSize (a fixed size). */
  teamSizeMax: number;
}

/** "4" for a fixed size, "3–4" for a flexible one. */
export function formatTeamSize(teamSize: number, teamSizeMax: number): string {
  return teamSize === teamSizeMax ? String(teamSize) : `${teamSize}–${teamSizeMax}`;
}

/**
 * Reads what a teacher types for team size: "4", or a range like "3-4", "3–4"
 * or "3 to 4". Either order works, so "4-3" means 3 to 4.
 */
export function parseTeamSize(
  text: string,
): { ok: true; teamSize: number; teamSizeMax: number } | { ok: false; error: string } {
  const { teamSizeMinimum: low, teamSizeMaximum: high } = COHORT_LIMITS;
  const match = text.trim().match(/^(\d{1,2})(?:\s*(?:-|–|—|to)\s*(\d{1,2}))?$/i);
  if (!match) {
    return { ok: false, error: `Enter a number like 4, or a range like 3-4 (from ${low} to ${high}).` };
  }
  const first = Number(match[1]);
  const second = match[2] === undefined ? first : Number(match[2]);
  const teamSize = Math.min(first, second);
  const teamSizeMax = Math.max(first, second);
  if (teamSize < low || teamSizeMax > high) {
    return { ok: false, error: `Team sizes go from ${low} to ${high}.` };
  }
  return { ok: true, teamSize, teamSizeMax };
}

export interface CohortListResponse {
  cohorts: CohortSummary[];
}

export interface CohortResponse {
  cohort: CohortSummary;
}

/**
 * One student in a class's Students tab: everyone on the teacher's class list,
 * plus anyone who joined with the code without being on it.
 */
export interface ClassStudent {
  email: string;
  /** The name the student typed when joining; null until they join. */
  displayName: string | null;
  joined: boolean;
  /** Finished every questionnaire. Always false before joining. */
  finished: boolean;
}

export interface ClassStudentsResponse {
  students: ClassStudent[];
}

/** Adds emails to a class's list. Emails already on it are ignored. */
export interface AddClassListRequest {
  emails: string[];
}

export const CLASS_LIST_LIMITS = {
  maximumEmails: 500,
} as const;

/**
 * Reads pasted text (one email per line, or separated by commas, semicolons or
 * spaces) into lowercase, de-duplicated emails, plus anything that isn't an email.
 */
export function parseClassList(text: string): { emails: string[]; invalid: string[] } {
  const emails: string[] = [];
  const invalid: string[] = [];
  for (const piece of text.split(/[\s,;]+/)) {
    const token = piece.trim().replace(/^<|>$/g, "");
    if (!token) continue;
    const email = token.toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!emails.includes(email)) emails.push(email);
    } else if (!invalid.includes(token)) {
      invalid.push(token);
    }
  }
  return { emails, invalid };
}

export type CreateCohortField = "name" | "term" | "teamSize";

export function validateCreateCohortRequest(
  body: unknown,
): Validation<CreateCohortRequest, CreateCohortField> {
  const source = isRecord(body) ? body : {};
  const name = readString(source, "name");
  const termText = readString(source, "term");
  const teamSize = source.teamSize;
  // A missing maximum means a fixed size, so older callers that only send teamSize still work.
  const teamSizeMax = source.teamSizeMax ?? teamSize;
  const errors: FieldErrors<CreateCohortField> = {};

  if (name.length < COHORT_LIMITS.nameMinimumLength) {
    errors.name = `Use at least ${COHORT_LIMITS.nameMinimumLength} characters.`;
  } else if (name.length > COHORT_LIMITS.nameMaximumLength) {
    errors.name = `Use ${COHORT_LIMITS.nameMaximumLength} characters or fewer.`;
  }

  if (termText.length > COHORT_LIMITS.termMaximumLength) {
    errors.term = `Use ${COHORT_LIMITS.termMaximumLength} characters or fewer.`;
  }

  const isTeamSize = (value: unknown): value is number =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= COHORT_LIMITS.teamSizeMinimum &&
    value <= COHORT_LIMITS.teamSizeMaximum;
  if (!isTeamSize(teamSize) || !isTeamSize(teamSizeMax)) {
    errors.teamSize = `Choose whole numbers from ${COHORT_LIMITS.teamSizeMinimum} to ${COHORT_LIMITS.teamSizeMaximum}.`;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          name,
          term: termText || null,
          // Store the smaller number as teamSize whichever order they came in.
          teamSize: Math.min(teamSize as number, teamSizeMax as number),
          teamSizeMax: Math.max(teamSize as number, teamSizeMax as number),
        },
      };
}

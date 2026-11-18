import { isRecord, readString } from "./validation.js";
import type { FieldErrors, Validation } from "./validation.js";

export const AUTH_LIMITS = {
  displayNameMaximumLength: 80,
  emailMaximumLength: 254,
  usernameMinimumLength: 3,
  usernameMaximumLength: 30,
  passwordMinimumLength: 10,
  passwordMaximumLength: 200,
} as const;

/** Public facilitator profile. Never includes credentials. */
export interface Facilitator {
  id: string;
  email: string;
  /** Null for accounts created before usernames existed; they log in with their email. */
  username: string | null;
  displayName: string;
}

export interface FacilitatorLoginRequest {
  /** A username or an email address. Anything containing "@" is treated as an email. */
  identifier: string;
  password: string;
}

export interface FacilitatorRegisterRequest {
  displayName: string;
  username: string;
  email: string;
  password: string;
  /**
   * Required by the API only when FACILITATOR_INVITE_CODE is configured, so a
   * deployed instance does not accept facilitator accounts from anyone.
   */
  inviteCode: string;
}

/** Returned by register, login, and the current-session endpoint. */
export interface FacilitatorSessionResponse {
  facilitator: Facilitator;
}

export type LoginField = "identifier" | "password";
export type RegisterField = "displayName" | "username" | "email" | "password" | "inviteCode";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Letters, numbers, periods and underscores, starting and ending with a letter or number. */
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/;

/** Lowercases so the same address cannot register twice with different casing. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lowercases so "Kim" and "kim" are the same username. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Usernames can never contain "@", so this tells the two kinds of login apart. */
export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes("@");
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (email.length > AUTH_LIMITS.emailMaximumLength || !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

/** Checks one email address (e.g. on the password reset page). Returns the message to show, if any. */
export function emailError(email: string): string | undefined {
  return validateEmail(normalizeEmail(email));
}

function validateUsername(username: string): string | undefined {
  if (!username) return "Choose a username.";
  if (
    username.length < AUTH_LIMITS.usernameMinimumLength ||
    username.length > AUTH_LIMITS.usernameMaximumLength
  ) {
    return `Use ${AUTH_LIMITS.usernameMinimumLength} to ${AUTH_LIMITS.usernameMaximumLength} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use letters, numbers, periods and underscores, starting and ending with a letter or number.";
  }
  return undefined;
}

/**
 * Validates a login body. Passwords are not trimmed, and login only checks
 * presence so the error never reveals the username or password rules of an account.
 */
export function validateLoginRequest(
  body: unknown,
): Validation<FacilitatorLoginRequest, LoginField> {
  const source = isRecord(body) ? body : {};
  // Emails and usernames are both stored lowercase, so one normalization fits both.
  const identifier = readString(source, "identifier").toLowerCase();
  const password = typeof source.password === "string" ? source.password : "";
  const errors: FieldErrors<LoginField> = {};

  if (!identifier) errors.identifier = "Enter your username or email.";
  if (!password) errors.password = "Enter your password.";

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { identifier, password } };
}

export function validateRegisterRequest(
  body: unknown,
): Validation<FacilitatorRegisterRequest, RegisterField> {
  const source = isRecord(body) ? body : {};
  const displayName = readString(source, "displayName");
  const username = normalizeUsername(readString(source, "username"));
  const email = normalizeEmail(readString(source, "email"));
  const password = typeof source.password === "string" ? source.password : "";
  const errors: FieldErrors<RegisterField> = {};

  if (!displayName) errors.displayName = "Enter your name.";
  else if (displayName.length > AUTH_LIMITS.displayNameMaximumLength) {
    errors.displayName = `Use ${AUTH_LIMITS.displayNameMaximumLength} characters or fewer.`;
  }

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (password.length < AUTH_LIMITS.passwordMinimumLength) {
    errors.password = `Use at least ${AUTH_LIMITS.passwordMinimumLength} characters.`;
  } else if (password.length > AUTH_LIMITS.passwordMaximumLength) {
    errors.password = `Use ${AUTH_LIMITS.passwordMaximumLength} characters or fewer.`;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : {
        ok: true,
        value: { displayName, username, email, password, inviteCode: readString(source, "inviteCode") },
      };
}

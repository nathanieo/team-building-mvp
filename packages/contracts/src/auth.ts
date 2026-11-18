import { isRecord, readString } from "./validation.js";
import type { FieldErrors, Validation } from "./validation.js";

export const AUTH_LIMITS = {
  displayNameMaximumLength: 80,
  emailMaximumLength: 254,
  passwordMinimumLength: 10,
  passwordMaximumLength: 200,
} as const;

/** Public facilitator profile. Never includes credentials. */
export interface Facilitator {
  id: string;
  email: string;
  displayName: string;
}

export interface FacilitatorLoginRequest {
  email: string;
  password: string;
}

export interface FacilitatorRegisterRequest extends FacilitatorLoginRequest {
  displayName: string;
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

export type LoginField = "email" | "password";
export type RegisterField = LoginField | "displayName" | "inviteCode";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercases so the same address cannot register twice with different casing. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (email.length > AUTH_LIMITS.emailMaximumLength || !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

/**
 * Validates a login body. Passwords are not trimmed, and login only checks
 * presence so the error never reveals the password policy of an account.
 */
export function validateLoginRequest(
  body: unknown,
): Validation<FacilitatorLoginRequest, LoginField> {
  const source = isRecord(body) ? body : {};
  const email = normalizeEmail(readString(source, "email"));
  const password = typeof source.password === "string" ? source.password : "";
  const errors: FieldErrors<LoginField> = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Enter your password.";

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { email, password } };
}

export function validateRegisterRequest(
  body: unknown,
): Validation<FacilitatorRegisterRequest, RegisterField> {
  const source = isRecord(body) ? body : {};
  const displayName = readString(source, "displayName");
  const email = normalizeEmail(readString(source, "email"));
  const password = typeof source.password === "string" ? source.password : "";
  const errors: FieldErrors<RegisterField> = {};

  if (!displayName) errors.displayName = "Enter your name.";
  else if (displayName.length > AUTH_LIMITS.displayNameMaximumLength) {
    errors.displayName = `Use ${AUTH_LIMITS.displayNameMaximumLength} characters or fewer.`;
  }

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
        value: { displayName, email, password, inviteCode: readString(source, "inviteCode") },
      };
}

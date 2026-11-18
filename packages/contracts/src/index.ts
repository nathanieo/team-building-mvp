/**
 * Public entry point for browser-safe contracts shared by the React frontend
 * and NestJS API.
 *
 * Keep server-only configuration, password hashing, session tokens, database
 * records, and credentials outside this package.
 */

export type { FieldErrors, Validation } from "./validation.js";

export {
  AUTH_LIMITS,
  normalizeEmail,
  validateLoginRequest,
  validateRegisterRequest,
} from "./auth.js";
export type {
  Facilitator,
  FacilitatorLoginRequest,
  FacilitatorRegisterRequest,
  FacilitatorSessionResponse,
  LoginField,
  RegisterField,
} from "./auth.js";

export { COHORT_LIMITS, COHORT_STATUSES, validateCreateCohortRequest } from "./cohort.js";
export type {
  CohortListResponse,
  CohortResponse,
  CohortStatus,
  CohortSummary,
  CreateCohortField,
  CreateCohortRequest,
} from "./cohort.js";

/** Error body returned by every API failure. */
export interface ApiErrorResponse {
  error: string;
  fieldErrors?: Record<string, string>;
}

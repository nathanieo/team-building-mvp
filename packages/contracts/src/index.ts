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
  emailError,
  isEmailIdentifier,
  normalizeEmail,
  normalizeUsername,
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

export {
  CLASS_LIST_LIMITS,
  COHORT_LIMITS,
  COHORT_STATUSES,
  formatTeamSize,
  JOIN_CODE_ALPHABET,
  joinCodeError,
  normalizeJoinCode,
  parseClassList,
  parseTeamSize,
  validateCreateCohortRequest,
} from "./cohort.js";
export type {
  AddClassListRequest,
  ClassStudent,
  ClassStudentsResponse,
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

export { STUDENT_LIMITS, studentStage, validateStudentJoinRequest, validateStudentLoginRequest } from "./student.js";
export type {
  JoinClassInfo,
  JoinClassResponse,
  QuestionnaireId,
  QuestionnaireProgress,
  StudentClassView,
  StudentHomeResponse,
  StudentJoinField,
  StudentJoinRequest,
  StudentJoinResponse,
  StudentLoginField,
  StudentLoginRequest,
  StudentStage,
  StudentTeam,
  Teammate,
} from "./student.js";

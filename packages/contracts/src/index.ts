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

export {
  AGREEMENT_LABELS,
  buildSkillsQuestionnaire,
  buildWorkStyleQuestionnaire,
  countAnswered,
  firstUnanswered,
  isValidAnswer,
  PROJECT_RANK_QUESTION_ID,
  SKILL_ITEMS,
  SKILL_LABELS,
  WORK_STYLE_ITEMS,
} from "./questionnaire.js";
export type {
  BigFiveTrait,
  Question,
  Questionnaire,
  QuestionnaireAnswer,
  QuestionnaireResponse,
  RankQuestion,
  SaveAnswerRequest,
  SaveAnswerResponse,
  ScaleQuestion,
} from "./questionnaire.js";

export {
  ARCHETYPE_ORDER,
  ARCHETYPES,
  TEAM_DIMENSIONS,
  TRAIT_ORDER,
  TRAITS,
} from "./personalityContent.js";
export type {
  Archetype,
  ArchetypeId,
  BlindSpot,
  Strength,
  TeamDimension,
  TraitBand,
  TraitDirection,
  TraitId,
} from "./personalityContent.js";
export {
  computePersonality,
  PERSONALITY_RULES,
  PERSONALITY_VERSION,
  pickArchetypes,
  scoreArchetypes,
  scoreTraits,
  teamBalance,
  traitBand,
} from "./personality.js";
export type {
  ArchetypeScore,
  Compatibility,
  IdealTeam,
  Insight,
  ItemEvidence,
  MatchStrength,
  PersonalityResult,
  TeamRole,
  TraitScore,
} from "./personality.js";

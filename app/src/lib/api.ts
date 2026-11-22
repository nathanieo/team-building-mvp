import type {
  AddClassListRequest,
  ApiErrorResponse,
  ClassStudentsResponse,
  CohortListResponse,
  CohortResponse,
  CreateCohortRequest,
  FacilitatorLoginRequest,
  FacilitatorRegisterRequest,
  FacilitatorSessionResponse,
  JoinClassResponse,
  StudentHomeResponse,
  StudentJoinRequest,
  StudentJoinResponse,
  StudentLoginRequest,
} from "@team-building-mvp/contracts";
import { isDemoMode } from "./demoFlag";

/** A failed API call with the server's message and any field-level errors. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === "object" && value !== null && typeof (value as ApiErrorResponse).error === "string";
}

/** Converts any failed response body into an ApiError with a readable message. */
export function toApiError(status: number, body: unknown): ApiError {
  if (isApiErrorResponse(body)) return new ApiError(status, body.error, body.fieldErrors ?? {});
  if (status >= 500 || status === 0) {
    return new ApiError(status, "The server isn't responding. Check that the API is running and try again.");
  }
  return new ApiError(status, "Something went wrong. Try again.");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Demo mode (development only) answers from built-in sample data instead of the server.
  // The DEV check lets production builds drop this branch and the demo module.
  if (import.meta.env.DEV && isDemoMode()) {
    const { demoRespond } = await import("./demoApi");
    const { status, body } = await demoRespond(path, init);
    if (status >= 400) throw toApiError(status, body);
    return body as T;
  }

  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers, credentials: "same-origin" });
  } catch {
    throw toApiError(0, null);
  }

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}

export const api = {
  me: () => request<FacilitatorSessionResponse>("/auth/me"),
  login: (body: FacilitatorLoginRequest) =>
    request<FacilitatorSessionResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: FacilitatorRegisterRequest) =>
    request<FacilitatorSessionResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
  listCohorts: () => request<CohortListResponse>("/cohorts"),
  createCohort: (body: CreateCohortRequest) =>
    request<CohortResponse>("/cohorts", { method: "POST", body: JSON.stringify(body) }),
  // Student home and sign-in. Not in the API yet; demo mode answers them.
  studentHome: () => request<StudentHomeResponse>("/student/me"),
  studentLogin: (body: StudentLoginRequest) =>
    request<StudentHomeResponse>("/student/login", { method: "POST", body: JSON.stringify(body) }),
  studentLogout: () => request<null>("/student/logout", { method: "POST" }),
  // Student sign-up. The API doesn't have these two endpoints yet; demo mode answers them.
  lookupJoinCode: (code: string) => request<JoinClassResponse>(`/join/${encodeURIComponent(code)}`),
  joinClass: (code: string, body: StudentJoinRequest) =>
    request<StudentJoinResponse>(`/join/${encodeURIComponent(code)}`, { method: "POST", body: JSON.stringify(body) }),
  // The API doesn't have these three endpoints yet; the Students tab is built against them.
  removeStudent: (cohortId: string, email: string) =>
    request<ClassStudentsResponse>(
      `/cohorts/${encodeURIComponent(cohortId)}/students/${encodeURIComponent(email)}`,
      { method: "DELETE" },
    ),
  listStudents: (cohortId: string) =>
    request<ClassStudentsResponse>(`/cohorts/${encodeURIComponent(cohortId)}/students`),
  addClassList: (cohortId: string, body: AddClassListRequest) =>
    request<ClassStudentsResponse>(`/cohorts/${encodeURIComponent(cohortId)}/class-list`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

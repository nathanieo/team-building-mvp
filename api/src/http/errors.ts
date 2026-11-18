import { HttpException, HttpStatus } from "@nestjs/common";
import type { ApiErrorResponse } from "@team-building-mvp/contracts";

/** Builds an HttpException whose body matches the shared ApiErrorResponse. */
export function apiError(
  status: HttpStatus,
  error: string,
  fieldErrors?: Record<string, string | undefined>,
): HttpException {
  const body: ApiErrorResponse = { error };
  if (fieldErrors) {
    body.fieldErrors = Object.fromEntries(
      Object.entries(fieldErrors).filter((entry): entry is [string, string] => entry[1] !== undefined),
    );
  }
  return new HttpException(body, status);
}

export function validationError(fieldErrors: Record<string, string | undefined>): HttpException {
  return apiError(HttpStatus.BAD_REQUEST, "Check the highlighted fields.", fieldErrors);
}

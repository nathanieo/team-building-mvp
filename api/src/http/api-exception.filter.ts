import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import type { ApiErrorResponse } from "@team-building-mvp/contracts";

const GENERIC_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "The request body contains invalid JSON.",
  [HttpStatus.NOT_FOUND]: "Endpoint not found.",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "The request body is too large.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Turns every failure into `{ error, fieldErrors? }`. Unexpected errors are
 * logged on the server only and never echoed to the browser.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (isRecord(exception) && exception.type === "entity.too.large") {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({ error: "The request body is too large." });
      return;
    }
    if (isRecord(exception) && exception.type === "entity.parse.failed") {
      response.status(HttpStatus.BAD_REQUEST).json({ error: "The request body contains invalid JSON." });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      let payload: ApiErrorResponse;
      if (isRecord(body) && typeof body.error === "string" && body.statusCode === undefined) {
        payload = body as unknown as ApiErrorResponse;
      } else {
        // Framework-generated exceptions can carry parser internals; never echo them.
        payload = { error: GENERIC_MESSAGES[status] ?? "The request could not be processed." };
      }
      response.status(status).json(payload);
      return;
    }

    this.logger.error(
      "Unhandled API request failure.",
      exception instanceof Error ? exception.stack : undefined,
    );
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "The request could not be processed." });
  }
}

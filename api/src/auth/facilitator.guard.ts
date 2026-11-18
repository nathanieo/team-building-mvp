import { createParamDecorator, HttpStatus, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { Facilitator } from "@team-building-mvp/contracts";
import { apiError } from "../http/errors.js";
import { AuthService } from "./auth.service.js";
import { readCookie, SESSION_COOKIE_NAME } from "./session-token.js";

type AuthenticatedRequest = Request & { facilitator?: Facilitator };

/** Allows the request only with a valid facilitator session cookie. */
@Injectable()
export class FacilitatorGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const facilitator = token ? await this.auth.findBySessionToken(token) : null;
    if (!facilitator) {
      throw apiError(HttpStatus.UNAUTHORIZED, "Log in to continue.");
    }
    request.facilitator = facilitator;
    return true;
  }
}

/** Injects the facilitator attached by FacilitatorGuard. */
export const CurrentFacilitator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Facilitator => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.facilitator) throw new Error("FacilitatorGuard must run before CurrentFacilitator.");
    return request.facilitator;
  },
);

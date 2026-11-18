import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import {
  validateLoginRequest,
  validateRegisterRequest,
} from "@team-building-mvp/contracts";
import type { Facilitator, FacilitatorSessionResponse } from "@team-building-mvp/contracts";
import { API_CONFIG } from "../config.js";
import type { ApiConfig } from "../config.js";
import { validationError } from "../http/errors.js";
import { AuthService } from "./auth.service.js";
import type { IssuedSession } from "./auth.service.js";
import { CurrentFacilitator, FacilitatorGuard } from "./facilitator.guard.js";
import {
  readCookie,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  SESSION_COOKIE_NAME,
} from "./session-token.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  private respondWithSession(response: Response, session: IssuedSession): FacilitatorSessionResponse {
    response.setHeader(
      "Set-Cookie",
      serializeSessionCookie(session.token, {
        maxAgeSeconds: session.maxAgeSeconds,
        secure: this.config.sessionCookieSecure,
      }),
    );
    response.setHeader("Cache-Control", "no-store");
    return { facilitator: session.facilitator };
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<FacilitatorSessionResponse> {
    const validation = validateRegisterRequest(body);
    if (!validation.ok) throw validationError(validation.errors);
    return this.respondWithSession(response, await this.auth.register(validation.value));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<FacilitatorSessionResponse> {
    const validation = validateLoginRequest(body);
    if (!validation.ok) throw validationError(validation.errors);
    const session = await this.auth.login(validation.value, request.ip ?? "unknown");
    return this.respondWithSession(response, session);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    if (token) await this.auth.logout(token);
    response.setHeader("Set-Cookie", serializeClearedSessionCookie(this.config.sessionCookieSecure));
  }

  @Get("me")
  @UseGuards(FacilitatorGuard)
  me(
    @CurrentFacilitator() facilitator: Facilitator,
    @Res({ passthrough: true }) response: Response,
  ): FacilitatorSessionResponse {
    response.setHeader("Cache-Control", "no-store");
    return { facilitator };
  }
}

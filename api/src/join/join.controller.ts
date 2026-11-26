import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { normalizeJoinCode, validateStudentJoinRequest } from "@team-building-mvp/contracts";
import type { JoinClassResponse, StudentJoinResponse } from "@team-building-mvp/contracts";
import { serializeSessionCookie, STUDENT_SESSION_COOKIE_NAME } from "../auth/session-token.js";
import { API_CONFIG } from "../config.js";
import type { ApiConfig } from "../config.js";
import { validationError } from "../http/errors.js";
import { JoinService } from "./join.service.js";

/** Public routes for students joining a class with its code. No login needed. */
@Controller("join")
export class JoinController {
  constructor(
    private readonly join: JoinService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  @Get(":code")
  async lookup(@Param("code") rawCode: string): Promise<JoinClassResponse> {
    const code = normalizeJoinCode(rawCode);
    return { cohort: await this.join.findClass(code) };
  }
   @Post(":code")
  @HttpCode(HttpStatus.CREATED)
  async signUp(
    @Param("code") rawCode: string,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StudentJoinResponse> {
    const validation = validateStudentJoinRequest(body);
    if (!validation.ok) throw validationError(validation.errors);

    const session = await this.join.joinClass(normalizeJoinCode(rawCode), validation.value);

    response.setHeader(
      "Set-Cookie",
      serializeSessionCookie(session.token, {
        name: STUDENT_SESSION_COOKIE_NAME,
        maxAgeSeconds: session.maxAgeSeconds,
        secure: this.config.sessionCookieSecure,
      }),
    );
    response.setHeader("Cache-Control", "no-store");
    return { student: session.student };
  }
}

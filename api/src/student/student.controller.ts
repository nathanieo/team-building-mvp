import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { normalizeJoinCode, validateStudentLoginRequest } from "@team-building-mvp/contracts";
import type { QuestionnaireResponse, SaveAnswerResponse, StudentHomeResponse } from "@team-building-mvp/contracts";
import { readCookie, serializeSessionCookie, STUDENT_SESSION_COOKIE_NAME } from "../auth/session-token.js";
import { API_CONFIG } from "../config.js";
import type { ApiConfig } from "../config.js";
import { apiError, validationError } from "../http/errors.js";
import { CurrentStudent, StudentGuard } from "./student.guard.js";
import { StudentService } from "./student.service.js";
import type { SignedInStudent } from "./student.service.js";

/** The logged-in student's home, plus logging in and out. */
@Controller("student")
export class StudentController {
  constructor(
    private readonly students: StudentService,
    @Inject(API_CONFIG) private readonly config: ApiConfig,
  ) {}

  @Get("me")
  @UseGuards(StudentGuard)
  async me(
    @CurrentStudent() student: SignedInStudent,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StudentHomeResponse> {
    response.setHeader("Cache-Control", "no-store");
    const home = await this.students.home(student.email);
    if (!home) throw apiError(HttpStatus.UNAUTHORIZED, "Log in to continue.");
    return home;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StudentHomeResponse> {
    const validation = validateStudentLoginRequest(body);
    if (!validation.ok) throw validationError(validation.errors);

    const session = await this.students.login(validation.value.email);
    response.setHeader("Set-Cookie", this.cookie(session.token, session.maxAgeSeconds));
    response.setHeader("Cache-Control", "no-store");
    return session.home;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = readCookie(request.headers.cookie, STUDENT_SESSION_COOKIE_NAME);
    if (token) await this.students.logout(token);
    response.setHeader("Set-Cookie", this.cookie("", 0));
  }

  @Get("classes/:code/questionnaires/:id")
  @UseGuards(StudentGuard)
  async questionnaire(
    @CurrentStudent() student: SignedInStudent,
    @Param("code") code: string,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<QuestionnaireResponse> {
    response.setHeader("Cache-Control", "no-store");
    return this.students.questionnaire(student.email, normalizeJoinCode(code), id);
  }

  @Put("classes/:code/questionnaires/:id/answers/:questionId")
  @UseGuards(StudentGuard)
  async saveAnswer(
    @CurrentStudent() student: SignedInStudent,
    @Param("code") code: string,
    @Param("id") id: string,
    @Param("questionId") questionId: string,
    @Body() body: unknown,
  ): Promise<SaveAnswerResponse> {
    const answer = typeof body === "object" && body !== null && "answer" in body ? body.answer : undefined;
    return this.students.saveAnswer(student.email, normalizeJoinCode(code), id, questionId, answer);
  }

  /** The student cookie. An empty token with 0 seconds tells the browser to delete it. */
  private cookie(token: string, maxAgeSeconds: number): string {
    return serializeSessionCookie(token, {
      name: STUDENT_SESSION_COOKIE_NAME,
      maxAgeSeconds,
      secure: this.config.sessionCookieSecure,
    });
  }
}

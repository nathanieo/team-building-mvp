import { createParamDecorator, HttpStatus, Injectable } from "@nestjs/common";
import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { readCookie, STUDENT_SESSION_COOKIE_NAME } from "../auth/session-token.js";
import { apiError } from "../http/errors.js";
import { StudentService } from "./student.service.js";
import type { SignedInStudent } from "./student.service.js";

type StudentRequest = Request & { student?: SignedInStudent };

/** Allows the request only with a valid student session cookie. */
@Injectable()
export class StudentGuard implements CanActivate {
  constructor(private readonly students: StudentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StudentRequest>();
    const token = readCookie(request.headers.cookie, STUDENT_SESSION_COOKIE_NAME);
    const student = token ? await this.students.findBySessionToken(token) : null;
    if (!student) throw apiError(HttpStatus.UNAUTHORIZED, "Log in to continue.");
    request.student = student;
    return true;
  }
}

/** Hands a route the student that StudentGuard found. */
export const CurrentStudent = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SignedInStudent => {
    const request = context.switchToHttp().getRequest<StudentRequest>();
    if (!request.student) throw new Error("StudentGuard must run before CurrentStudent.");
    return request.student;
  },
);

import { HttpStatus, Injectable } from "@nestjs/common";
import type { JoinClassInfo, StudentJoinRequest } from "@team-building-mvp/contracts";
import { createSessionToken, hashSessionToken } from "../auth/session-token.js";
import { apiError, validationError } from "../http/errors.js";
import { PrismaService } from "../prisma/prisma.service.js";

/** Students stay logged in for a term-sized stretch, not a single sitting. */
const STUDENT_SESSION_DAYS = 30;
export const STUDENT_SESSION_SECONDS = STUDENT_SESSION_DAYS * 24 * 60 * 60;

/** What joinClass hands back: the secret token for the cookie, and who joined. */
export interface IssuedStudentSession {
  token: string;
  maxAgeSeconds: number;
  student: { displayName: string; email: string };
}

/** Finds classes by their join code, and signs students up to them. */
@Injectable()
export class JoinService {
  constructor(private readonly prisma: PrismaService) {}

  async findClass(joinCode: string): Promise<JoinClassInfo> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { joinCode },
      select: { name: true, term: true },
    });
    if (!cohort) throw apiError(HttpStatus.NOT_FOUND, "We couldn't find a class with that code.");
    return { name: cohort.name, term: cohort.term };
  }

  async joinClass(joinCode: string, request: StudentJoinRequest): Promise<IssuedStudentSession> {
    // 1. Find the class.
    const cohort = await this.prisma.cohort.findUnique({ where: { joinCode }, select: { id: true } });
    if (!cohort) throw apiError(HttpStatus.NOT_FOUND, "We couldn't find a class with that code.");

    // 2. Has this email or student ID already joined this class?
    const clash = await this.prisma.student.findFirst({
      where: {
        cohortId: cohort.id,
        OR: [{ email: request.email }, { schoolId: request.studentId }],
      },
      select: { email: true },
    });
    if (clash) {
      throw validationError(
        clash.email === request.email
          ? { email: "You've already joined this class with this email." }
          : { studentId: "That student ID has already joined this class." },
      );
    }

    // 3. Create the student and their session in one go.
    const token = createSessionToken();
    const student = await this.prisma.student.create({
      data: {
        cohortId: cohort.id,
        displayName: request.displayName,
        email: request.email,
        schoolId: request.studentId,
        sessions: {
          create: {
            tokenHash: hashSessionToken(token),
            expiresAt: new Date(Date.now() + STUDENT_SESSION_SECONDS * 1000),
          },
        },
      },
      select: { displayName: true, email: true },
    });

    return { token, maxAgeSeconds: STUDENT_SESSION_SECONDS, student };
  }
}

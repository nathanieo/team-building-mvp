import { Injectable } from "@nestjs/common";
import { buildSkillsQuestionnaire, buildWorkStyleQuestionnaire } from "@team-building-mvp/contracts";
import type { QuestionnaireId, StudentHomeResponse } from "@team-building-mvp/contracts";
import { createSessionToken, hashSessionToken } from "../auth/session-token.js";
import { validationError } from "../http/errors.js";
import { STUDENT_SESSION_SECONDS } from "../join/join.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

/** Who the student cookie belongs to. */
export interface SignedInStudent {
  id: string;
  email: string;
}

export interface IssuedStudentLogin {
  token: string;
  maxAgeSeconds: number;
  home: StudentHomeResponse;
}

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the student for a cookie token, or null if it's unknown or expired. */
  async findBySessionToken(token: string): Promise<SignedInStudent | null> {
    const session = await this.prisma.studentSession.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { student: { select: { id: true, email: true } } },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.studentSession.deleteMany({ where: { id: session.id } });
      return null;
    }
    return session.student;
  }

  /** Every class this email has joined, with progress on each questionnaire. */
  async home(email: string): Promise<StudentHomeResponse | null> {
    const rows = await this.prisma.student.findMany({
      where: { email },
      orderBy: { joinedAt: "asc" },
      include: {
        cohort: {
          select: {
            joinCode: true,
            name: true,
            term: true,
            projects: { select: { id: true, title: true } },
          },
        },
        answers: { select: { questionnaireId: true } },
      },
    });
    const first = rows[0];
    if (!first) return null;

    return {
      student: { displayName: first.displayName, email, studentId: first.schoolId },
      classes: rows.map((row) => {
        const answered: Record<QuestionnaireId, number> = { "work-style": 0, skills: 0 };
        for (const answer of row.answers) {
          if (answer.questionnaireId === "work-style" || answer.questionnaireId === "skills") {
            answered[answer.questionnaireId] += 1;
          }
        }
        const projects = row.cohort.projects.map((project) => ({ id: project.id, label: project.title }));
        const questionnaires = [buildWorkStyleQuestionnaire(), buildSkillsQuestionnaire(projects)];

        return {
          code: row.cohort.joinCode,
          name: row.cohort.name,
          term: row.cohort.term,
          questionnaires: questionnaires.map((questionnaire) => ({
            id: questionnaire.id,
            title: questionnaire.title,
            minutes: questionnaire.minutes,
            answered: answered[questionnaire.id],
            total: questionnaire.questions.length,
          })),
          team: null,
        };
      }),
    };
  }

  /** Returning students log back in with their student email. */
  async login(email: string): Promise<IssuedStudentLogin> {
    const student = await this.prisma.student.findFirst({
      where: { email },
      orderBy: { joinedAt: "desc" },
      select: { id: true },
    });
    const home = student ? await this.home(email) : null;
    if (!student || !home) {
      throw validationError({ email: "We couldn't find a student with that email. Join your class first." });
    }

    const token = createSessionToken();
    await this.prisma.studentSession.create({
      data: {
        studentId: student.id,
        tokenHash: hashSessionToken(token),
        expiresAt: new Date(Date.now() + STUDENT_SESSION_SECONDS * 1000),
      },
    });
    return { token, maxAgeSeconds: STUDENT_SESSION_SECONDS, home };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.studentSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
}

import { HttpStatus, Injectable } from "@nestjs/common";
import {
  buildSkillsQuestionnaire,
  buildWorkStyleQuestionnaire,
  countAnswered,
  isValidAnswer,
} from "@team-building-mvp/contracts";
import type {
  Questionnaire,
  QuestionnaireAnswer,
  QuestionnaireId,
  QuestionnaireResponse,
  SaveAnswerResponse,
  StudentHomeResponse,
} from "@team-building-mvp/contracts";
import { createSessionToken, hashSessionToken } from "../auth/session-token.js";
import { apiError, validationError } from "../http/errors.js";
import { STUDENT_SESSION_SECONDS } from "../join/join.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

/** Who the student cookie belongs to. */
export interface SignedInStudent {
  id: string;
  email: string;
}

/** The two questionnaires for a class. Skills ends by ranking the class's projects, if it has any. */
function questionnairesFor(projects: Array<{ id: string; title: string }>): Questionnaire[] {
  return [
    buildWorkStyleQuestionnaire(),
    buildSkillsQuestionnaire(projects.map((project) => ({ id: project.id, label: project.title }))),
  ];
}

/** Turns saved answer rows into { questionId: answer }, skipping any that no longer fit their question. */
function answersByQuestion(
  questionnaire: Questionnaire,
  rows: Array<{ questionId: string; value: unknown }>,
): Record<string, QuestionnaireAnswer> {
  const answers: Record<string, QuestionnaireAnswer> = {};
  for (const row of rows) {
    const question = questionnaire.questions.find((entry) => entry.id === row.questionId);
    if (question && isValidAnswer(question, row.value)) answers[row.questionId] = row.value;
  }
  return answers;
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

  /** The student's row in one class, or 404. */
  private async enrolment(email: string, joinCode: string) {
    const row = await this.prisma.student.findFirst({
      where: { email, cohort: { joinCode } },
      select: {
        id: true,
        completedAt: true,
        cohort: { select: { projects: { select: { id: true, title: true } } } },
      },
    });
    if (!row) throw apiError(HttpStatus.NOT_FOUND, "That questionnaire doesn't exist.");
    return row;
  }

  /** One questionnaire with the answers this student has saved so far. */
  async questionnaire(email: string, joinCode: string, id: string): Promise<QuestionnaireResponse> {
    const row = await this.enrolment(email, joinCode);
    const questionnaire = questionnairesFor(row.cohort.projects).find((entry) => entry.id === id);
    if (!questionnaire) throw apiError(HttpStatus.NOT_FOUND, "That questionnaire doesn't exist.");

    const saved = await this.prisma.answer.findMany({
      where: { studentId: row.id, questionnaireId: questionnaire.id },
      select: { questionId: true, value: true },
    });
    return { questionnaire, answers: answersByQuestion(questionnaire, saved) };
  }

  /** Saves one answer: creates the row the first time, updates it after that. */
  async saveAnswer(
    email: string,
    joinCode: string,
    id: string,
    questionId: string,
    answer: unknown,
  ): Promise<SaveAnswerResponse> {
    const row = await this.enrolment(email, joinCode);
    const questionnaires = questionnairesFor(row.cohort.projects);
    const questionnaire = questionnaires.find((entry) => entry.id === id);
    const question = questionnaire?.questions.find((entry) => entry.id === questionId);
    if (!questionnaire || !question) throw apiError(HttpStatus.NOT_FOUND, "That question doesn't exist.");
    if (!isValidAnswer(question, answer)) {
      throw apiError(HttpStatus.BAD_REQUEST, "That answer doesn't fit the question.");
    }

    await this.prisma.answer.upsert({
      where: { studentId_questionId: { studentId: row.id, questionId: question.id } },
      create: { studentId: row.id, questionnaireId: questionnaire.id, questionId: question.id, value: answer },
      update: { value: answer },
    });

    // Work out progress, and mark the student finished once both questionnaires are complete.
    const saved = await this.prisma.answer.findMany({
      where: { studentId: row.id },
      select: { questionnaireId: true, questionId: true, value: true },
    });
    const answeredIn = (entry: Questionnaire) =>
      countAnswered(entry, answersByQuestion(entry, saved.filter((item) => item.questionnaireId === entry.id)));
    const finished = questionnaires.every((entry) => answeredIn(entry) === entry.questions.length);
    if (finished && !row.completedAt) {
      await this.prisma.student.update({ where: { id: row.id }, data: { completedAt: new Date() } });
    }

    return { answered: answeredIn(questionnaire), total: questionnaire.questions.length };
  }
}

import { HttpStatus, Injectable } from "@nestjs/common";
import { COHORT_STATUSES } from "@team-building-mvp/contracts";
import type { CohortStatus, CohortSummary, CreateCohortRequest } from "@team-building-mvp/contracts";
import { Prisma } from "../generated/prisma/client.js";
import { apiError } from "../http/errors.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { generateJoinCode } from "./join-code.js";

const summaryInclude = {
  _count: { select: { students: true, projects: true, teams: true } },
} satisfies Prisma.CohortInclude;

type CohortWithCounts = Prisma.CohortGetPayload<{ include: typeof summaryInclude }>;

function toStatus(value: string): CohortStatus {
  return (COHORT_STATUSES as readonly string[]).includes(value) ? (value as CohortStatus) : "collecting";
}

function toSummary(cohort: CohortWithCounts, completedCount: number): CohortSummary {
  return {
    id: cohort.id,
    name: cohort.name,
    term: cohort.term,
    joinCode: cohort.joinCode,
    teamSize: cohort.teamSize,
    status: toStatus(cohort.status),
    studentCount: cohort._count.students,
    completedCount,
    projectCount: cohort._count.projects,
    teamCount: cohort._count.teams,
    createdAt: cohort.createdAt.toISOString(),
  };
}

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  private async completedCounts(cohortIds: string[]): Promise<Map<string, number>> {
    if (cohortIds.length === 0) return new Map();
    const rows = await this.prisma.student.groupBy({
      by: ["cohortId"],
      where: { cohortId: { in: cohortIds }, completedAt: { not: null } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.cohortId, row._count._all]));
  }

  async listForFacilitator(facilitatorId: string): Promise<CohortSummary[]> {
    const cohorts = await this.prisma.cohort.findMany({
      where: { facilitatorId },
      include: summaryInclude,
      orderBy: { createdAt: "desc" },
    });
    const completed = await this.completedCounts(cohorts.map((cohort) => cohort.id));
    return cohorts.map((cohort) => toSummary(cohort, completed.get(cohort.id) ?? 0));
  }

  /** Returns 404 for classes owned by someone else, so IDs can't be probed. */
  async getForFacilitator(facilitatorId: string, cohortId: string): Promise<CohortSummary> {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, facilitatorId },
      include: summaryInclude,
    });
    if (!cohort) throw apiError(HttpStatus.NOT_FOUND, "Class not found.");
    const completed = await this.completedCounts([cohort.id]);
    return toSummary(cohort, completed.get(cohort.id) ?? 0);
  }

  async create(facilitatorId: string, request: CreateCohortRequest): Promise<CohortSummary> {
    // A collision among 31^6 (~887 million) codes is rare; retry a few times anyway.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const cohort = await this.prisma.cohort.create({
          data: {
            facilitatorId,
            name: request.name,
            term: request.term,
            teamSize: request.teamSize,
            joinCode: generateJoinCode(),
          },
          include: summaryInclude,
        });
        return toSummary(cohort, 0);
      } catch (error) {
        const isJoinCodeCollision =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!isJoinCodeCollision) throw error;
      }
    }
    throw apiError(HttpStatus.SERVICE_UNAVAILABLE, "Could not create a unique join code. Try again.");
  }
}

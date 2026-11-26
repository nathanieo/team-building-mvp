import { HttpStatus, Injectable } from "@nestjs/common";
import type { JoinClassInfo } from "@team-building-mvp/contracts";
import { apiError } from "../http/errors.js";
import { PrismaService } from "../prisma/prisma.service.js";

/** Finds classes by their join code, for students who haven't logged in yet. */
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
}

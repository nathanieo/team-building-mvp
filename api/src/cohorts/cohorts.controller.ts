import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { validateCreateCohortRequest } from "@team-building-mvp/contracts";
import type { CohortListResponse, CohortResponse, Facilitator } from "@team-building-mvp/contracts";
import { CurrentFacilitator, FacilitatorGuard } from "../auth/facilitator.guard.js";
import { apiError, validationError } from "../http/errors.js";
import { CohortsService } from "./cohorts.service.js";

/** Facilitator-only class management. Every query is scoped to the logged-in facilitator. */
@Controller("cohorts")
@UseGuards(FacilitatorGuard)
export class CohortsController {
  constructor(private readonly cohorts: CohortsService) {}

  @Get()
  async list(@CurrentFacilitator() facilitator: Facilitator): Promise<CohortListResponse> {
    return { cohorts: await this.cohorts.listForFacilitator(facilitator.id) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentFacilitator() facilitator: Facilitator,
    @Body() body: unknown,
  ): Promise<CohortResponse> {
    const validation = validateCreateCohortRequest(body);
    if (!validation.ok) throw validationError(validation.errors);
    return { cohort: await this.cohorts.create(facilitator.id, validation.value) };
  }

  @Get(":cohortId")
  async get(
    @CurrentFacilitator() facilitator: Facilitator,
    @Param(
      "cohortId",
      new ParseUUIDPipe({ exceptionFactory: () => apiError(HttpStatus.NOT_FOUND, "Class not found.") }),
    )
    cohortId: string,
  ): Promise<CohortResponse> {
    return { cohort: await this.cohorts.getForFacilitator(facilitator.id, cohortId) };
  }
}

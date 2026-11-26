import { Controller, Get, Param } from "@nestjs/common";
import { normalizeJoinCode } from "@team-building-mvp/contracts";
import type { JoinClassResponse } from "@team-building-mvp/contracts";
import { JoinService } from "./join.service.js";

/** Public routes for students joining a class with its code. No login needed. */
@Controller("join")
export class JoinController {
  constructor(private readonly join: JoinService) {}

  @Get(":code")
  async lookup(@Param("code") rawCode: string): Promise<JoinClassResponse> {
    const code = normalizeJoinCode(rawCode);
    return { cohort: await this.join.findClass(code) };
  }
}
